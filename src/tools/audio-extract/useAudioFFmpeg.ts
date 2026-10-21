import { useCallback, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
// Bundled locally by Vite — no CDN, so the page works offline once loaded.
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'

/**
 * The audio extractor's engine. One ffmpeg.wasm instance, loaded lazily, jobs strictly
 * sequential: pull the first audio stream out of a video (or audio) file and write it as
 * WAV or MP3. Nothing is uploaded — the file goes into the wasm filesystem and comes back
 * as a Blob.
 */

export type AudioFormat = 'wav' | 'mp3'

export interface FormatSpec {
  /** Output extension, also what the row name resolves to. */
  ext: string
  mime: string
  /** Segmented-control label. */
  label: string
  /** One line under the label — what you get and why you'd pick it. */
  hint: string
  /** Encoder arguments; input/output and `-vn` are added by the converter. */
  args: string[]
}

export const FORMATS: Record<AudioFormat, FormatSpec> = {
  wav: {
    ext: 'wav',
    mime: 'audio/wav',
    label: 'WAV',
    hint: 'Uncompressed 16-bit PCM at the source sample rate. Lossless and accepted by every editor — but big files.',
    args: ['-c:a', 'pcm_s16le'],
  },
  mp3: {
    ext: 'mp3',
    mime: 'audio/mpeg',
    label: 'MP3',
    hint: '192 kbps MP3. A small file that plays on anything — the choice when size or compatibility matters.',
    args: ['-c:a', 'libmp3lame', '-b:a', '192k'],
  },
}

export const FORMAT_IDS = Object.keys(FORMATS) as AudioFormat[]

export interface AudioConvertHandlers {
  onPhase?: (phase: string) => void
  onProgress?: (progress: number) => void
  onLog?: (line: string) => void
}

export interface AudioConvertResult {
  blob: Blob
  /** Seconds this job took, FFmpeg engine load included. */
  elapsed: number
  /** Source duration in seconds, when ffmpeg reported one. */
  duration: number | null
}

export class CancelledError extends Error {
  constructor() {
    super('Cancelled')
    this.name = 'CancelledError'
  }
}

// ffmpeg.wasm's linear memory only ever grows inside one engine instance, so a long batch of
// large videos can eventually trap with "memory access out of bounds". Bouncing the worker
// (terminate, reload on next use) resets that ceiling — cheap, because the core is in the
// browser cache — and a trapped instance is unusable anyway.
const RECYCLE_EVERY_FILES = 4
const RECYCLE_EVERY_BYTES = 1_000_000_000 // ~1 GB of source video since the last recycle
const BIG_FILE_BYTES = 500_000_000 // recycle right after anything this big

const isFatalWasmError = (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  return /memory access out of bounds|RuntimeError|Aborted|unreachable/i.test(message)
}

/** `.mp4` -> `.mp4`, `.mkv` -> `.mkv`: ffmpeg picks its demuxer from the extension. */
const sourceExt = (name: string) => (name.match(/\.[a-z0-9]+$/i) ?? ['.bin'])[0].toLowerCase()

/** `Duration: 00:02:07.42` from an `ffmpeg -i` probe -> 127.42 */
function parseDuration(lines: string[]): number | null {
  for (const line of lines) {
    const m = line.match(/Duration:\s*(\d+):(\d\d):(\d\d(?:\.\d+)?)/)
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
  }
  return null
}

export function useAudioFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const loadingRef = useRef<Promise<FFmpeg> | null>(null)
  const handlersRef = useRef<AudioConvertHandlers>({})
  const cancelledRef = useRef(false)
  const processedRef = useRef({ count: 0, bytes: 0 }) // since the last recycle
  const [engine, setEngine] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  const load = useCallback(async (): Promise<FFmpeg> => {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current
    if (loadingRef.current) return loadingRef.current

    setEngine('loading')
    const ffmpeg = new FFmpeg()
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
      format: AudioFormat,
      handlers: AudioConvertHandlers = {},
    ): Promise<AudioConvertResult> => {
      cancelledRef.current = false
      handlersRef.current = handlers
      const t0 = performance.now()
      handlers.onPhase?.('Loading FFmpeg…')
      const ffmpeg = await load()
      if (cancelledRef.current) throw new CancelledError()

      const spec = FORMATS[format]
      const id = Math.random().toString(36).slice(2, 8)
      const input = `in_${id}${sourceExt(file.name)}`
      const output = `out_${id}.${spec.ext}`
      let duration: number | null = null

      try {
        handlers.onPhase?.('Reading file…')
        await ffmpeg.writeFile(input, await fetchFile(file))

        // Probe: `ffmpeg -i` with no output lists the streams and exits non-zero (expected).
        const probeLog: string[] = []
        handlersRef.current = { ...handlers, onLog: (l) => (probeLog.push(l), handlers.onLog?.(l)) }
        await ffmpeg.exec(['-hide_banner', '-i', input])
        handlersRef.current = handlers
        if (!probeLog.some((line) => /Stream #\d+:\d+.*: Audio:/.test(line))) {
          throw new Error('This file has no audio track to extract.')
        }
        duration = parseDuration(probeLog)
        handlers.onLog?.(`--- audio -> ${spec.label}, ${duration ? `${duration.toFixed(1)}s` : 'unknown length'} ---`)

        handlers.onPhase?.('Extracting audio…')
        // `-vn` drops the video outright; `-map 0:a:0` takes the first audio stream, so a file
        // with several tracks (commentary, languages) still yields one predictable output.
        const code = await ffmpeg.exec([
          '-hide_banner',
          '-i', input,
          '-vn',
          '-map', '0:a:0',
          ...spec.args,
          output,
        ])
        if (code !== 0) throw new Error(`FFmpeg exited with code ${code}.`)

        const data = await ffmpeg.readFile(output)
        const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
        if (!bytes.length) throw new Error('FFmpeg produced an empty file.')
        // .buffer, not the view: ffmpeg's FS hands back a whole-file array (byteOffset 0).
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: spec.mime })
        return { blob, elapsed: (performance.now() - t0) / 1000, duration }
      } catch (err) {
        if (cancelledRef.current) throw new CancelledError()
        // A wasm trap leaves the instance unreliable for every file after it — recycle now so
        // the failure can't cascade onto the next job.
        if (isFatalWasmError(err)) recycle()
        throw err
      } finally {
        handlersRef.current = {}
        if (ffmpeg.loaded) {
          await ffmpeg.deleteFile(input).catch(() => {})
          await ffmpeg.deleteFile(output).catch(() => {})
        }
      }
    },
    [load, recycle],
  )

  /** Call after a finished job: keeps the wasm heap from climbing across a long batch. */
  const maybeRecycle = useCallback(
    (file: File) => {
      processedRef.current.count += 1
      processedRef.current.bytes += file.size
      if (
        file.size >= BIG_FILE_BYTES ||
        processedRef.current.count >= RECYCLE_EVERY_FILES ||
        processedRef.current.bytes >= RECYCLE_EVERY_BYTES
      ) {
        recycle()
      }
    },
    [recycle],
  )

  const cancel = useCallback(() => {
    cancelledRef.current = true
    recycle() // rejects the in-flight exec() by killing the worker
  }, [recycle])

  return { convert, maybeRecycle, cancel, engine }
}
