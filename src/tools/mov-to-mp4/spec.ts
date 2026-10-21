import type { VideoToolSpec } from '../video/types'

/**
 * The MOV → MP4 spec: everything the shared converter queue needs to know about QuickTime
 * movies. The queue itself is format-agnostic (see `src/tools/video/`).
 *
 * QuickTime is a real container, so the copy rules differ from MPEG-TS in two ways:
 *  - there's no ADTS AAC in here, so copied audio needs no bitstream fix (and passing
 *    aac_adtstoasc would fail outright);
 *  - what people drop in is far more varied — iPhone/screen-recording H.264 and HEVC copy
 *    straight across, while ProRes, DV, Motion JPEG and PCM/ALAC audio must be re-encoded.
 */

const MOV_RE = /\.(mov|qt)$/i

export const MOV_SPEC: VideoToolSpec = {
  id: 'mov-to-mp4',
  title: 'MOV → MP4',
  sub: 'Convert MOV to MP4 in your browser: batch QuickTime (.mov) video into MP4 that plays everywhere. H.264, HEVC and AAC are copied across untouched; camera formats like ProRes, DV and PCM audio are re-encoded. Everything runs with FFmpeg (WebAssembly) — your videos never leave this machine.',
  accept: '.mov,.qt,video/quicktime',
  isSource: (name) => MOV_RE.test(name),
  pairImages: false,
  stripExt: MOV_RE,
  // No floor: a .mov is already a finished file, and small ones (clips, exports) are normal.
  minSizeMB: 0,
  sourceNoun: '.mov',
  // QuickTime carries the AAC config inline; only MPEG-TS frames it as ADTS.
  adtsAudio: false,
  // Nothing ships a thumbnail beside a .mov, so pull a frame out of each video instead.
  posters: true,
  dropTitle: 'Drop .mov files here',
  dropNotes: [
    'or click to browse — you can add more while a batch runs.',
    'A frame from each video is used as its row thumbnail.',
  ],
  modes: [
    {
      value: 'auto',
      label: 'Auto',
      hint: 'Copies H.264, HEVC, AAC and MP3 as-is and re-encodes only what MP4 players refuse (ProRes, DV, PCM, ALAC…).',
    },
    {
      value: 'remux',
      label: 'Stream copy',
      hint: 'Seconds, lossless. Fails if the video or audio inside has to be re-encoded to play as MP4 — the usual case for ProRes and PCM.',
    },
    {
      value: 'encode',
      label: 'Re-encode',
      hint: 'H.264 + AAC. Works for any input, but much slower.',
    },
  ],
  note: 'Files convert one at a time; each input and output sits in browser memory, so single files over ~2 GB may fail. “Download all” bundles every converted file into one .zip.',
  zipDefault: 'converted-videos',
}