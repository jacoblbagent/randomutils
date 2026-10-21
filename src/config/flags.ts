import { useSyncExternalStore } from 'react'

/* =========================================================================
   Feature flags — the one gate everything new goes behind.

   Adding a feature or a major change: register a flag here, default it to
   `false`, gate the code with `useFlag('id')` (or `isEnabled('id')` outside a
   component), and merge. It ships dark. Flipping it is one value.

   A flag resolves from three places, highest precedence first:

     1. The URL — `?flags=tool-search` (on), `?flags=!tool-search` (off),
        comma-separated, page-scoped. A shareable preview link: it does not
        stick once the query is gone.
     2. localStorage `randomutils.flags` — what the flags panel writes, so a
        flip in one browser survives reloads with no redeploy.
     3. `FLAGS` below — the committed default, what CI and fresh visitors get.

   Open the panel with `?flags=1` on any URL, or Shift+Alt+F. From the console:
   `randomutils.flags.set('tool-search', true)`.

   Runtime flags are for UI-level gating. A flag that carries weight — a bundled
   dataset, MBs of assets, another big dependency — must ALSO be evaluated at
   build time by a module-level `const` in a branch Rollup can fold
   (`if (!BIG) return EMPTY`), so the payload is tree-shaken out of the bundle.
   Runtime overrides can only hide a feature, never un-ship it.
   ========================================================================= */

export type FlagId = 'tool-search' | 'ts-to-mp4' | 'mov-to-mp4' | 'audio-extract'

export interface FlagSpec {
  /** Committed default. Keep `false` until the change is ready for everyone. */
  default: boolean
  /** Shown in the flags panel. */
  label: string
  /** One line: what turns on, and what disappearing again takes away. */
  description: string
}

export const FLAGS: Record<FlagId, FlagSpec> = {
  'tool-search': {
    default: true,
    label: 'Tool search',
    description: 'Filter box beside the tag row above the home grid — matches name, tagline and tags.',
  },
  'ts-to-mp4': {
    default: true,
    label: 'TS → MP4',
    description: 'Grid card, footer count and the /ts-to-mp4 route for the converter.',
  },
  'mov-to-mp4': {
    default: true,
    label: 'MOV → MP4',
    description: 'Grid card, footer count and the /mov-to-mp4 route for the QuickTime converter.',
  },
  'audio-extract': {
    default: true,
    label: 'Video → Audio',
    description: 'Grid card, footer count and the /audio-extract route for the WAV/MP3 extractor.',
  },
}

export const FLAG_IDS = Object.keys(FLAGS) as FlagId[]

export type FlagSource = 'url' | 'saved' | 'default'

type Overrides = Partial<Record<FlagId, boolean>>

const STORE_KEY = 'randomutils.flags'
const PANEL_KEY = 'randomutils.flags.panel'

/* ---------------------------------------------------------------- storage */

function readSaved(): Overrides {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Overrides = {}
    for (const id of FLAG_IDS) {
      const value = (parsed as Record<string, unknown>)[id]
      if (typeof value === 'boolean') out[id] = value
    }
    return out
  } catch {
    return {}
  }
}

function writeSaved(): void {
  try {
    if (Object.keys(saved).length === 0) window.localStorage.removeItem(STORE_KEY)
    else window.localStorage.setItem(STORE_KEY, JSON.stringify(saved))
  } catch {
    /* private mode / storage disabled — the page-scoped state still works */
  }
}

/**
 * `?flags=1` opens the panel; `?flags=a,!b` forces flags on/off for this page.
 */
function parseFlagsParam(raw: string | null): { overrides: Overrides; openPanel: boolean } {
  const overrides: Overrides = {}
  let openPanel = false
  if (!raw) return { overrides, openPanel }
  for (const token of raw.split(',')) {
    const value = token.trim()
    if (!value) continue
    if (value === '1' || value === 'panel') {
      openPanel = true
      continue
    }
    const off = value.startsWith('!') || value.startsWith('-')
    const id = (off ? value.slice(1) : value.replace(/^\+/, '')) as FlagId
    if (!(id in FLAGS)) continue
    overrides[id] = !off
  }
  return { overrides, openPanel }
}

function readPanelOpen(urlOpened: boolean): boolean {
  if (urlOpened) return true
  try {
    return window.sessionStorage.getItem(PANEL_KEY) === '1'
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ store */

const params = new URLSearchParams(window.location.search)
const parsed = parseFlagsParam(params.get('flags'))

let saved: Overrides = readSaved()
const fromUrl: Overrides = parsed.overrides
let panelOpen = readPanelOpen(parsed.openPanel)

const listeners = new Set<() => void>()
let flagsSnapshot: Record<FlagId, boolean> | null = null
let sourcesSnapshot: Record<FlagId, FlagSource> | null = null

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(): void {
  flagsSnapshot = null
  sourcesSnapshot = null
  for (const listener of listeners) listener()
}

/* ------------------------------------------------------------------- api */

/** Effective value: URL override, else what this browser saved, else default. */
export function isEnabled(id: FlagId): boolean {
  const override = fromUrl[id] ?? saved[id]
  return override ?? FLAGS[id].default
}

/** Where the current value came from — surfaced in the panel. */
export function flagSource(id: FlagId): FlagSource {
  if (id in fromUrl) return 'url'
  if (id in saved) return 'saved'
  return 'default'
}

/** Persist a flip in this browser. Takes effect immediately, everywhere. */
export function setFlag(id: FlagId, on: boolean): void {
  saved = { ...saved, [id]: on }
  writeSaved()
  emit()
}

/** Drop this browser's override, back to the committed default. */
export function clearFlag(id: FlagId): void {
  const next = { ...saved }
  delete next[id]
  saved = next
  writeSaved()
  emit()
}

export function resetFlags(): void {
  saved = {}
  writeSaved()
  emit()
}

export function setPanelOpen(open: boolean): void {
  if (open === panelOpen) return
  panelOpen = open
  try {
    if (open) window.sessionStorage.setItem(PANEL_KEY, '1')
    else window.sessionStorage.removeItem(PANEL_KEY)
  } catch {
    /* ignore */
  }
  emit()
}

/**
 * A link that reproduces the current flag state for anyone who opens it —
 * every flag that differs from its committed default.
 */
export function flagPreviewUrl(): string {
  const tokens = FLAG_IDS.filter((id) => isEnabled(id) !== FLAGS[id].default).map((id) =>
    isEnabled(id) ? id : `!${id}`,
  )
  const url = new URL(window.location.href)
  if (tokens.length === 0) url.searchParams.delete('flags')
  else url.searchParams.set('flags', tokens.join(','))
  return url.toString()
}

/* ----------------------------------------------------------------- hooks */

function buildFlags(): Record<FlagId, boolean> {
  const out = {} as Record<FlagId, boolean>
  for (const id of FLAG_IDS) out[id] = isEnabled(id)
  return out
}

function buildSources(): Record<FlagId, FlagSource> {
  const out = {} as Record<FlagId, FlagSource>
  for (const id of FLAG_IDS) out[id] = flagSource(id)
  return out
}

function flagsOf(): Record<FlagId, boolean> {
  if (!flagsSnapshot) flagsSnapshot = buildFlags()
  return flagsSnapshot
}

function sourcesOf(): Record<FlagId, FlagSource> {
  if (!sourcesSnapshot) sourcesSnapshot = buildSources()
  return sourcesSnapshot
}

export function useFlag(id: FlagId): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isEnabled(id),
    () => FLAGS[id].default,
  )
}

/** Every flag at once — for a list that filters on several of them. */
export function useFlags(): Record<FlagId, boolean> {
  return useSyncExternalStore(subscribe, flagsOf, flagsOf)
}

export function useFlagSources(): Record<FlagId, FlagSource> {
  return useSyncExternalStore(subscribe, sourcesOf, sourcesOf)
}

export function useFlagsPanel(): [boolean, (open: boolean) => void] {
  const open = useSyncExternalStore(
    subscribe,
    () => panelOpen,
    () => false,
  )
  return [open, setPanelOpen]
}

/* ------------------------------------------------------------ console api */

declare global {
  interface Window {
    randomutils?: {
      flags: {
        isEnabled: typeof isEnabled
        set: typeof setFlag
        clear: typeof clearFlag
        reset: typeof resetFlags
        all: () => Record<FlagId, boolean>
      }
      openFlagsPanel: () => void
    }
  }
}

window.randomutils = {
  flags: {
    isEnabled,
    set: setFlag,
    clear: clearFlag,
    reset: resetFlags,
    all: buildFlags,
  },
  openFlagsPanel: () => setPanelOpen(true),
}
