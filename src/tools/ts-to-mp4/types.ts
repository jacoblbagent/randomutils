/** Shared types for the TS → MP4 tool. */

export type ConvertMode = 'auto' | 'remux' | 'encode'

export type JobStatus = 'queued' | 'converting' | 'done' | 'error'

/** What the converter is doing right now — surfaced in the row's meta line. */
export type JobPhase = 'loading' | 'reading' | 'remux' | 'encode'

/** Per-stream decision: copy as-is when the player can take it, otherwise re-encode. */
export type VideoPlan = 'copy-avc1' | 'copy-hvc1' | 'encode'
export type AudioPlan = 'copy-aac' | 'copy' | 'encode' | 'none'

export interface StreamInfo {
  video: string | null
  pixFmt: string | null
  audio: string | null
}

export interface ConvertPlan {
  video: VideoPlan
  audio: AudioPlan
}

/** What `convert()` resolves with. */
export interface ConvertResult {
  blob: Blob
  mode: ConvertMode
}

/** A finished conversion, as held on the job. */
export interface JobResult {
  url: string
  blob: Blob
  size: number
  name: string
  mode: ConvertMode
  seconds: number
}

export interface Job {
  id: number
  file: File
  status: JobStatus
  phase: JobPhase | null
  progress: number
  result: JobResult | null
  error: string
  /** User-edited display name (spaces allowed), or null to use the original. */
  customName: string | null
  /** A `.star` sidecar was added for this recording. */
  starred: boolean
}

export interface ConvertHandlers {
  onPhase?: (phase: JobPhase) => void
  onProgress?: (progress: number) => void
  onLog?: (line: string) => void
}
