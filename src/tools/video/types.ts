/**
 * Shared types for the video → MP4 converter kit (`src/tools/video/`), used by
 * both the TS → MP4 and the MOV → MP4 tools.
 */

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
  /** First-frame JPEG for the row thumbnail, when the format asks for posters. */
  poster?: Blob
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
  /** Filename minus its source extension — the base of the row name and the .mp4 name. */
  stem: string
  status: JobStatus
  phase: JobPhase | null
  progress: number
  result: JobResult | null
  error: string
  /** User-edited display name (spaces allowed), or null to use the original. */
  customName: string | null
  /** A sidecar was added for this recording (DVR `.star` files — TS tool only). */
  starred: boolean
  /** Object URL of a frame pulled from the source, when the format asks for posters. */
  poster: string | null
}

export interface ConvertHandlers {
  onPhase?: (phase: JobPhase) => void
  onProgress?: (progress: number) => void
  onLog?: (line: string) => void
}

/**
 * Everything that differs between one converter and another. A tool page is a
 * `ConvertQueue` plus one of these; the queue itself knows nothing about .ts or
 * .mov — only what the spec says.
 */
export interface VideoToolSpec {
  /** Tool id — also the localStorage namespace for favorites and dismissed names. */
  id: string
  title: string
  /** Lede under the title. */
  sub: string
  /** What goes in the `<input accept>`: sources, thumbnails, sidecars. */
  accept: string
  /** Extensions this tool converts. Anything else dropped is skipped with a toast. */
  isSource: (name: string) => boolean
  /** Consume same-named .jpg/.png files as row thumbnails instead of queueing them. */
  pairImages: boolean
  /**
   * A file that flags its source instead of being queued (the DVR `.star` sidecar).
   * `key` maps a sidecar filename onto the source key it applies to.
   */
  sidecar?: { matches: (name: string) => boolean; key: (name: string) => string }
  /** Extension(s) dropped when building a row name and the output filename. */
  stripExt: RegExp
  /** Files under this size are skipped on add; 0 accepts anything. */
  minSizeMB: number
  /** How sources are named in skip messages, e.g. ".ts". */
  sourceNoun: string
  /**
   * The container frames copied AAC as ADTS, so MP4 needs the aac_adtstoasc
   * bitstream fix (MPEG-TS). QuickTime containers carry the AudioSpecificConfig
   * already, and passing the filter there is an error.
   */
  adtsAudio: boolean
  /** Pull one frame out of each source and use it as that row's thumbnail. */
  posters: boolean
  /** Conversion methods offered, in segmented-control order. */
  modes: { value: ConvertMode; label: string; hint: string }[]
  /** Line under the drop zone. */
  dropTitle: string
  /** Small notes under `dropTitle`. */
  dropNotes: string[]
  /** Paragraph below the queue. */
  note: string
  /** Default name for the "Download all" .zip. */
  zipDefault: string
}