# RandomUtils

Small, single-purpose tools that run **entirely in your browser**. Every conversion
happens on your own machine — there is no upload step because there is no server to
upload to. No accounts, no queue on someone else's disk, no copy of your file anywhere
you cannot see.

**Live:** https://randomutils.com/ · **Source:** https://github.com/jacoblbagent/randomutils

## Tools

| Tool | Route | What it does |
|---|---|---|
| **TS → MP4** | `/ts-to-mp4` | Batch-convert MPEG transport stream (`.ts`, `.mts`, `.m2ts`) DVR/OTA recordings into MP4 that macOS and every browser player will open. Files under 50 MB are skipped on add. |
| **MOV → MP4** | `/mov-to-mp4` | Batch-convert QuickTime (`.mov`, `.qt`) video. H.264/HEVC/AAC/MP3 are copied across untouched; ProRes, DV, Motion JPEG and PCM/ALAC audio are re-encoded. No size floor. |
| **Video → Audio** | `/audio-extract` | Pull a video's audio track out on its own as **WAV** (lossless) or **MP3**. |

All three run on FFmpeg compiled to WebAssembly, bundled with the site — no CDN fetch.

## Requirements and quick start

Node `^20.19.0 || >=22.12.0` (what Vite 8 requires; this checkout is developed on 22.x).

```bash
npm install
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build && node scripts/prerender.mjs
npm run preview      # serve the built dist/ locally
npm run lint         # oxlint
npm run deploy       # build + publish dist/ to the gh-pages branch
```

### Scripts

| Script | What it runs | Notes |
|---|---|---|
| `dev` | `vite` | Serves on Vite's default **5173**. The Hermes web UI start script (`~/Code/hermes-web-ui/scripts/start-randomutils.sh`) runs the same server with `--port 5196 --strictPort --host 127.0.0.1` and publishes it on the tailnet, so the Projects row and the tailnet URL both point at **5196**. Both are the same dev server on two ports — nothing in the app depends on either. |
| `build` | `tsc -b && vite build && node scripts/prerender.mjs` | Type-check, bundle, then write one real static page per route plus `sitemap.xml`. |
| `prerender` | `node scripts/prerender.mjs` | Re-run just the prerender step against the existing `dist/`. |
| `lint` | `oxlint` | Pre-existing warnings in `ConvertQueue` and `AudioExtract` are expected. |
| `preview` | `vite preview` | Serves `dist/` on **4173**. |
| `deploy` | `bash scripts/deploy.sh` | Publish only — see [Deploy](#deploy). |

## Stack

React 19 · Vite 8 · TypeScript (strict) · `react-router-dom` 7 (`BrowserRouter`) · plain CSS
with custom-property tokens · `oxlint` · `@fontsource-variable/instrument-sans` ·
`@ffmpeg/ffmpeg` + `@ffmpeg/core` + `@ffmpeg/util` · `jszip`.

No state library, no CSS framework, no component kit, no analytics. Type checking runs with
`strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` and
`erasableSyntaxOnly` on (`tsconfig.app.json`).

## The registries — where a change lands

Four files decide what exists. A new tool touches three of them; a new prose page touches two.

1. `src/data/tools.ts` — the **tool registry**. Name, tagline, description, path, tags, status,
   and the flag that ships it. The home grid, the footer and `pages.ts` all read it.
2. `src/data/pages.ts` — the **page registry**: every URL the site answers with a real,
   indexable page, with its `<title>`, meta description and `inSitemap`. Tool pages are derived
   from `tools.ts`, so a tool needs no entry here.
3. `src/App.tsx` — the `<Route>`, mounted inside `AppShell` so the prerenderer sees the same
   shell a visitor does. A flagged tool's routes are mounted only while its flag is on.
4. `src/config/flags.ts` — the **flag registry**. A new tool needs a `FlagId` defaulted to
   `true`, or its card, footer count and route all vanish.

Miss the route and the page 404s live; miss the registry and it never reaches the sitemap.

## Pages, metadata and crawlers

GitHub Pages has no rewrite rules: an unknown path is answered with `404.html` **under a 404
status**, which is why a single-page SPA on Pages is invisible to search. So the build writes
one real page per route and the 404 copy becomes a backstop instead of the only page:

```
dist/index.html               ← /
dist/about/index.html         ← /about
dist/privacy/index.html       ← /privacy
dist/terms/index.html         ← /terms
dist/contact/index.html       ← /contact
dist/ts-to-mp4/index.html     ← /ts-to-mp4     (each tool page, from tools.ts)
dist/mov-to-mp4/index.html    ← /mov-to-mp4
dist/audio-extract/index.html ← /audio-extract
dist/sitemap.xml              ← all 8 routes
dist/404.html                 ← noindex, for genuinely unknown paths
```

`scripts/prerender.mjs` (run by `npm run build`, after `vite build`) renders every route through
the real app shell (`scripts/prerender/entry.tsx`, `renderToString` + `MemoryRouter`) and writes
the markup into a copy of the **built** `index.html`, with that route's `<title>`, description,
`rel=canonical`, Open Graph tags and `robots` swapped into the `<!-- site:meta -->` block. It
refuses to write a page whose markup has no `class="site-head"`, so an empty prerender fails the
build rather than shipping blank pages. It loads the `.tsx` sources through Vite's own SSR module
runner (`createServer` in middleware mode), so there is no second build pipeline and no extra
dependency; a small `window`/`localStorage` stand-in is installed first, because the flag store
resolves the query string once at import.

Consequences worth knowing:

- **Every route is a directory**, so GitHub Pages answers `/privacy` with a 301 to `/privacy/`
  and then 200. Canonical URLs and `sitemap.xml` use that trailing-slash form — the address that
  answers 200 directly. `siteUrl()` in `src/config/site.ts` is the only place that builds one.
- **The app mounts over the prerendered markup**, so the first paint is real content and a
  crawler that does not run JavaScript still sees a populated page.
- `src/components/PageMetaSync/` keeps the head in step while a visitor clicks between tools
  (`document.title`, description, `og:*`, `robots`, canonical). Unknown routes get `noindex` and
  lose the canonical, so the NotFound view is never filed as a page.
- `public/robots.txt` allows everything, names the AdSense crawlers (`Mediapartners-Google`,
  `AdsBot-Google`, `Google-adstxt`) and points at the sitemap.

`vite.config.ts` keeps `base: '/'` (the site is served from the `randomutils.com` apex, so assets
sit at the root) and appends a `404.html` copy of `index.html` on every build via the local
`spa-fallback` plugin — which the prerenderer then rewrites to carry `noindex`.

## Feature flags

New features and major changes ship behind a flag: the code merges dark and turning it on is one
value. The registry is `src/config/flags.ts`; this is the short version.

```ts
const search = useFlag('tool-search')          // in a component
import { isEnabled } from './config/flags'     // outside render
if (isEnabled('tool-search')) { … }
```

Precedence, highest first:

1. **URL** — `?flags=tool-search` (on), `?flags=!tool-search` (off), comma-separated, page-scoped.
   Doubles as a shareable preview link and does not stick.
2. **`localStorage` `randomutils.flags`** — what the flags panel writes, so a flip in a browser
   survives reloads with no redeploy.
3. **`FLAGS` in `src/config/flags.ts`** — the committed default, which is what fresh visitors get.

Open the panel with `?flags=1` on any URL or Shift+Alt+F; it shows each flag's live switch and
where the current value came from, and can copy a preview link carrying the state. From the
console: `randomutils.flags.set('tool-search', true)` / `.clear(id)` / `.reset()` / `.all()`.

| Flag | Default | What it gates |
|---|---|---|
| `ts-to-mp4` | on | Grid card, footer count and `/ts-to-mp4`. |
| `mov-to-mp4` | on | Grid card, footer count and `/mov-to-mp4`. |
| `audio-extract` | on | Grid card, footer count and `/audio-extract`. |
| `tool-search` | off | Filter box above the home grid (matches name, tagline, tags). |

Runtime flags are UI-level gating only. A flag that carries weight — a bundled dataset, MBs of
assets, another big dependency — must **also** be checked at build time by a module-level `const`
in a branch the bundler can fold, so the payload is tree-shaken out of `dist/`. A runtime override
can hide a feature, never un-ship it.

## How a converter is built

Both MP4 tools are the same queue with a different `spec`; the extractor is its own page.

```
src/tools/
├── video/                     the shared kit — format-agnostic
│   ├── ConvertQueue/          the whole converter page: drop zone, modes, queue, bulk zip, viewer
│   ├── useFFmpeg.ts           the wasm engine: probe → per-stream plan → convert, posters, recycling
│   ├── types.ts               VideoToolSpec — what a format declares to use the queue
│   ├── JobRow/ Viewer/ StarButton/ StatusIcon/ Toast/ InfoTip/
│   └── utils.ts, useFavorites.ts, useDismissedNames.ts
├── ts-to-mp4/  TsToMp4.tsx + spec.ts     .ts/.mts/.m2ts, 50 MB floor, .star sidecars, paired .jpg
├── mov-to-mp4/ MovToMp4.tsx + spec.ts    .mov/.qt, no floor, poster frames instead
└── audio-extract/ AudioExtract.tsx + useAudioFFmpeg.ts + AudioExtract.css
```

A tool page is one line — `<ConvertQueue spec={TS_SPEC} />` — plus a `VideoToolSpec` and the
guide prose that sits under it (`src/components/ToolGuide/`, using the shared `.doc` frame). The
tool stays the first thing on the page; the guide is a sibling below it, not a preamble above it.

What the engine does, in order, per file:

1. **Probe** — `ffmpeg -i` (no output) lists the streams; `parseStreams()` reads them.
2. **Plan** — `planFor()` copies what a player can take and re-encodes only the rest: H.264
   8-bit 4:2:0 → `avc1`, H.265 → `hvc1` (ffmpeg's default `hev1` will not open on macOS), AAC and
   MP3 audio copied, anything else → H.264 `high` CRF 23 `yuv420p` + AAC 160k.
3. **Convert** — `-movflags +faststart`, so the moov atom is up front.
4. **Fallback** — in Auto, if the planned copy fails the file is re-encoded whole rather than
   reported as failed.
5. **Recycle** — ffmpeg.wasm's linear memory only ever grows inside one instance, so the engine
   is terminated and reloaded every 6 files or ~1 GB of source (the extractor: 4 files, ~1 GB,
   plus immediately after any single file over 500 MB). That is what prevents the “memory access
   out of bounds” trap on a long batch; a trapped instance is recycled at once too.

Modes offered per format: **Auto** (per-stream decision), **Stream copy** (remux; refuses when
the video must be re-encoded), **Re-encode** (H.264 + AAC, slow, works for anything).

Format differences live entirely in the spec: `minSizeMB`, `adtsAudio` (MPEG-TS frames AAC as
ADTS, so copying it needs the `aac_adtstoasc` bitstream fix; the filter fails on QuickTime, which
carries the AudioSpecificConfig inline), `posters` (pull a frame from each source for its row
thumbnail — MOV tool — versus the DVR-shipped same-named `.jpg` — TS tool), and `sidecar` for the
`.star` flag files.

Per-tool state lives in `localStorage`, namespaced by tool id: `<id>:favorites` and
`<id>:dismissed-names`. They keep the keys the standalone `ts-to-mp4` app used, so stars saved
there still apply on `/ts-to-mp4`. “Download all” zips the finished files with `jszip`.

## Adding a tool

1. `src/tools/<tool-id>/` — the component (and its CSS, beside it).
2. `src/data/tools.ts` — append an entry, with `flag: '<id>'`. This gives the card, the footer
   count, the page metadata and a sitemap entry in one edit.
3. `src/App.tsx` — `<Route path="/<tool-id>" element={<Tool />} />`.
4. `src/config/flags.ts` — a `FlagId`, defaulted to `true` when the tool is ready to be seen.

A **video → MP4 converter** needs less: write `src/tools/<id>/spec.ts` (extensions, size floor,
copy rules, drop copy, modes) and a one-line page rendering `<ConvertQueue spec={…} />`. The
shared kit supplies the engine, queue and viewer.

**A new prose page** (About, Privacy, Terms, Contact all use it): add the `<Route>` in `App.tsx`
and a `STATIC_PAGES` entry in `src/data/pages.ts`, then reuse the `.doc` frame from `App.css` —
never a second design.

## Deploy

GitHub Pages, `gh-pages` branch — build output never sits on `main`.

```bash
npm run deploy
```

`scripts/deploy.sh` builds, copies `dist/` into a temp dir, `git init`s it and force-pushes
`gh-pages`. It has no npm dependencies on purpose: the `gh-pages` package pulls in
`globby > fast-glob > micromatch > braces`, and `braces` carries an unfixed stack-exhaustion
advisory (GHSA-vfj7-8cjw-p6xm), so dropping the toolchain keeps `npm audit` clean without an
override. It uses the `gh` CLI token when available, and refuses to run from any branch other than
`main` — override deliberately with `DEPLOY_BRANCH=gh-pages npm run deploy`.

**Push ≠ live.** Only `npm run deploy` publishes. After deploying, wait ~45 seconds and re-curl
the live routes. The script's closing `Published …` line reports the temp deploy repo's short
hash, not your commit's.

**Branches:** `main` is what randomutils.com serves — commit to it. `development` still exists but
currently trails `main`; it is not part of the publish path.

At Namecheap the DNS is four `A` records on `@` (185.199.108.153 / .109.153 / .110.153 /
.111.153) plus `CNAME www → jacoblbagent.github.io`; GitHub 301s `www` to the apex, HTTPS is
enforced and the certificate covers both hosts. `public/CNAME` pins the custom domain.

## Compliance notes

- **Privacy** (`/privacy`) is required, not optional: the site carries Google AdSense, and an
  ad-serving site is expected to name the vendor, the cookies and the opt-out
  (`https://adssettings.google.com/`). It is also the page that backs the “nothing is uploaded”
  line, so its wording must match what the code does — if a second third party is ever added,
  that page changes in the same commit.
- **Contact** (`/contact`, address in `src/config/site.ts`) is reachable without a GitHub account,
  which ad review, takedown and abuse handling all assume.
- **`public/ads.txt`** (`google.com, pub-7737570630269660, DIRECT, …`), the AdSense loader in
  `index.html` and `publisherId` in `src/config/site.ts` must always agree.
- **`public/robots.txt`** carries the crawl rules and the `Sitemap:` line; its comment enumerates
  which routes have static pages, so update it when a route is added.
- No ad units are placed yet — only the loader in `index.html`.

## Layout

```
src/
├── App.tsx / App.css        shell (header + routes + footer), and the tokens + shared primitives
├── main.tsx                 createRoot, font import, App.css
├── config/
│   ├── flags.ts             the flag registry + store
│   ├── site.ts              origin, repo, owner, contact address, publisher id, siteUrl()
│   └── FlagsPanel/          the ?flags=1 panel
├── data/                    tools.ts (tools), pages.ts (every real page)
├── icons/Icons.tsx          authored 16px SVG icon set (no unicode glyphs)
├── components/              SiteHeader, SiteFooter, ToolCard, ToolGuide, ScrollToTop, PageMetaSync
├── pages/                   Home, About, Privacy, Terms, Contact, NotFound
└── tools/                   video/ (shared kit), ts-to-mp4/, mov-to-mp4/, audio-extract/

scripts/
├── deploy.sh                publish dist/ to gh-pages
├── prerender.mjs            one static page per route + sitemap.xml
└── prerender/entry.tsx      renders AppShell for one route (build-time only)

public/                      .nojekyll, CNAME, ads.txt, robots.txt, favicon.svg
TOOL_IDEAS.txt               the backlog of client-side-only tool ideas; shipped ones are marked
```

Component styles sit next to their component (`ComponentName/ComponentName.css`). Only
cross-cutting primitives live in `App.css`: tokens, buttons, `.link`, `.icon`, progress bar,
chips, and the `.doc` prose frame used by About/Privacy/Terms/Contact and every tool guide.

## Local checks before shipping

```bash
npm run build     # prerender lists every route and sitemap.xml reports "8 URLs (all routes)"
npm run lint      # oxlint — only the pre-existing ConvertQueue/AudioExtract warnings
npm run preview -- --port 4199
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4199/privacy/   # trailing slash matters
```

The built routes are directory indexes, so `/privacy` 301s to `/privacy/`. Kill a preview server
with the bracket trick — `pkill -f "[v]ite preview"` — because a plain `pkill -f "vite preview"`
matches the calling shell's own command line.

Stage explicit paths when committing; this checkout is shared with other sessions, so never
`git add -A`.

## Origin

The TS → MP4 tool was migrated here from a standalone repo (`~/Code/ts-to-mp4`, still deployable
on its own), converted from JSX to strict TypeScript and split into component folders. When
MOV → MP4 arrived as the second converter, the engine, queue and row/viewer components moved out
of `tools/ts-to-mp4/` into the shared `tools/video/` kit driven by a per-format `VideoToolSpec`,
leaving each tool as a one-line page plus a spec.