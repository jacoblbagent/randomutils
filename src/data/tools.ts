/**
 * The tool registry, the single place a new tool is announced.
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
 * and the structured-data featureList can never drift apart.
 */
export interface ToolSeo {
  /** Full <title>: the phrase someone would type first, then the brand. */
  title: string
  /** Meta description, hand-written to ~150 characters and distinct per tool. */
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
  /** A sentence or two: what it does and why it is useful. */
  description: string
  /** Route path inside the hash router. */
  path: string
  tags: string[]
  /** Page title, meta description, link text and feature list. */
  seo: ToolSeo
  /** Feature flag that ships this tool. Omitted = always on. */
  flag?: FlagId
  /** WebApplication.applicationSubCategory in the JSON-LD. */
  subCategory?: string
  /** WebApplication.browserRequirements. Defaults to the WebAssembly line. */
  browserRequirements?: string
  /** WebApplication.applicationCategory. Defaults to MultimediaApplication. */
  appCategory?: string
}

const NEVER_UPLOADS = 'No upload: the files never leave your machine'

export const tools: Tool[] = [
  {
    id: 'ts-to-mp4',
    name: 'TS → MP4',
    tagline: 'Convert .ts recordings to MP4',
    description:
      'Drop DVR and over-the-air captures in and get MP4s that play anywhere, stream-copied where possible. Runs on FFmpeg in your browser; nothing is uploaded.',
    path: '/ts-to-mp4',
    tags: ['Video', 'FFmpeg', 'Offline'],
    flag: 'ts-to-mp4',
    seo: {
      title: `TS to MP4 Converter: .ts, .mts and .m2ts Files | RandomUtils`,
      description:
        'Convert TS, MTS and M2TS recordings to MP4 in your browser. Batch queue, stream copy where possible, no upload.',
      anchor: 'TS to MP4 converter',
      features: [
        'Batch convert .ts, .mts and .m2ts to MP4',
        'Stream copy for speed, re-encode only when needed',
        'DVR .star sidecars and thumbnails handled',
        NEVER_UPLOADS,
      ],
    },
  },
  {
    id: 'mov-to-mp4',
    name: 'MOV → MP4',
    tagline: 'Convert QuickTime .mov files to MP4',
    description:
      'Drop QuickTime movies in and get MP4s that play anywhere: H.264, HEVC and AAC copied untouched, ProRes, DV and PCM re-encoded. Nothing is uploaded.',
    path: '/mov-to-mp4',
    tags: ['Video', 'FFmpeg', 'Offline'],
    flag: 'mov-to-mp4',
    seo: {
      title: `MOV to MP4 Converter: QuickTime MOV, No Upload | RandomUtils`,
      description:
        'Convert QuickTime MOV to MP4 in your browser: H.264, HEVC and AAC copied, ProRes, DV and PCM re-encoded. No upload.',
      anchor: 'MOV to MP4 converter',
      features: [
        'H.264, HEVC and AAC copied untouched',
        'ProRes, DV and PCM re-encoded',
        'Batch queue, per-file progress, download all',
        NEVER_UPLOADS,
      ],
    },
  },
  {
    id: 'audio-extract',
    name: 'Video → Audio',
    tagline: 'Extract a video’s audio as WAV or MP3',
    description:
      'Drop a video in, pick WAV or MP3, and download the audio track. No upload, no editing suite.',
    path: '/audio-extract',
    tags: ['Audio', 'Video', 'FFmpeg', 'Offline'],
    flag: 'audio-extract',
    seo: {
      title: `Extract Audio From Video: WAV or MP3, No Upload | RandomUtils`,
      description:
        'Extract audio from a video as WAV or MP3 in your browser. Drop a file, pick a format, download. No upload, no server.',
      anchor: 'Extract audio from a video',
      features: [
        'Extract the audio track as WAV or MP3',
        'MP4, MOV, MKV, AVI, WebM, FLV, TS and more',
        'Several videos at once, zipped into one download',
        NEVER_UPLOADS,
      ],
    },
  },
  {
    id: 'password-generator',
    name: 'Password generator',
    tagline: 'Strong random passwords, made in this tab',
    description:
      'Pick a length and characters, and get a password from your browser’s cryptographic random source, with its entropy and estimated offline crack time beside it.',
    path: '/password-generator',
    tags: ['Security', 'Passwords', 'Offline'],
    flag: 'password-generator',
    subCategory: 'Password generator',
    appCategory: 'SecurityApplication',
    browserRequirements: 'Requires JavaScript (Web Crypto)',
    seo: {
      title: `Password Generator: Strong Random Passwords, No Upload | RandomUtils`,
      description:
        'Generate strong random passwords in your browser: pick length and character sets, see entropy and crack time, copy. Nothing is uploaded.',
      anchor: 'Password generator',
      features: [
        'Cryptographically random passwords from Web Crypto',
        'Choose length and character sets, drop look-alikes',
        'Entropy score and offline crack time, updated live',
        'Up to 25 at once, each with a copy button',
        // Deliberately not NEVER_UPLOADS: that line says "the files never leave your
        // machine", and there is no file here.
        'No upload: nothing you generate leaves your machine',
      ],
    },
  },
  {
    id: 'uuid-generator',
    name: 'UUID generator',
    tagline: 'Version 4 and version 7 UUIDs, made in this tab',
    description:
      'Pick v4 for pure randomness, or v7 for ids that start with a millisecond timestamp and sort by creation time. Up to 100 at once, with hyphens, braces and case as options.',
    path: '/uuid-generator',
    tags: ['Developer', 'UUID', 'Offline'],
    flag: 'uuid-generator',
    subCategory: 'UUID generator',
    appCategory: 'DeveloperApplication',
    browserRequirements: 'Requires JavaScript (Web Crypto)',
    seo: {
      title: `UUID Generator: v4 and v7 IDs, No Upload | RandomUtils`,
      description:
        'Generate v4 and v7 UUIDs in your browser: pick version, hyphens, braces, case and count, then copy. Nothing is uploaded.',
      anchor: 'UUID generator',
      features: [
        'v4 from 122 random bits, v7 with a 48-bit timestamp',
        'v7 batches come out in generation order',
        'Hyphens, braces and case options, up to 100 at once',
        'Copy one id or the whole batch',
        'No upload: nothing you generate leaves your machine',
      ],
    },
  },
]

/** Everything whose flag is on, what the grid, the count and the routes use. */
export function useTools(): Tool[] {
  const flags = useFlags()
  return useMemo(() => tools.filter((tool) => !tool.flag || flags[tool.flag]), [flags])
}
