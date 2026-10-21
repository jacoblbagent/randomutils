import type { Job, JobPhase } from './types'

export const TS_RE = /\.(ts|mts|m2ts)$/i
export const IMG_RE = /\.(jpe?g|png)$/i

// Some recordings carry a "star" sidecar from the DVR — "hdz_0000.ts.star.txt" (or just
// "hdz_0000.ts.star") sitting next to "hdz_0000.ts". It's consumed as a flag on the matching
// .ts (never queued itself), and the flag rides along into the row name and the .mp4 filename.
export const STAR_RE = /\.star(\.[^.]+)?$/i

// .ts files smaller than this are ignored when added. Decimal MB to match macOS Finder.
export const MIN_SIZE_MB = 50
export const MIN_SIZE_BYTES = MIN_SIZE_MB * 1000 * 1000

export const isTs = (name: string) => TS_RE.test(name)
export const isImage = (name: string) => IMG_RE.test(name)

/** A ".star" sidecar for a matching .ts — consumed as a flag, never queued. */
export const isStarSidecar = (name: string) =>
  !TS_RE.test(name) && STAR_RE.test(name) && TS_RE.test(name.replace(STAR_RE, ''))

// Strip the extension and any trailing modifier macOS/DVRs sometimes add (e.g. "hdz_0056 copy")
export const baseKey = (name: string) => name.replace(/\.[^.]+$/, '').trim().toLowerCase()

/** The recording a star sidecar refers to. */
export const starKey = (name: string) => baseKey(name.replace(STAR_RE, ''))

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

export const makeJob = (file: File): Job => ({
  id: nextId++,
  file,
  status: 'queued', // queued | converting | done | error
  phase: null,
  progress: 0,
  result: null,
  error: '',
  customName: null,
  starred: false,
})

// The name shown/edited for a job: the custom name if set, else the original filename minus its
// .ts extension — with "-star" appended when a .star sidecar flagged it. Spaces are kept here so
// editing stays natural; they're only swapped for "-" when a file actually gets downloaded
// (downloadFilename below).
export const baseName = (job: Job) =>
  job.customName ?? job.file.name.replace(TS_RE, '') + (job.starred ? '-star' : '')

export const downloadFilename = (job: Job) =>
  baseName(job).trim().replace(/\s+/g, '-') + '.mp4'
