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
 * and the structured-data featureList can never drift apart, and so each tool
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
  /** A sentence or two, what it does, and the one thing that makes it useful. */
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
  /**
   * WebApplication.applicationSubCategory in the JSON-LD. Defaults to a file
   * converter, which is what every video tool is; a tool that is not one says so
   * here rather than inheriting a claim that does not describe it.
   */
  subCategory?: string
  /** WebApplication.browserRequirements. Defaults to the WebAssembly line. */
  browserRequirements?: string
  /**
   * WebApplication.applicationCategory. Defaults to MultimediaApplication, which
   * is right for a format converter and wrong for anything that is not media.
   */
  appCategory?: string
}

const NEVER_UPLOADS = 'No upload: the files never leave your machine'

export const tools: Tool[] = [
  {
    id: 'ts-to-mp4',
    name: 'TS → MP4',
    tagline: 'Batch convert .ts recordings to MP4',
    description:
      'Drop DVR and over-the-air captures in and get MP4s that open in QuickTime, stream-copied as fast as the source allows. Runs on FFmpeg compiled to WebAssembly; the files never leave your machine.',
    path: '/ts-to-mp4',
    tags: ['Video', 'FFmpeg', 'Offline'],
    flag: 'ts-to-mp4',
    seo: {
      title: `TS to MP4 Converter: .ts, .mts and .m2ts Files | RandomUtils`,
      description:
        'Convert TS, MTS and M2TS transport-stream recordings to MP4 in your browser, with a batch queue, stream-copied where possible, and no upload step.',
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
      'Drop QuickTime movies in and get MP4s that play anywhere: H.264, HEVC and AAC copied across untouched, ProRes/DV/PCM re-encoded. Also runs on FFmpeg compiled to WebAssembly, so the files stay on your machine.',
    path: '/mov-to-mp4',
    tags: ['Video', 'FFmpeg', 'Offline'],
    flag: 'mov-to-mp4',
    seo: {
      title: `MOV to MP4 Converter: QuickTime MOV, No Upload | RandomUtils`,
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
      'Drop a video in, pick WAV or MP3, and download the audio track by itself, with no upload and no editing suite. Runs on FFmpeg compiled to WebAssembly, so the video never leaves your machine.',
    path: '/audio-extract',
    tags: ['Audio', 'Video', 'FFmpeg', 'Offline'],
    flag: 'audio-extract',
    seo: {
      title: `Extract Audio From Video: WAV or MP3, No Upload | RandomUtils`,
      description:
        'Extract audio from a video and download it as WAV or MP3. Drop a file, pick a format, download. No editing suite, no upload, no server.',
      anchor: 'Extract audio from a video',
      features: [
        'Extract the audio track as WAV or MP3',
        'Takes MP4, MOV, MKV, AVI, WebM, FLV, TS and more',
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
      'Pick a length and the characters to allow, and get a password drawn from your browser’s own cryptographic random source, with the entropy and the estimated offline crack time printed beside it. Nothing is generated on a server, so there is nothing for one to log.',
    path: '/password-generator',
    tags: ['Security', 'Passwords', 'Offline'],
    flag: 'password-generator',
    subCategory: 'Password generator',
    appCategory: 'SecurityApplication',
    browserRequirements: 'Requires JavaScript (Web Crypto)',
    seo: {
      title: `Password Generator: Strong Random Passwords, No Upload | RandomUtils`,
      description:
        'Generate strong random passwords in your browser: choose the length and character sets, see the entropy and crack time, then copy. Nothing is uploaded.',
      anchor: 'Password generator',
      features: [
        'Cryptographically random passwords from the browser’s Web Crypto API',
        'Choose the length and character sets, and drop look-alike characters',
        'Entropy score and estimated offline crack time as the settings change',
        'Up to 25 passwords at once, each with its own copy button',
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
      'Pick v4 for an identifier that carries nothing but randomness, or v7 for one that starts with the millisecond it was made and therefore sorts by creation date. Batches of up to 100, with hyphens, braces and letter case as options, all drawn from the browser’s cryptographic source.',
    path: '/uuid-generator',
    tags: ['Developer', 'UUID', 'Offline'],
    flag: 'uuid-generator',
    subCategory: 'UUID generator',
    appCategory: 'DeveloperApplication',
    browserRequirements: 'Requires JavaScript (Web Crypto)',
    seo: {
      title: `UUID Generator: v4 and v7 IDs, No Upload | RandomUtils`,
      description:
        'Generate version 4 and version 7 UUIDs in your browser: choose the version, hyphens, braces, case and how many, then copy. Nothing is uploaded.',
      anchor: 'UUID generator',
      features: [
        'Version 4 UUIDs from 122 random bits, version 7 with a 48-bit timestamp',
        'v7 batches come out in the order they were generated',
        'Hyphens, braces and letter case as display options, up to 100 at a time',
        'Copy one id or the whole batch, with no upload step',
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