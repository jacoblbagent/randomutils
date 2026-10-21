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
]

/** Everything whose flag is on — what the grid, the count and the routes use. */
export function useTools(): Tool[] {
  const flags = useFlags()
  return useMemo(() => tools.filter((tool) => !tool.flag || flags[tool.flag]), [flags])
}
