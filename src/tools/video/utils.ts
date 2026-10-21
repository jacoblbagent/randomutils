import type { Job, JobPhase, VideoToolSpec } from './types'

export const IMG_RE = /\.(jpe?g|png)$/i
export const isImage = (name: string) => IMG_RE.test(name)

/** Strip the extension and lowercase — how a file is matched to its thumbnail/sidecar. */
export const baseKey = (name: string) => name.replace(/\.[^.]+$/, '').trim().toLowerCase()

// Natural, case-insensitive name order like Finder: clip2 < clip10, "A" == "a"
const byName = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
export const compareFiles = (a: { name: string }, b: { name: string }) => byName.compare(a.name, b.name)
export const compareJobs = (a: Job, b: Job) => compareFiles(a.file, b.file) || a.id - b.id

// Decimal units (1 MB = 1,000,000 bytes), same as Finder, so sizes here match what you see there.
export const formatBytes = (n: number) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1000)), u.length - 1)
  return `${(n / 1000 ** i).toFixed(i ? 1 : 0)} ${u[i]}`
}

export const PHASE_LABEL: Record<JobPhase, string> = {
  loading: 'Loading FFmpeg…',
  reading: 'Reading file…',
  remux: 'Stream copying',
  encode: 'Re-encoding',
}

let nextId = 1

export const makeJob = (file: File, spec: VideoToolSpec): Job => ({
  id: nextId++,
  file,
  stem: file.name.replace(spec.stripExt, ''),
  status: 'queued', // queued | converting | done | error
  phase: null,
  progress: 0,
  result: null,
  error: '',
  customName: null,
  starred: false,
  poster: null,
})

// The name shown/edited for a job: the custom name if set, else the original filename minus its
// source extension — with "-star" appended when a sidecar flagged it. Spaces are kept here so
// editing stays natural; they're only swapped for "-" when a file actually gets downloaded
// (downloadFilename below).
export const baseName = (job: Job) => job.customName ?? job.stem + (job.starred ? '-star' : '')

export const downloadFilename = (job: Job) => baseName(job).trim().replace(/\s+/g, '-') + '.mp4'