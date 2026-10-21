# RandomUtils

A hub for small, single-purpose browser tools. Every tool runs entirely client-side — no accounts, no
uploads, no server holding your files.

**🔗 Live:** https://randomutils.com/

## Tools

| Tool | What it does |
|---|---|
| **TS → MP4** | Batch-convert MPEG transport stream (`.ts`) recordings to MP4, stream-copying what players accept and re-encoding only the rest. Runs on FFmpeg compiled to WebAssembly. |

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (dev server is registered on :5196 in the Hermes web UI)
npm run build      # tsc -b && vite build — type-checks, then emits static output in dist/
npm run preview
```

## Stack

React 19 + Vite 8 + TypeScript (strict) + plain CSS with custom-property tokens. Routing is
`react-router-dom`'s `BrowserRouter` with `basename` taken from Vite's `BASE_URL`, so tool URLs are
real paths (`/ts-to-mp4`, not `/#/ts-to-mp4`). No state library, no CSS framework.

The site is static, so deep-link reloads are served by a `404.html` copy of `index.html` that the
build emits (`spaFallback()` in `vite.config.ts`) — GitHub Pages serves it for any unknown path, and
the SPA boots from the real URL. Vite's dev and preview servers already fall back to `index.html`, so
nothing extra is needed locally.

**Ports:** dev :5196 (Hermes web UI Projects row), preview :4173.

## Layout

```
src/
├── App.tsx                     # shell: header + <Routes> + footer
├── App.css                     # tokens (colour, 4px space grid, radius, type) + shared primitives
├── config/
│   ├── flags.ts                # the flag registry + store (see Feature flags)
│   └── FlagsPanel/             # the ?flags=1 panel — one switch per flag
├── data/tools.ts               # the tool registry — the one place a tool is announced
├── icons/Icons.tsx             # authored 16px SVG icon set (no unicode glyphs)
├── components/                 # SiteHeader, SiteFooter, ToolCard, ScrollToTop
├── pages/                      # Home (the tool grid), NotFound
└── tools/
    └── ts-to-mp4/              # the tool, self-contained
        ├── TsToMp4.tsx         # page: queue, selection, zipping, viewer wiring
        ├── useFFmpeg.ts        # ffmpeg.wasm engine, per-file plan, engine recycling
        ├── JobRow/, Viewer/, StarButton/, StatusIcon/, Toast/, InfoTip/
        └── types.ts, utils.ts, useFavorites.ts, useDismissedNames.ts
```

Every component with a CSS file lives in its own folder beside that file; only `App.tsx`/`App.css`
and `main.tsx` are exempt. Shared primitives (buttons, chips, progress bar, helpers) live in
`App.css`; everything else is scoped to its component.

## Adding a tool

1. Create `src/tools/<tool-id>/` with the tool component and its CSS.
2. Append an entry to `src/data/tools.ts` (the home grid and footer count read it). Add `flag: '<id>'` if
   the tool should ship behind a flag — see below.
3. Add a `<Route path="/<tool-id>" element={<Tool />} />` in `src/App.tsx`.

## Branches

| Branch | What it is |
|---|---|
| `main` | What randomutils.com serves. Deploys go from here. |
| `development` | Where work lands first. Never serves the live site. |

Build on `development`, then merge to `main` to publish. `scripts/deploy.sh` refuses to run from any
branch other than `main`, so a dev branch cannot clobber the live site by accident — override on
purpose with `DEPLOY_BRANCH=gh-pages npm run deploy`.

## Feature flags

New features and major changes ship behind a flag: the code merges dark, and turning it on is one
value. The registry lives in `src/config/flags.ts` — that file is the reference; this is the short
version.

**Add a flag:** append it to `FLAGS` with `default: false`, gate the code, done.

```ts
// in a component
const search = useFlag('tool-search')

// outside render
import { isEnabled } from '../config/flags'
if (isEnabled('tool-search')) { … }
```

**Value resolution,** highest precedence first:

1. **URL** — `?flags=tool-search` (on), `?flags=!tool-search` (off), comma-separated. Page-scoped, so
   it doubles as a shareable preview link and does not stick afterwards.
2. **localStorage** `randomutils.flags` — what the flags panel writes, so a flip in your browser
   survives reloads. Per browser, no redeploy, no server.
3. **`FLAGS` in `src/config/flags.ts`** — the committed default, which is what fresh visitors and CI
   get.

**Flip them:** open any URL with `?flags=1` (e.g. https://randomutils.com/?flags=1) or press
Shift+Alt+F. The panel lists every flag with a live switch, shows whether the current value came from
the URL, from storage or from the default, and can copy a preview link carrying the state. From the
console: `randomutils.flags.set('tool-search', true)`.

**Flags that carry weight** — a bundled dataset, MBs of assets, another big dependency — must *also*
be checked at build time by a module-level `const` in a branch the bundler can fold, so the payload is
tree-shaken out of `dist/`. Runtime overrides can hide a feature, never un-ship it.

Registered flags:

| Flag | Default | What it gates |
|---|---|---|
| `ts-to-mp4` | on | The TS → MP4 converter: grid card, footer count and `/ts-to-mp4` route. |
| `tool-search` | off | Filter box above the home grid (matches name, tagline, tags). |

## Deploy

GitHub Pages, `gh-pages` branch (build output stays out of `main`):

```bash
npm run deploy     # build + publish dist/ to the gh-pages branch
```

`scripts/deploy.sh` does this with no npm dependencies: it builds, copies `dist/` into a temp dir,
inits a repo there and force-pushes `gh-pages`. The `gh-pages` package is deliberately not used — it
pulls in `globby > fast-glob > micromatch > braces`, and `braces` has an unfixed stack-exhaustion
advisory (GHSA-vfj7-8cjw-p6xm, no patched release), so `npm audit` stays clean without an override.

`vite.config.ts` keeps `base: '/'` (the site is served from the `randomutils.com` apex, so assets sit
at the root) and appends the `404.html` SPA fallback to `dist/` on every build.

The custom domain is declared by `public/CNAME` (`randomutils.com`), which lands in `dist/` and tells
GitHub Pages to serve the site at the apex. At Namecheap the DNS is four `A` records on `@`
(185.199.108.153 / .109.153 / .110.153 / .111.153) plus `CNAME www → jacoblbagent.github.io`; GitHub
301s `www` to the apex. HTTPS is enforced, cert issued for both hosts.

## TS → MP4 notes

- Min size: `.ts` files under 50 MB are skipped on add (`MIN_SIZE_MB` in `src/tools/ts-to-mp4/utils.ts`),
  with a toast saying how many and why. Sizes are decimal MB to match Finder.
- Pair a same-named `.jpg`/`.png` with a recording to use it as that row's thumbnail; a `.star` sidecar
  (`hdz_0000.ts.star.txt`) flags the matching `.ts` and rides into the row name and MP4 filename.
- Each file is probed first (`ffmpeg -i`), then per stream: H.264 8-bit 4:2:0 → copied as `avc1`,
  H.265 → copied as `hvc1` (ffmpeg's default `hev1` won't open on macOS), anything else → re-encoded to
  H.264 High `yuv420p`. AAC/MP3 audio is copied; the rest is re-encoded to AAC 160k. `-movflags
  +faststart` puts the moov atom up front.
- The wasm engine is recycled every 6 files / ~1 GB because ffmpeg.wasm's linear memory only grows —
  that's what prevents the "memory access out of bounds" trap on long batches.
- Favourites and the "previously removed" list persist in `localStorage` under the keys the standalone
  `ts-to-mp4` app used, so data saved on the same origin carries over.

## Origin

The TS → MP4 tool was migrated here from its standalone repo (`~/Code/ts-to-mp4`, still deployable on
its own) into this hub, converted from JSX to strict TypeScript and split into component folders.
