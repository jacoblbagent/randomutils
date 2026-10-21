/**
 * The tool registry — the single place a new tool is announced.
 *
 * Adding a tool: append an entry here and add its route in `App.tsx`. The home
 * page grid, the footer count, and (later) any index/search all read this list.
 */
import { useMemo } from 'react'
import { useFlags, type FlagId } from '../config/flags'

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
  status: 'live' | 'soon'
  /**
   * Feature flag that ships this tool. Omitted = always on. With the flag off
   * the card, the footer count and the route all go away (see config/flags.ts).
   */
  flag?: FlagId
}

export const tools: Tool[] = [
  {
    id: 'ts-to-mp4',
    name: 'TS → MP4',
    tagline: 'Batch convert .ts recordings to MP4',
    description:
      'Drop DVR and over-the-air captures in and get MP4s that open in QuickTime, stream-copied as fast as the source allows. Runs on FFmpeg compiled to WebAssembly — the files never leave your machine.',
    path: '/ts-to-mp4',
    tags: ['Video', 'FFmpeg', 'Offline'],
    status: 'live',
    flag: 'ts-to-mp4',
  },
  {
    id: 'mov-to-mp4',
    name: 'MOV → MP4',
    tagline: 'Batch convert QuickTime .mov files to MP4',
    description:
      'Drop QuickTime movies in and get MP4s that play anywhere — H.264, HEVC and AAC copied across untouched, ProRes/DV/PCM re-encoded. Also runs on FFmpeg compiled to WebAssembly, so the files stay on your machine.',
    path: '/mov-to-mp4',
    tags: ['Video', 'FFmpeg', 'Offline'],
    status: 'live',
    flag: 'mov-to-mp4',
  },
  {
    id: 'audio-extract',
    name: 'Video → Audio',
    tagline: 'Extract a video’s audio track as WAV or MP3',
    description:
      'Drop a video in, pick WAV or MP3, and download the audio track by itself — no upload, no editing suite. Runs on FFmpeg compiled to WebAssembly, so the video never leaves your machine.',
    path: '/audio-extract',
    tags: ['Audio', 'Video', 'FFmpeg', 'Offline'],
    status: 'live',
    flag: 'audio-extract',
  },
]

/** Everything whose flag is on — what the grid, the count and the routes use. */
export function useTools(): Tool[] {
  const flags = useFlags()
  return useMemo(() => tools.filter((tool) => !tool.flag || flags[tool.flag]), [flags])
}
