import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { Link } from 'react-router-dom'
import { IconArrowLeft, IconDownload, IconX } from '../../icons/Icons'
import {
  CancelledError,
  FORMATS,
  FORMAT_IDS,
  useAudioFFmpeg,
  type AudioFormat,
} from './useAudioFFmpeg'
import './AudioExtract.css'

/**
 * Video → Audio: drop a video (or audio) file in, pick WAV or MP3, get the audio track back
 * as a download. The whole thing runs on ffmpeg.wasm inside this tab — no upload, no backend,
 * the file never leaves the machine.
 */

// Drag-and-drop ignores the input's `accept`, so the same list is enforced in code. Extensions
// cover the containers browsers don't know (.mkv, .avi, .flv, .ts …); audio inputs are allowed
// too — extracting the audio of an audio file is just a format conversion.
const MEDIA_RE =
  /\.(mp4|m4v|mov|qt|mkv|webm|avi|divx|flv|wmv|mpg|mpeg|m2ts|mts|ts|3gp|3g2|ogv|vob|mxf|mp3|wav|m4a|aac|flac|ogg|oga|opus|wma|aif|aiff|amr)$/i

const isMedia = (file: File) =>
  MEDIA_RE.test(file.name) || file.type.startsWith('video/') || file.type.startsWith('audio/')

const ACCEPT =
  'video/*,audio/*,.mkv,.avi,.divx,.flv,.wmv,.ts,.mts,.m2ts,.mpg,.mpeg,.3gp,.ogv,.m4v,.vob,.mxf'

const stemOf = (name: string) => name.replace(/\.[^.]+$/, '').trim() || 'audio'

/** Filenames are swapped to dashes on download — same convention as the video tools. */
const downloadName = (job: Job, ext: string) =>
  `${stemOf(job.stem).replace(/\s+/g, '-')}.${ext}`

type JobStatus = 'queued' | 'working' | 'done' | 'error'

interface JobResult {
  url: string
  blob: Blob
  size: number
  /** Output extension — the job keeps the format it was run with, even if the radio moves on. */
  ext: string
  name: string
  elapsed: number
}

interface Job {
  id: number
  file: File
  stem: string
  status: JobStatus
  progress: number
  phase: string
  error: string
  result: JobResult | null
}

const formatBytes = (n: number) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1000)), u.length - 1)
  return `${(n / 1000 ** i).toFixed(i ? 1 : 0)} ${u[i]}`
}

// Decimal MB, matching the video tools and Finder.
const mb = (n: number) => `${(n / 1_000_000).toFixed(1)} MB`

const PHASE_ORDER = ['Loading FFmpeg…', 'Reading file…', 'Extracting audio…']

export default function AudioExtract() {
  const { convert, maybeRecycle, cancel, engine } = useAudioFFmpeg()
  const [jobs, setJobs] = useState<Job[]>([])
  const [format, setFormat] = useState<AudioFormat>('wav')
  const [running, setRunning] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [skipped, setSkipped] = useState('')
  const [zipping, setZipping] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const nextId = useRef(1)
  const jobsRef = useRef(jobs)
  jobsRef.current = jobs

  const patch = useCallback((id: number, changes: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...changes } : j)))
  }, [])

  // Warn before reload / close / navigating away while there are files in the list.
  useEffect(() => {
    if (!jobs.length) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [jobs.length])

  // Revoke every object URL on unmount.
  useEffect(
    () => () => {
      jobsRef.current.forEach((j) => j.result && URL.revokeObjectURL(j.result.url))
    },
    [],
  )

  const addFiles = (list: FileList | null) => {
    const files = Array.from(list ?? [])
    const good = files.filter(isMedia)
    const bad = files.filter((f) => !isMedia(f))
    setSkipped(
      bad.length
        ? `Skipped ${bad.length} file${bad.length > 1 ? 's' : ''} that ${bad.length > 1 ? "aren't" : "isn't"} a video or audio file: ${bad
            .map((f) => f.name)
            .slice(0, 3)
            .join(', ')}${bad.length > 3 ? '…' : ''}`
        : '',
    )
    if (!good.length) return
    const known = new Set(jobsRef.current.map((j) => `${j.file.name}:${j.file.size}`))
    const fresh = good.filter((f) => !known.has(`${f.name}:${f.size}`))
    const dupes = good.length - fresh.length
    if (dupes) {
      setSkipped(
        (prev) => `${prev ? `${prev} ` : ''}${dupes} file${dupes > 1 ? 's were' : ' was'} already in the list.`,
      )
    }
    if (!fresh.length) return
    const added: Job[] = fresh.map((file) => ({
      id: nextId.current++,
      file,
      stem: stemOf(file.name),
      status: 'queued',
      progress: 0,
      phase: '',
      error: '',
      result: null,
    }))
    setJobs((prev) => [...prev, ...added])
  }

  // Queue runner: one job at a time, ffmpeg.wasm can't take two.
  useEffect(() => {
    if (!running || activeId !== null) return
    const next = jobs.find((j) => j.status === 'queued')
    if (!next) {
      setRunning(false)
      return
    }

    setActiveId(next.id)
    patch(next.id, { status: 'working', progress: 0, error: '', phase: PHASE_ORDER[0] })
    const log: string[] = []

    convert(next.file, format, {
      onPhase: (phase) => patch(next.id, { phase }),
      onProgress: (progress) => patch(next.id, { progress }),
      onLog: (line) => {
        log.push(line)
        if (log.length > 500) log.splice(0, 100)
      },
    })
      .then(({ blob, elapsed }) => {
        patch(next.id, {
          status: 'done',
          progress: 1,
          phase: '',
          result: {
            url: URL.createObjectURL(blob),
            blob,
            size: blob.size,
            ext: FORMATS[format].ext,
            name: downloadName(next, FORMATS[format].ext),
            elapsed,
          },
        })
        maybeRecycle(next.file)
      })
      .catch((err: unknown) => {
        if (err instanceof CancelledError) {
          patch(next.id, { status: 'queued', progress: 0, phase: '' })
        } else {
          console.error(`[audio-extract] ${next.file.name} failed:`, err, '\n' + log.join('\n'))
          patch(next.id, {
            status: 'error',
            phase: '',
            error: err instanceof Error ? err.message : String(err),
          })
        }
      })
      .finally(() => setActiveId(null))
  }, [running, activeId, jobs, format, convert, maybeRecycle, patch])

  const startBatch = () => setRunning(true)

  const stop = () => {
    setRunning(false)
    cancel()
  }

  const remove = (id: number) => {
    if (id === activeId) return
    setJobs((prev) => {
      const job = prev.find((j) => j.id === id)
      if (job?.result) URL.revokeObjectURL(job.result.url)
      return prev.filter((j) => j.id !== id)
    })
  }

  const retry = (id: number) => {
    patch(id, { status: 'queued', error: '', progress: 0 })
    if (!running) startBatch()
  }

  const clearFinished = () => {
    setJobs((prev) => {
      prev.filter((j) => j.status === 'done').forEach((j) => j.result && URL.revokeObjectURL(j.result.url))
      return prev.filter((j) => j.status !== 'done')
    })
  }

  const zipAndDownload = async (list: Job[]) => {
    if (!list.length) return
    setZipping(true)
    try {
      const zip = new JSZip()
      const used = new Map<string, number>()
      for (const job of list) {
        let name = job.result!.name
        const n = (used.get(name) ?? 0) + 1
        used.set(name, n)
        if (n > 1) name = name.replace(/(\.[a-z0-9]+)?$/i, (ext) => ` (${n})${ext}`)
        zip.file(name, job.result!.blob)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'extracted-audio.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } finally {
      setZipping(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<JobStatus, number> = { queued: 0, working: 0, done: 0, error: 0 }
    for (const j of jobs) c[j.status] += 1
    return c
  }, [jobs])

  const total = jobs.length
  const finished = counts.done + counts.error
  const active = jobs.find((j) => j.id === activeId) ?? null
  const overall = total ? (finished + (active ? active.progress : 0)) / total : 0
  const ext = FORMATS[format].ext

  return (
    <div className="ax">
      <header className="ax-head">
        <Link className="ax-head__back" to="/">
          <IconArrowLeft />
          All tools
        </Link>
        <h1>Video → Audio</h1>
        <p className="ax-head__sub">
          Pull the audio track out of a video and download it as WAV or MP3. Everything runs in
          this tab with FFmpeg (WebAssembly) — no upload, no server, your file never leaves this
          machine.
        </p>
      </header>

      <section
        className={`ax-drop${dragging ? ' drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <strong>Drop video files here</strong>
        <span className="ax-note">or click to browse — you can add more while a batch runs.</span>
        <span className="ax-note">
          MP4, MOV, MKV, WebM, AVI, FLV, TS and more. Audio files work too.
        </span>
      </section>

      {skipped && (
        <p className="ax-skip small-note">
          {skipped}{' '}
          <button className="link" onClick={() => setSkipped('')}>
            Dismiss
          </button>
        </p>
      )}

      <fieldset className="ax-formats" disabled={running}>
        <legend>Output format</legend>
        <div className="ax-segmented">
          {FORMAT_IDS.map((id) => (
            <label key={id} className={format === id ? 'on' : ''}>
              <input
                type="radio"
                name="format"
                value={id}
                checked={format === id}
                onChange={() => setFormat(id)}
              />
              <span className="ax-seg-label">{FORMATS[id].label}</span>
              <span className="ax-seg-hint">{FORMATS[id].hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {total > 0 && (
        <section className="ax-batch">
          <div className="ax-batch-head">
            <div className="ax-batch-status">
              {running && active ? (
                <>
                  <strong>
                    Extracting {jobs.indexOf(active) + 1} of {total}
                  </strong>
                  <span className="muted ellipsis">{active.file.name}</span>
                </>
              ) : (
                <strong>
                  {total} file{total > 1 ? 's' : ''}
                  <span className="chips">
                    {counts.done > 0 && <span className="chip">{counts.done} done</span>}
                    {counts.error > 0 && <span className="chip">{counts.error} failed</span>}
                    {counts.queued > 0 && <span className="chip">{counts.queued} queued</span>}
                  </span>
                </strong>
              )}
              {!running && engine === 'loading' && <span className="small-note">Loading FFmpeg…</span>}
            </div>
            <div className="ax-actions">
              {running ? (
                <button className="secondary small" onClick={stop}>
                  Stop
                </button>
              ) : (
                counts.queued > 0 && (
                  <button className="primary small" onClick={startBatch}>
                    {counts.queued === 1 ? `Extract as ${ext.toUpperCase()}` : `Extract ${counts.queued} files`}
                  </button>
                )
              )}
              {counts.done > 1 && (
                <button
                  className="secondary small"
                  onClick={() => zipAndDownload(jobs.filter((j) => j.status === 'done'))}
                  disabled={zipping}
                >
                  {zipping ? 'Zipping…' : `Download all as .zip (${counts.done})`}
                </button>
              )}
              {counts.done > 0 && !running && (
                <button className="link" onClick={clearFinished}>
                  Clear done
                </button>
              )}
            </div>
          </div>

          {(running || finished > 0) && (
            <div className="bar thin" aria-label="Overall progress">
              <div style={{ transform: `scaleX(${overall})` }} />
            </div>
          )}

          <ul className="ax-jobs">
            {jobs.map((job) => {
              const index = PHASE_ORDER.indexOf(job.phase)
              return (
                <li
                  key={job.id}
                  className={`ax-job ${job.status}${job.id === activeId ? ' active' : ''}`}
                >
                  <div className="ax-job-main">
                    <div className="ax-job-info">
                      <div className="ax-job-name">
                        <span className="ellipsis">
                          {job.stem}
                          <span className="ax-ext">.{job.result?.ext ?? ext}</span>
                        </span>
                      </div>
                      <div className="ax-job-meta">
                        {job.status === 'done' && job.result ? (
                          <>
                            {mb(job.file.size)} → {formatBytes(job.result.size)} · done in{' '}
                            {job.result.elapsed < 0.1 ? '<0.1' : job.result.elapsed.toFixed(1)}s
                          </>
                        ) : job.status === 'error' ? (
                          <span className="ax-error">{job.error}</span>
                        ) : job.status === 'working' ? (
                          <>
                            {job.phase}
                            {index > 0 ? ` · step ${index + 1} of ${PHASE_ORDER.length}` : ''}
                          </>
                        ) : (
                          <>{mb(job.file.size)} · queued</>
                        )}
                      </div>
                    </div>
                    <div className="ax-job-actions">
                      {job.status === 'done' && job.result && (
                        <a
                          className="secondary small"
                          href={job.result.url}
                          download={job.result.name}
                          title={`Download ${job.result.name}`}
                        >
                          <IconDownload />
                          {job.result.ext.toUpperCase()}
                        </a>
                      )}
                      {job.status === 'error' && (
                        <button className="secondary small" onClick={() => retry(job.id)}>
                          Retry
                        </button>
                      )}
                      <button
                        className="icon"
                        onClick={() => remove(job.id)}
                        disabled={job.id === activeId}
                        aria-label={`Remove ${job.file.name}`}
                        title="Remove from list"
                      >
                        <IconX />
                      </button>
                    </div>
                  </div>
                  {(job.status === 'working' || (job.status === 'done' && job.progress < 1)) && (
                    <div className="bar thin" aria-label={`Progress for ${job.file.name}`}>
                      <div style={{ transform: `scaleX(${job.progress})` }} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="ax-note muted">
        Files are processed one at a time, entirely in browser memory, so a single video over
        ~2 GB may fail. The first file loads the ~31 MB FFmpeg core (cached by the browser
        afterwards). Audio is taken from the first audio track and re-encoded — WAV keeps the
        source sample rate, MP3 is 192 kbps.
      </p>
    </div>
  )
}
