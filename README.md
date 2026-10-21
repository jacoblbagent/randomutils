# RandomUtils

A hub for small, single-purpose browser tools. Every tool runs entirely client-side — no accounts, no
uploads, no server holding your files.

**🔗 Live:** https://jacoblbagent.github.io/randomutils/

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
`react-router-dom`'s `HashRouter` — the site is static, so a deep link such as
`/#/ts-to-mp4` survives a reload with no server rewrite rule. No state library, no CSS framework.

**Ports:** dev :5196 (Hermes web UI Projects row), preview :4173.

## Layout

```
src/
├── App.tsx                     # shell: header + <Routes> + footer
├── App.css                     # tokens (colour, 4px space grid, radius, type) + shared primitives
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
2. Append an entry to `src/data/tools.ts` (the home grid and footer count read it).
3. Add a `<Route path="/<tool-id>" element={<Tool />} />` in `src/App.tsx`.

## Deploy

GitHub Pages, `gh-pages` branch (build output stays out of `main`):

```bash
npm run deploy     # build + publish dist/ to the gh-pages branch
```

`scripts/deploy.sh` does this with no npm dependencies: it builds, copies `dist/` into a temp dir,
inits a repo there and force-pushes `gh-pages`. The `gh-pages` package is deliberately not used — it
pulls in `globby > fast-glob > micromatch > braces`, and `braces` has an unfixed stack-exhaustion
advisory (GHSA-vfj7-8cjw-p6xm, no patched release), so `npm audit` stays clean without an override.

`vite.config.ts` sets `base: '/randomutils/'` for production builds only, so `npm run dev` stays at
the root.

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
