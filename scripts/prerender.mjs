#!/usr/bin/env node
/**
 * Write a real static page for every route, plus sitemap.xml.
 *
 * Why this exists: GitHub Pages serves an unknown path by answering with
 * 404.html — with a 404 status. A single index.html therefore boots the SPA
 * fine in a browser but tells every crawler the page does not exist, so the
 * tool pages can't be indexed and have nowhere to carry a title. Emitting
 * `dist/<path>/index.html` for each route gives each one its own real page,
 * served 200, with its own <title>/description/canonical, and real rendered
 * markup in #root — the app then mounts over it on load.
 *
 * Sources of truth: src/data/pages.ts for the routes and their metadata (which
 * reads src/data/tools.ts for the tool pages), src/config/site.ts for the
 * origin. Run by `npm run build`, after `vite build`, so it works from the built
 * index.html (with its hashed asset tags) as the template.
 *
 * No dependencies beyond Vite, which is already here: `createServer` in
 * middleware mode gives `ssrLoadModule`, so the prerenderer loads the real
 * .tsx sources with the real config instead of a parallel build pipeline.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')

const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'

/** Absolute origin — social cards need it, since og:image must not be relative. */
const SITE_URL = 'https://randomutils.com'

/**
 * The AdSense loader is in index.html's head, so it lands on every page the
 * template produces. An error page with ad code on it is against AdSense policy
 * (no content = no ads), so 404.html is written with the loader removed.
 */
const ADSENSE_RE = /[ \t]*<!-- Google AdSense -->[\s\S]*?<\/script>\n/

/**
 * The app reads `window` at module scope (the flag store resolves the query
 * string and localStorage once, at import; the favourite lists do the same
 * inside a try/catch). In the browser that is fine; here it needs a stand-in
 * that reports "no query string, no saved overrides" — which is what makes the
 * prerendered HTML match a fresh visitor's first paint.
 */
function installDomShim() {
  const store = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  const win = {
    location: { search: '', href: 'https://randomutils.com/', pathname: '/', origin: 'https://randomutils.com' },
    localStorage: store,
    sessionStorage: store,
    navigator: { clipboard: { writeText: async () => {} } },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  }
  globalThis.window = win
  globalThis.localStorage = store
  globalThis.sessionStorage = store
}

/** Escape text for an HTML attribute or element body. */
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The managed head block. Same markers, same indentation as index.html, so the
 * file reads the same whether it was just built or still sitting in the repo.
 */
function metaBlock({ title, description, canonical, siteName, noindex = false }) {
  const lines = [
    `    <title>${esc(title)}</title>`,
    `    <meta name="description" content="${esc(description)}" />`,
    `    <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />`,
  ]
  if (canonical) lines.push(`    <link rel="canonical" href="${esc(canonical)}" />`)
  lines.push(
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="${esc(siteName)}" />`,
    `    <meta property="og:title" content="${esc(title)}" />`,
    `    <meta property="og:description" content="${esc(description)}" />`,
  )
  if (canonical) lines.push(`    <meta property="og:url" content="${esc(canonical)}" />`)
  lines.push(
    `    <meta property="og:image" content="${SITE_URL}/og.png" />`,
    `    <meta property="og:image:type" content="image/png" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="og:image:alt" content="${esc(siteName)} — browser tools that never upload your files" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:image" content="${SITE_URL}/og.png" />`,
  )
  return `    <!-- site:meta -->\n${lines.join('\n')}\n    <!-- /site:meta -->`
}

const META_RE = /[ \t]*<!-- site:meta -->[\s\S]*?<!-- \/site:meta -->/
const ROOT_RE = /<div id="root"><\/div>/

function withMeta(template, meta) {
  if (!META_RE.test(template)) throw new Error('index.html is missing the <!-- site:meta --> markers')
  return template.replace(META_RE, metaBlock(meta))
}

/**
 * The structured-data slot. The script tag itself lives in index.html so the
 * id (which PageMetaSync updates at runtime) can never disagree with the build;
 * this replaces only its contents. An unpublished route — the 404 shell — gets
 * an empty tag rather than a graph describing a page that does not exist.
 */
const LD_RE = /(<script type="application\/ld\+json" id="site-ld">)[\s\S]*?(<\/script>)/

function withLd(template, json) {
  if (!LD_RE.test(template)) {
    throw new Error('index.html is missing the id="site-ld" script the structured data is written into')
  }
  return template.replace(LD_RE, (_match, open, close) => `${open}${json ? `\n${json}\n    ` : ''}${close}`)
}

function withBody(template, html) {
  if (!ROOT_RE.test(template)) throw new Error('index.html is missing <div id="root"></div>')
  return template.replace(ROOT_RE, `<div id="root">${html}</div>`)
}

function writeFile(relPath, contents) {
  const file = resolve(DIST, relPath)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
  return file
}

async function main() {
  const template = readFileSync(resolve(DIST, 'index.html'), 'utf8')

  installDomShim()
  const { createServer } = await import('vite')
  const server = await createServer({
    root: ROOT,
    configFile: resolve(ROOT, 'vite.config.ts'),
    appType: 'custom',
    logLevel: 'warn',
    server: { middlewareMode: true },
  })

  try {
    const { render } = await server.ssrLoadModule('/scripts/prerender/entry.tsx')
    const { pages, canonicalFor, sitemapPages } = await server.ssrLoadModule('/src/data/pages.ts')
    const { SITE } = await server.ssrLoadModule('/src/config/site.ts')
    const { structuredDataJson } = await server.ssrLoadModule('/src/data/structuredData.ts')

    for (const page of pages) {
      if (page.description.endsWith('…')) {
        console.log(
          `  ! ${page.path.padEnd(14)} meta description is over 155 chars and was trimmed — rewrite the copy`,
        )
      }
      const html = render(page.path)
      if (!html.includes('class="site-head"')) {
        throw new Error(`prerender produced no shell for ${page.path} — refusing to write an empty page`)
      }
      const out = withLd(
        withBody(
          withMeta(template, {
            title: page.title,
            description: page.description,
            canonical: canonicalFor(page.path),
            siteName: SITE.name,
          }),
          html,
        ),
        structuredDataJson(page.path),
      )
      // '/' is dist/index.html; every other route gets its own directory so that
      // GitHub Pages answers /privacy (⇒ /privacy/, 200) instead of the 404 shell.
      const rel = page.path === '/' ? 'index.html' : `${page.path.replace(/^\//, '')}/index.html`
      const file = writeFile(rel, out)
      const bytes = Buffer.byteLength(html)
      console.log(`  ${page.path.padEnd(14)} → ${file.slice(ROOT.length + 1)} (${bytes} B markup)`)
    }

    // The SPA fallback is still needed for genuinely unknown paths, but it must
    // not claim to be the home page or invite a crawler to index a 404.
    const notFound = withMeta(template, {
      title: `Not found — ${SITE.name}`,
      description: 'That link does not match a page on RandomUtils.',
      siteName: SITE.name,
      noindex: true,
    })
    if (!ADSENSE_RE.test(notFound)) {
      throw new Error('index.html is missing the Google AdSense loader block the 404 page has to strip')
    }
    // No structured data on the error page either: it describes no real page.
    writeFile('404.html', withLd(notFound.replace(ADSENSE_RE, ''), ''))

    const lastmod = new Date().toISOString().slice(0, 10)
    const urls = sitemapPages()
    const sitemap = `${[
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<urlset xmlns="${SITEMAP_NS}">`,
      ...urls.map((page) =>
        [
          '  <url>',
          `    <loc>${esc(canonicalFor(page.path))}</loc>`,
          `    <lastmod>${lastmod}</lastmod>`,
          `    <changefreq>${page.path === '/' ? 'weekly' : 'monthly'}</changefreq>`,
          `    <priority>${page.path === '/' ? '1.0' : '0.8'}</priority>`,
          '  </url>',
        ].join('\n'),
      ),
      '</urlset>',
      '',
    ].join('\n')}`
    writeFile('sitemap.xml', sitemap)
    console.log(`  sitemap.xml    → ${urls.length} URLs (${sitemapPages().length === pages.length ? 'all routes' : 'subset'})`)
  } finally {
    await server.close()
  }
}

main().catch((error) => {
  console.error(`prerender failed: ${error.message}`)
  process.exit(1)
})
