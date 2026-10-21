import { useCallback, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
// Bundled locally by Vite — no CDN required.
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'
import type { ConvertHandlers, ConvertMode, ConvertPlan, ConvertResult, StreamInfo } from './types'

/*
 * macOS QuickTime / Quick Look are much pickier than browsers about what's inside an MP4:
 *  - H.264 must be 8-bit 4:2:0 (High 10 / 4:2:2 / 4:4:4 won't open)
 *  - H.265 must be tagged `hvc1` (ffmpeg's default `hev1` won't open)
 *  - audio should be AAC or MP3 (MP2, AC-3, PCM, ALAC, Opus etc. won't play)
 * So each file is probed first and only the parts that need it are re-encoded.
 * The same rules cover QuickTime sources: ProRes, DV, Motion JPEG and PCM/ALAC audio
 * are all "must re-encode", while H.264/HEVC + AAC copy straight across.
 */

/** Parse `ffmpeg -i` output for the first video and audio stream. */
export function parseStreams(lines: string[]): StreamInfo {
  const info: StreamInfo = { video: null, pixFmt: null, audio: null }
  for (const line of lines) {
    if (!info.video) {
      const m = line.match(/Stream #\d+:\d+.*?: Video: (\w+)[^,]*, ([a-z0-9]+)/)
      if (m) [, info.video, info.pixFmt] = m
    }
    if (!info.audio) {
      const m = line.match(/Stream #\d+:\d+.*?: Audio: (\w+)/)
      if (m) info.audio = m[1]
    }
  }
  return info
}

const MAC_H264_PIX = ['yuv420p', 'yuvj420p']
const MAC_HEVC_PIX = ['yuv420p', 'yuvj420p', 'yuv420p10le']

/** Decide per stream: copy (fast, lossless) when macOS can play it as-is, otherwise re-encode. */
export function planFor(info: StreamInfo): ConvertPlan {
  const pix = info.pixFmt ?? ''
  let video: ConvertPlan['video'] = 'encode'
  if (info.video === 'h264' && MAC_H264_PIX.includes(pix)) video = 'copy-avc1'
  if (info.video === 'hevc' && MAC_HEVC_PIX.includes(pix)) video = 'copy-hvc1'

  let audio: ConvertPlan['audio'] = 'encode'
  if (!info.audio) audio = 'none'
  else if (info.audio === 'aac') audio = 'copy-aac'
  else if (info.audio === 'mp3') audio = 'copy'

  return { video, audio }
}

const X264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-tag:v', 'avc1']

export function argsFor(i: string, o: string, plan: ConvertPlan, adtsAudio: boolean): string[] {
  const v: Record<ConvertPlan['video'], string[]> = {
    'copy-avc1': ['-c:v', 'copy', '-tag:v', 'avc1'],
    'copy-hvc1': ['-c:v', 'copy', '-tag:v', 'hvc1'],
    encode: X264,
  }
  const a: Record<ConvertPlan['audio'], string[]> = {
    // ADTS AAC (MPEG-TS) needs rewriting into MP4-style AAC; in a QuickTime container the
    // AudioSpecificConfig is already there, and the filter would fail.
    'copy-aac': ['-c:a', 'copy', ...(adtsAudio ? ['-bsf:a', 'aac_adtstoasc'] : [])],
    copy: ['-c:a', 'copy'],
    encode: ['-c:a', 'aac', '-b:a', '160k'],
    none: [],
  }
  return ['-i', i, '-map', '0:v:0?', '-map', '0:a?', ...v[plan.video], ...a[plan.audio], '-movflags', '+faststart', o]
}

const FULL_ENCODE: ConvertPlan = { video: 'encode', audio: 'encode' }

export class CancelledError extends Error {
  constructor() {
    super('Cancelled')
    this.name = 'CancelledError'
  }
}

// ffmpeg.wasm's linear memory only ever grows within one engine instance — deleting files frees
// the virtual filesystem but not the wasm heap ceiling, so a long batch of large files eventually
// traps with "RuntimeError: memory access out of bounds". Recycling (terminate + reload on the
// next file) resets that ceiling before it's hit, and after every file so the reload is cheap
// (the core is browser-cached). A trapped instance is also left unusable, so any fatal wasm error
// forces an immediate recycle too, instead of silently corrupting every file after it.
const RECYCLE_EVERY_FILES = 6
const RECYCLE_EVERY_BYTES = 1_000_000_000 // ~1 GB of source video since the last recycle

const isFatalWasmError = (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  return /memory access out of bounds|RuntimeError|Aborted|unreachable/i.test(message)
}

/** `.mov` -> `.mov`, `.ts` -> `.ts`: ffmpeg picks its demuxer from this, so keep the real one. */
const sourceExt = (name: string) => (name.match(/\.[a-z0-9]+$/i) ?? ['.bin'])[0].toLowerCase()

export interface FFmpegOptions {
  /** Copied AAC needs the aac_adtstoasc fix (MPEG-TS sources only). */
  adtsAudio: boolean
  /** Also pull a frame from each source, for use as its row thumbnail. */
  posters: boolean
}

/**
 * One ffmpeg.wasm instance, loaded lazily. Jobs must run one at a time.
 * convert(file, mode, { onProgress, onLog, onPhase }) -> { blob, mode, poster? }
 *   mode: 'auto' | 'remux' | 'encode'
 * cancel() kills the running job (terminates the worker; it reloads on next use).
 */
export function useFFmpeg({ adtsAudio, posters }: FFmpegOptions) {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const loadingRef = useRef<Promise<FFmpeg> | null>(null)
  const handlersRef = useRef<ConvertHandlers>({})
  const cancelledRef = useRef(false)
  const processedRef = useRef({ count: 0, bytes: 0 }) // since the last recycle
  const [engine, setEngine] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  const load = useCallback(async (): Promise<FFmpeg> => {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current
    if (loadingRef.current) return loadingRef.current

    setEngine('loading')
    const ffmpeg = new FFmpeg()
    // Route events to whichever job is currently running
    ffmpeg.on('log', ({ message }) => handlersRef.current.onLog?.(message))
    ffmpeg.on('progress', ({ progress }) => {
      if (Number.isFinite(progress)) {
        handlersRef.current.onProgress?.(Math.min(Math.max(progress, 0), 1))
      }
    })

    loadingRef.current = ffmpeg
      .load({ coreURL, wasmURL })
      .then(() => {
        ffmpegRef.current = ffmpeg
        setEngine('ready')
        return ffmpeg
      })
      .catch((err: unknown) => {
        setEngine('error')
        throw err
      })
      .finally(() => {
        loadingRef.current = null
      })

    return loadingRef.current
  }, [])

  // Force a fresh engine on the next convert(), without cancelling whatever the caller does next.
  const recycle = useCallback(() => {
    const ffmpeg = ffmpegRef.current
    ffmpegRef.current = null
    processedRef.current = { count: 0, bytes: 0 }
    setEngine('idle')
    if (ffmpeg) {
      try {
        ffmpeg.terminate()
      } catch {
        /* already dead */
      }
    }
  }, [])

  const convert = useCallback(
    async (
      file: File,
      mode: ConvertMode = 'auto',
      handlers: ConvertHandlers = {},
    ): Promise<ConvertResult> => {
      cancelledRef.current = false
      handlersRef.current = handlers
      handlers.onPhase?.('loading')
      const ffmpeg = await load()
      if (cancelledRef.current) throw new CancelledError()

      // Unique names so a terminated job can't collide with the next one
      const id = Math.random().toString(36).slice(2, 8)
      const input = `in_${id}${sourceExt(file.name)}`
      const output = `out_${id}.mp4`
      const poster = `poster_${id}.jpg`
      let result: ConvertResult | undefined

      try {
        handlers.onPhase?.('reading')
        await ffmpeg.writeFile(input, await fetchFile(file))

        // Probe: `ffmpeg -i` with no output lists the streams (and exits non-zero, which is expected)
        const probeLog: string[] = []
        handlersRef.current = { ...handlers, onLog: (l) => (probeLog.push(l), handlers.onLog?.(l)) }
        await ffmpeg.exec(['-hide_banner', '-i', input])
        handlersRef.current = handlers
        const info = parseStreams(probeLog)
        if (!info.video) throw new Error('No video stream found in this file.')

        let plan = mode === 'encode' ? FULL_ENCODE : planFor(info)
        if (mode === 'remux' && plan.video === 'encode') {
          throw new Error(
            `Its video (${info.video}, ${info.pixFmt}) can't be stream-copied into an MP4 that macOS can play. Use Auto or Re-encode.`,
          )
        }
        handlers.onLog?.(
          `--- ${info.video}/${info.pixFmt} + ${info.audio || 'no audio'} -> video ${plan.video}, audio ${plan.audio} ---`,
        )

        let used: ConvertMode = plan.video === 'encode' ? 'encode' : 'remux'
        handlers.onPhase?.(used)
        let code = await ffmpeg.exec(argsFor(input, output, plan, adtsAudio))

        if (code !== 0 && mode === 'auto' && plan !== FULL_ENCODE) {
          handlers.onLog?.('--- Copy failed, re-encoding everything ---')
          await ffmpeg.deleteFile(output).catch(() => {})
          handlers.onProgress?.(0)
          plan = FULL_ENCODE
          used = 'encode'
          handlers.onPhase?.(used)
          code = await ffmpeg.exec(argsFor(input, output, plan, adtsAudio))
        }

        if (code !== 0) throw new Error(`FFmpeg exited with code ${code}.`)
        const data = await ffmpeg.readFile(output)
        const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
        // .buffer, not the view: ffmpeg's FS hands back a whole-file array (byteOffset 0).
        result = { blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'video/mp4' }), mode: used }

        // Thumbnail, best-effort: a failure here must never mark a converted file as failed.
        // It has to run *before* the `finally` cleanup below — the source file is still in the
        // wasm filesystem at this point and is deleted the moment this try block exits.
        if (posters) {
          try {
            // One frame from a second in, scaled to about 4x the row's 64px box.
            const pcode = await ffmpeg.exec([
              '-hide_banner', '-ss', '1', '-i', input,
              '-frames:v', '1', '-vf', 'scale=256:-2', '-q:v', '4', poster,
            ])
            if (pcode === 0) {
              const pdata = await ffmpeg.readFile(poster)
              if (typeof pdata !== 'string' && pdata.length > 0) {
                result.poster = new Blob([pdata.buffer as ArrayBuffer], { type: 'image/jpeg' })
              }
            }
          } catch {
            /* no poster — the row shows the empty thumb box */
          }
        }
      } catch (err) {
        if (cancelledRef.current) throw new CancelledError()
        // A wasm trap leaves this instance unreliable for every file after it — recycle now so
        // the failure can't cascade onto the next one.
        if (isFatalWasmError(err)) recycle()
        throw err
      } finally {
        handlersRef.current = {}
        if (ffmpeg.loaded) {
          await ffmpeg.deleteFile(input).catch(() => {})
          await ffmpeg.deleteFile(output).catch(() => {})
          if (posters) await ffmpeg.deleteFile(poster).catch(() => {})
        }
      }

      // Healthy run: still recycle periodically so a long batch's memory ceiling never gets
      // the chance to climb high enough to trap in the first place.
      processedRef.current.count += 1
      processedRef.current.bytes += file.size
      if (
        processedRef.current.count >= RECYCLE_EVERY_FILES ||
        processedRef.current.bytes >= RECYCLE_EVERY_BYTES
      ) {
        recycle()
      }
      return result
    },
    [load, recycle, adtsAudio, posters],
  )

  const cancel = useCallback(() => {
    cancelledRef.current = true
    recycle() // rejects the in-flight exec() by killing the worker
  }, [recycle])

  return { convert, cancel, engine }
}