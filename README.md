# RandomUtils

Small single-purpose tools that run **entirely in your browser**. No upload step, no server
holding your files, no accounts.

**Live:** https://randomutils.com/ · **Source:** https://github.com/jacoblbagent/randomutils

## Tools

| Tool | Route | What it does |
|---|---|---|
| **TS → MP4** | `/ts-to-mp4` | Batch-convert MPEG transport stream (`.ts`, `.mts`, `.m2ts`) recordings to MP4. Files under 50 MB are skipped on add. |
| **MOV → MP4** | `/mov-to-mp4` | Batch-convert QuickTime (`.mov`, `.qt`). H.264/HEVC/AAC/MP3 are copied untouched; ProRes, DV, Motion JPEG and PCM/ALAC are re-encoded. No size floor. |
| **Video → Audio** | `/audio-extract` | Extract a video's audio track as **WAV** (lossless) or **MP3**. |
| **UUID generator** | `/uuid-generator` | v4 and v7 UUIDs from the CSPRNG, up to 100 at a time, with hyphens, braces and case as options. v7 batches sort in generation order. |
| **Compound interest** | `/compound-interest` | Future value from a starting balance, a monthly contribution and a fixed annual rate, with a year-by-year table. 8% default, currency symbol on a checkbox. |

The three video tools run on FFmpeg compiled to WebAssembly, bundled with the site rather than
fetched from a CDN. The UUID generator is plain JavaScript on Web Crypto and the calculator is
plain arithmetic, so neither carries any of that 32 MB payload.

## Requirements and scripts

Node `^20.19.0 || >=22.12.0` (what Vite 8 requires; this checkout is developed on 22.x).

```bash
npm install
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build && node scripts/prerender.mjs
npm run preview      # serve the built dist/ locally
npm run lint         # oxlint
npm run deploy       # build + publish dist/ to the gh-pages branch
```

| Script | What it runs | Notes |
|---|---|---|
| `dev` | `vite` | Port **5173**. The Hermes start script (`~/Code/hermes-web-ui/scripts/start-randomutils.sh`) runs the same server on **5196** with `--strictPort --host 127.0.0.1` and publishes it on the tailnet. Nothing in the app depends on either port. |
| `build` | `tsc -b && vite build && node scripts/prerender.mjs` | Type-check, bundle, write one static page per route plus `sitemap.xml`. |
| `prerender` | `node scripts/prerender.mjs` | Re-run the prerender against the existing `dist/`. |
| `lint` | `oxlint` | Pre-existing warnings in `ConvertQueue` and `AudioExtract` are expected. |
| `preview` | `vite preview` | Serves `dist/` on **4173**. |
| `deploy` | `bash scripts/deploy.sh` | Publish only; see [Deploy](#deploy). |

## Stack

React 19 · Vite 8 · TypeScript (strict) · `react-router-dom` 7 (`BrowserRouter`) · Astryx
(`@astryxdesign/core`, `theme-neutral`, `@stylexjs/stylex`) · `oxlint` · `@ffmpeg/ffmpeg`,
`@ffmpeg/core`, `@ffmpeg/util` · `jszip`.

No state library, no analytics. Every surface is an Astryx component; `src/App.css` holds only
the brand mark and the legacy token aliases. The theme wraps the app in `src/main.tsx` and again
in `scripts/prerender/entry.tsx`, so prerendered markup carries the same theme scope as the
hydrated page. `tsconfig.app.json` turns on `strict`, `noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax` and `erasableSyntaxOnly`.

## Registries: where a change lands

Five files decide what exists. A new tool touches three; a new prose page touches two.

1. `src/data/tools.ts` is the **tool registry**: name, tagline, description, path, tags, its
   flag, and a `seo` block (`title`, `description`, `anchor`, `features`) holding what a crawler
   sees and what other pages link with. The home grid, its filter row, the footer, the
   related-tools block and `pages.ts` all read it. A non-converter also sets `subCategory`,
   `appCategory` and `browserRequirements`; the JSON-LD defaults describe a video converter.
2. `src/data/pages.ts` is the **page registry**: every URL answered with a real, indexable page,
   with its `<title>`, description and `inSitemap`. Tool pages are derived from `tools.ts`
   (`tool.seo`), so a tool needs no entry. Every description passes through `clamp()`, whose
   trimming the prerender reports.
3. `src/App.tsx` holds the `<Route>`, inside `AppShell` so the prerenderer sees the same shell. A
   flagged tool's route mounts only while its flag is on.
4. `src/config/flags.ts` is the **flag registry**. A new tool needs a `FlagId` defaulted to
   `true`, or its card, footer count and route vanish.
5. `src/data/structuredData.ts` builds the **JSON-LD graph**: Organization + WebSite + WebPage
   everywhere, WebApplication and BreadcrumbList on a tool page. The prerender writes it into
   `<!-- site:ld -->` and `PageMetaSync` refreshes it at runtime from the same module.

A route missing from `App.tsx` 404s; a tool missing from the registry never reaches the sitemap.

## Pages, metadata and crawlers

GitHub Pages has no rewrites: an unknown path gets `404.html` **with a 404 status**, which would
leave a single-page SPA invisible to search. So the build writes one real page per route:

```
dist/index.html               ← /
dist/about/index.html         ← /about
dist/privacy/index.html       ← /privacy
dist/terms/index.html         ← /terms
dist/contact/index.html       ← /contact
dist/faq/index.html           ← /faq
dist/ts-to-mp4/index.html     ← each tool page, from tools.ts
dist/mov-to-mp4/index.html
dist/audio-extract/index.html
dist/sitemap.xml              ← every route
dist/404.html                 ← noindex, for genuinely unknown paths
```

`scripts/prerender.mjs` (part of `npm run build`) renders every route through the real app shell
(`scripts/prerender/entry.tsx`, `renderToString` + `MemoryRouter`) and writes the markup into a
copy of the **built** `index.html`, with that route's `<title>`, description, `rel=canonical`,
Open Graph tags and `robots` swapped into `<!-- site:meta -->`, and its JSON-LD into the
`id="site-ld"` script (`404.html` gets an empty one). It loads `.tsx` through Vite's SSR module
runner in middleware mode, so there is no second build pipeline; a `window`/`localStorage` shim
is installed first because the flag store reads the query string at import.

- **Every route is a directory**, so Pages 301s `/privacy` to `/privacy/` and then serves 200.
  Canonicals and the sitemap use that form; `siteUrl()` in `src/config/site.ts` builds it.
- **The app mounts over prerendered markup**, so first paint is real content and a crawler that
  does not run JavaScript still sees a populated page.
- `src/components/PageMetaSync/` keeps `document.title`, description, `og:*`, `robots`, canonical
  and the JSON-LD in step during client-side navigation. Unknown routes get `noindex` and no
  canonical.
- **Internal links**: each tool page carries a related-tools block under its guide
  (`src/components/RelatedTools/`), and the footer links every shipped tool from every page. Both
  read `tools.ts`, so anchor text is the tool's own phrase and a flagged tool's links go with its
  route.
- `public/robots.txt` allows everything, names the AdSense crawlers (`Mediapartners-Google`,
  `AdsBot-Google`, `Google-adstxt`) and points at the sitemap.

`vite.config.ts` keeps `base: '/'` (the site is served from the apex) and copies `index.html` to
`404.html` on every build via a local `spa-fallback` plugin, which the prerender rewrites to
`noindex`.

## Feature flags

New features ship behind a flag; turning one on is one value. Registry: `src/config/flags.ts`.

```ts
const search = useFlag('tool-search')          // in a component
import { isEnabled } from './config/flags'     // outside render
if (isEnabled('tool-search')) { … }
```

Precedence, highest first:

1. **URL**: `?flags=tool-search` (on), `?flags=!tool-search` (off), comma-separated,
   page-scoped. Also a shareable preview link; does not stick.
2. **`localStorage` `randomutils.flags`**: what the panel writes, so a flip survives reloads with
   no redeploy.
3. **`FLAGS` in `src/config/flags.ts`**: the committed default.

Panel: `?flags=1` on any URL, or Shift+Alt+F. It shows each switch, where the value came from,
and can copy a preview link. Console: `randomutils.flags.set('tool-search', true)` /
`.clear(id)` / `.reset()` / `.all()`.

| Flag | Default | What it gates |
|---|---|---|
| `ts-to-mp4` | on | Grid card, footer count and `/ts-to-mp4`. |
| `mov-to-mp4` | on | Grid card, footer count and `/mov-to-mp4`. |
| `audio-extract` | on | Grid card, footer count and `/audio-extract`. |
| `uuid-generator` | on | Grid card, footer count and `/uuid-generator`. |
| `compound-interest` | on | Grid card, footer count and `/compound-interest`. |
| `tool-search` | off | Filter box above the home grid. |

Runtime flags are UI gating only. A flag that carries MBs of assets or a dependency must also be
checked at build time by a module-level `const` in a foldable branch, so the payload is
tree-shaken out of `dist/`. A runtime override can hide a feature, never un-ship it.

## How a converter is built

Both MP4 tools are the same queue with a different `spec`; the extractor is its own page.

```
src/tools/
├── video/                     shared kit, format-agnostic
│   ├── ConvertQueue/          drop zone, modes, queue, bulk zip, viewer
│   ├── useFFmpeg.ts           engine: probe → per-stream plan → convert, posters, recycling
│   ├── types.ts               VideoToolSpec: what a format declares
│   ├── JobRow/ Viewer/ StarButton/ StatusIcon/ Toast/ InfoTip/
│   └── utils.ts, useFavorites.ts, useDismissedNames.ts
├── ts-to-mp4/  TsToMp4.tsx + spec.ts     .ts/.mts/.m2ts, 50 MB floor, .star sidecars, paired .jpg
├── mov-to-mp4/ MovToMp4.tsx + spec.ts    .mov/.qt, no floor, poster frames
└── audio-extract/ AudioExtract.tsx + useAudioFFmpeg.ts + AudioExtract.css
```

A tool page is `<ConvertQueue spec={TS_SPEC} />` plus a `VideoToolSpec` and the guide prose under
it (`src/components/ToolGuide/`). The tool stays first on the page; the guide is a sibling below.

Per file, the engine:

1. **Probes** with `ffmpeg -i` (no output); `parseStreams()` reads the streams.
2. **Plans**: `planFor()` copies what a player can take and re-encodes the rest. H.264 8-bit
   4:2:0 → `avc1`, H.265 → `hvc1` (ffmpeg's `hev1` will not open on macOS), AAC and MP3 copied,
   anything else → H.264 `high` CRF 23 `yuv420p` + AAC 160k.
3. **Converts** with `-movflags +faststart`.
4. **Falls back** in Auto: if a planned copy fails, the file is re-encoded whole.
5. **Recycles**: wasm linear memory only grows, so the engine is terminated and reloaded every 6
   files or ~1 GB of source (extractor: 4 files, ~1 GB, and after any file over 500 MB). A
   trapped instance is recycled at once.

Modes per format: **Auto** (per-stream), **Stream copy** (remux; refuses when the video must be
re-encoded), **Re-encode** (H.264 + AAC, slow, works for anything).

Format differences live in the spec: `minSizeMB`, `adtsAudio` (MPEG-TS frames AAC as ADTS, so a
copy needs `aac_adtstoasc`; the filter fails on QuickTime, which carries the config inline),
`posters` (pull a frame per row, as MOV does) and `sidecar` for `.star` files.

Per-tool state lives in `localStorage` under `<id>:favorites` and `<id>:dismissed-names`, keeping
the keys the standalone `ts-to-mp4` app used. Download all zips finished files with `jszip`.

## Adding a tool

1. `src/tools/<tool-id>/`: the component. Astryx for layout; a local CSS file only for what the
   system has no component for, styled from `--color-*` / `--spacing-*` tokens.
2. `src/data/tools.ts`: append an entry with `flag: '<id>'`. That gives the card, footer count,
   metadata and sitemap entry in one edit.
3. `src/App.tsx`: `<Route path="/<tool-id>" element={<Tool />} />`.
4. `src/config/flags.ts`: a `FlagId`, defaulted to `true` when the tool is ready.

A **video → MP4 converter** needs less: `src/tools/<id>/spec.ts` (extensions, size floor, copy
rules, drop copy, modes) and a one-line page rendering `<ConvertQueue spec={…} />`.

**A new prose page** needs the `<Route>` in `App.tsx` and a `STATIC_PAGES` entry in
`src/data/pages.ts`, then the `Page` frame (`src/components/Page`) with `Text`/`Heading`/`List`
inside it.

## Deploy

GitHub Pages, `gh-pages` branch. Build output never sits on `main`.

```bash
npm run deploy
```

`scripts/deploy.sh` builds, copies `dist/` into a temp dir, `git init`s it and force-pushes
`gh-pages`. It has no npm dependencies on purpose: the `gh-pages` package pulls in
`globby > fast-glob > micromatch > braces`, and `braces` carries an unfixed stack-exhaustion
advisory (GHSA-vfj7-8cjw-p6xm). It uses the `gh` CLI token when available and refuses any branch
but `main`; override with `DEPLOY_BRANCH=gh-pages npm run deploy`.

**Push ≠ live.** Only `npm run deploy` publishes. Wait ~45 seconds, then re-curl the live routes.
The closing `Published …` line reports the temp deploy repo's hash, not your commit's.

**Branches:** `main` is what randomutils.com serves; commit to it. `development` exists but trails
`main` and is not in the publish path.

DNS at Namecheap: four `A` records on `@` (185.199.108.153 / .109.153 / .110.153 / .111.153) plus
`CNAME www → jacoblbagent.github.io`. GitHub 301s `www` to the apex, HTTPS is enforced and the
certificate covers both. `public/CNAME` pins the domain.

## Compliance notes

- **Privacy** (`/privacy`) is required: the site carries AdSense, which expects the vendor, the
  cookies and the opt-out (`https://adssettings.google.com/`) to be named. It also backs the
  "nothing is uploaded" claim, so its wording must match the code. A second third party changes
  that page in the same commit.
- **Contact** (`/contact`, address in `src/config/site.ts`) must be reachable without a GitHub
  account; ad review, takedown and abuse handling all assume it.
- **`public/ads.txt`**, the AdSense loader in `index.html` and `publisherId` in
  `src/config/site.ts` must always agree.
- **`public/robots.txt`** carries the crawl rules and the `Sitemap:` line; its comment lists which
  routes have static pages, so update it when a route is added.
- **Error pages carry no ad code.** The loader sits in `index.html`, so `scripts/prerender.mjs`
  strips it from `404.html`. Reword the loader and the strip regex must change with it; the build
  fails if it no longer matches.
- No ad units are placed yet, only the loader.

## Layout

```
src/
├── App.tsx / App.css        shell (AppShell + TopNav + routes), brand mark + token aliases
├── main.tsx                 createRoot, Astryx reset/theme CSS, Theme + LinkProvider
├── config/
│   ├── flags.ts             flag registry + store
│   ├── site.ts              origin, repo, owner, contact address, publisher id, siteUrl()
│   └── FlagsPanel/          the ?flags=1 panel
├── data/                    tools.ts, pages.ts, structuredData.ts
├── icons/Icons.tsx          authored 16px SVG icon set (no unicode glyphs)
├── components/              SiteHeader, SiteFooter, ToolCard, ToolGuide, RelatedTools,
│                            ScrollToTop, PageMetaSync, CookieBanner
├── pages/                   Home, About, Faq, Privacy, Terms, Contact, NotFound
└── tools/                   video/ (shared kit), ts-to-mp4/, mov-to-mp4/, audio-extract/,
                             uuid-generator/, compound-interest/

scripts/
├── deploy.sh                publish dist/ to gh-pages
├── prerender.mjs            one static page per route + sitemap.xml
└── prerender/entry.tsx      renders AppShell for one route (build-time only)

public/                      .nojekyll, CNAME, ads.txt, robots.txt, site.webmanifest,
                             favicon.svg/.ico, apple-touch-icon.png, icon-192/512.png, og.png
TOOL_IDEAS.txt               backlog of client-side-only tool ideas; shipped ones are marked
```

Component styles sit next to their component when one is still needed. Otherwise Astryx owns
colour, type, spacing and radius: nothing in `src/` hardcodes a hex or a pixel value where a token
exists. `src/App.css` holds the brand mark and the alias block; delete an alias when its last
consumer goes.

## Local checks before shipping

```bash
npm run build     # prerender lists every route, sitemap reports "11 URLs (all routes)"
npm run lint      # only the pre-existing ConvertQueue/AudioExtract warnings
npm run preview -- --port 4199
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4199/privacy/   # trailing slash matters
```

After a metadata change:

```bash
curl -s http://localhost:4199/ts-to-mp4/ | grep -o 'id="site-ld"'          # JSON-LD
curl -s http://localhost:4199/ts-to-mp4/ | grep -c 'related-tools'         # sibling links
curl -s http://localhost:4199/404.html | grep -c 'googlesyndication'       # 0
curl -s http://localhost:4199/404.html | grep -c '"@context"'              # 0
```

The build prints `! <path> meta description is over 155 chars and was trimmed` when copy needs
shortening: rewrite the source, the build is fine. A long title is silent, so read the
`dist/<path>/index.html` heads occasionally; the search phrase should survive the 60-character
cut.

Kill a preview server with `pkill -f "[v]ite preview"`; the plain form matches the calling
shell's own command line. Stage explicit paths when committing: this checkout is shared, so never
`git add -A`.

## Origin

The TS → MP4 tool was migrated from a standalone repo (`~/Code/ts-to-mp4`, still deployable),
converted to strict TypeScript and split into component folders. When MOV → MP4 arrived, the
engine, queue and row/viewer components moved into the shared `tools/video/` kit driven by a
per-format `VideoToolSpec`.

## Social cards, icons and install

`index.html` carries the static head: `favicon.svg`, `favicon.ico` (16/32/48), `apple-touch-icon.png`
(180), `site.webmanifest` with 192/512 icons and shortcuts, and `theme-color` for both schemes.
`og.png` is the 1200×630 share card; the prerenderer emits `og:image` / `twitter:image` for
**every** route. The PNGs were rendered from the same path data as `favicon.svg` with `sharp` in a
throwaway directory; nothing at build time depends on it.

## License

MIT. See [`LICENSE`](LICENSE). The FFmpeg builds it loads are under their own licenses
(LGPL/GPL depending on the build); see the `@ffmpeg/core` package.
