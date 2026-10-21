import type { VideoToolSpec } from '../video/types'
import { baseKey } from '../video/utils'

/**
 * The TS → MP4 spec: everything the shared converter queue needs to know about MPEG transport
 * stream recordings. The queue itself is format-agnostic (see `src/tools/video/`).
 */

const TS_RE = /\.(ts|mts|m2ts)$/i

// Some recordings carry a "star" sidecar from the DVR — "hdz_0000.ts.star.txt" (or just
// "hdz_0000.ts.star") sitting next to "hdz_0000.ts". It's consumed as a flag on the matching
// .ts (never queued itself), and the flag rides along into the row name and the .mp4 filename.
const STAR_RE = /\.star(\.[^.]+)?$/i

// .ts files smaller than this are ignored when added. Decimal MB to match macOS Finder.
export const MIN_SIZE_MB = 50

export const TS_SPEC: VideoToolSpec = {
  id: 'ts-to-mp4',
  title: 'TS → MP4',
  sub: 'Batch convert MPEG transport stream (.ts) recordings to MP4. Everything runs in the browser with FFmpeg (WebAssembly) — your videos never leave this machine.',
  accept: '.ts,.mts,.m2ts,video/mp2t,.jpg,.jpeg,.png,image/jpeg,image/png,.txt,.star,text/plain',
  isSource: (name) => TS_RE.test(name),
  pairImages: true,
  sidecar: {
    matches: (name) =>
      !TS_RE.test(name) && STAR_RE.test(name) && TS_RE.test(name.replace(STAR_RE, '')),
    key: (name) => baseKey(name.replace(STAR_RE, '')),
  },
  stripExt: TS_RE,
  minSizeMB: MIN_SIZE_MB,
  sourceNoun: '.ts',
  // ADTS AAC in an MPEG-TS stream has to be rewritten into MP4-style AAC when copied.
  adtsAudio: true,
  // DVRs ship a same-named .jpg next to each recording, so no frame extraction is needed.
  posters: false,
  dropTitle: 'Drop .ts files here',
  dropNotes: [
    'or click to browse — you can add more while a batch runs.',
    `Under ${MIN_SIZE_MB} MB is skipped. Pair a same-named .jpg to use as its thumbnail.`,
  ],
  modes: [
    { value: 'auto', label: 'Auto', hint: "Copies what macOS can play as-is, re-encodes only what it can't." },
    { value: 'remux', label: 'Stream copy', hint: 'Seconds, lossless. Fails if the video must be re-encoded to play on a Mac.' },
    { value: 'encode', label: 'Re-encode', hint: 'H.264 + AAC. Works for any input, but much slower.' },
  ],
  note: 'Files convert one at a time; each input and output sits in browser memory, so single files over ~2 GB may fail. “Download all” bundles every converted file into one .zip.',
  zipDefault: 'converted-videos',
}