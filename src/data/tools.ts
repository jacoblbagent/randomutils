/**
 * The tool registry — the single place a new tool is announced.
 *
 * Adding a tool: append an entry here and add its route in `App.tsx`. The home
 * page grid, the footer count, the related-tools links and (later) any
 * index/search all read this list.
 */
import { useMemo } from 'react'
import { useFlags, type FlagId } from '../config/flags'

/**
 * What the crawler-facing side of a tool page says. Kept next to the tool so
 * the card copy, the <title>, the description, the anchor text other pages use
 * and the structured-data featureList can never drift apart — and so each tool
 * gets copy written for it rather than one sentence clamped three ways.
 */
export interface ToolSeo {
  /**
   * Full <title>: the phrase someone would actually type first, then the
   * differentiator. Aim for 60 characters before the brand suffix, so search
   * results do not cut it off.
   */
  title: string
  /**
   * Meta description, hand-written to ~150 characters and distinct per tool.
   * Never left to a clamp: a trimmed sentence from `description` would end on
   * the same "runs on FFmpeg compiled to WebAssembly" tail for every tool.
   */
  description: string
  /** Noun phrase used as link text when another page points at this tool. */
  anchor: string
  /** What the structured-data block lists as `featureList`. */
  features: string[]
}

export interface Tool {
  /** Matches the route path and the project id in ~/Code/hermes-web-ui. */
  id: string
  name: string
  /** One line, shown under the name on the card. */
  tagline: string
  /** A sentence or two — what it does, and the one thing that makes it useful. */
  description: string
  /** Route path inside the hash router. */
  path: string
  tags: string[]
  /** Page title, meta description, link text and feature list. */
  seo: ToolSeo
  /**
   * Feature flag that ships this tool. Omitted = always on. With the flag off
   * the card, the footer count and the route all go away (see config/flags.ts).
   */
  flag?: FlagId
}

const NEVER_UPLOADS = 'No upload — the files never leave your machine'

export const tools: Tool[] = [
  {
    id: 'ts-to-mp4',
    name: 'TS → MP4',
    tagline: 'Batch convert .ts recordings to MP4',
    description:
      'Drop DVR and over-the-air captures in and get MP4s that open in QuickTime, stream-copied as fast as the source allows. Runs on FFmpeg compiled to WebAssembly — the files never leave your machine.',
    path: '/ts-to-mp4',
    tags: ['Video', 'FFmpeg', 'Offline'],
    flag: 'ts-to-mp4',
    seo: {
      title: `TS to MP4 Converter — .ts, .mts and .m2ts Files — RandomUtils`,
      description:
        'Convert TS, MTS and M2TS transport-stream recordings to MP4 in your browser — batch queue, stream-copied where possible, and no upload step.',
      anchor: 'TS to MP4 converter',
      features: [
        'Batch convert .ts, .mts and .m2ts recordings to MP4',
        'Stream copy for speed, re-encode only when the source needs it',
        'DVR .star sidecars and same-named thumbnails handled',
        NEVER_UPLOADS,
      ],
    },
  },
  {
    id: 'mov-to-mp4',
    name: 'MOV → MP4',
    tagline: 'Batch convert QuickTime .mov files to MP4',
    description:
      'Drop QuickTime movies in and get MP4s that play anywhere — H.264, HEVC and AAC copied across untouched, ProRes/DV/PCM re-encoded. Also runs on FFmpeg compiled to WebAssembly, so the files stay on your machine.',
    path: '/mov-to-mp4',
    tags: ['Video', 'FFmpeg', 'Offline'],
    flag: 'mov-to-mp4',
    seo: {
      title: `MOV to MP4 Converter — QuickTime MOV, No Upload — RandomUtils`,
      description:
        'Convert QuickTime MOV files to MP4 in your browser: H.264, HEVC and AAC copied across untouched, ProRes, DV and PCM audio re-encoded. No upload.',
      anchor: 'MOV to MP4 converter',
      features: [
        'H.264, HEVC and AAC copied across untouched',
        'ProRes, DV and PCM audio re-encoded for compatibility',
        'Batch queue with per-file progress and download-all',
        NEVER_UPLOADS,
      ],
    },
  },
  {
    id: 'audio-extract',
    name: 'Video → Audio',
    tagline: 'Extract a video’s audio track as WAV or MP3',
    description:
      'Drop a video in, pick WAV or MP3, and download the audio track by itself — no upload, no editing suite. Runs on FFmpeg compiled to WebAssembly, so the video never leaves your machine.',
    path: '/audio-extract',
    tags: ['Audio', 'Video', 'FFmpeg', 'Offline'],
    flag: 'audio-extract',
    seo: {
      title: `Extract Audio From Video — WAV or MP3, No Upload — RandomUtils`,
      description:
        'Extract audio from a video and download it as WAV or MP3. Drop a file, pick a format, download — no editing suite, no upload, no server.',
      anchor: 'Extract audio from a video',
      features: [
        'Extract the audio track as WAV or MP3',
        'Takes MP4, MOV, MKV, AVI, WebM, FLV, TS and more',
        'Several videos at once, zipped into one download',
        NEVER_UPLOADS,
      ],
    },
  },
]

/** Everything whose flag is on — what the grid, the count and the routes use. */
export function useTools(): Tool[] {
  const flags = useFlags()
  return useMemo(() => tools.filter((tool) => !tool.flag || flags[tool.flag]), [flags])
}