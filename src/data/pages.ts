/**
 * The page registry, every URL the site answers with a real, indexable page.
 *
 * Single source of truth for `<title>`, the meta description, the canonical URL
 * and sitemap.xml: `scripts/prerender.mjs` reads it at build time to emit one
 * static HTML file per route, and `PageMetaSync` reads it at runtime to keep the
 * head correct while a visitor navigates client-side.
 *
 * Adding a page: add its route in App.tsx and an entry here.
 */
import { SITE, siteUrl } from '../config/site'
import { tools } from './tools'

export interface PageMeta {
  /** Route path as react-router sees it, '/' for home, no trailing slash. */
  path: string
  /** Full <title> text. */
  title: string
  /** Meta description, ~155 characters. */
  description: string
  /** Page heading, where one is not rendered by the page body. */
  heading: string
  /** Whether the page belongs in sitemap.xml. */
  inSitemap: boolean
}

const STATIC_PAGES: PageMeta[] = [
  {
    path: '/',
    title: `${SITE.name}: browser tools that never upload your files`,
    description:
      'Convert TS and MOV video to MP4, extract a video’s audio, or generate a password or UUID. All in your browser, with no uploads.',
    heading: SITE.name,
    inSitemap: true,
  },
  {
    path: '/privacy',
    title: `Privacy policy | ${SITE.name}`,
    description:
      'What RandomUtils does with your files (nothing leaves your browser) and what the one third party, Google AdSense, does with cookies.',
    heading: 'Privacy policy',
    inSitemap: true,
  },
  {
    path: '/contact',
    title: `Contact | ${SITE.name}`,
    description:
      'Report a broken conversion, ask about a format, or reach the owner about advertising or takedown. No GitHub account needed.',
    heading: 'Contact',
    inSitemap: true,
  },
  {
    path: '/about',
    title: `About | ${SITE.name}`,
    description:
      'What RandomUtils is, why every tool runs in your browser, what the site does not do, and who runs it.',
    heading: 'About',
    inSitemap: true,
  },
  {
    path: '/faq',
    title: `FAQ | ${SITE.name}`,
    description:
      'Why a file is skipped, why FFmpeg reloads mid-batch, whether anything is uploaded, and how to install the site as an app.',
    heading: 'Frequently asked questions',
    inSitemap: true,
  },
  {
    path: '/terms',
    title: `Terms of use | ${SITE.name}`,
    description:
      'Terms for the RandomUtils tools: free, provided as-is without warranty, your files stay yours, funded by advertising.',
    heading: 'Terms of use',
    inSitemap: true,
  },
]

/**
 * Trim a description to the length search engines display.
 *
 * Only a backstop: every page carries hand-written copy that fits, and the
 * build logs a note when this fires. Trailing function words are dropped before
 * the ellipsis, so a cut never ends on a dangling article.
 */
const DANGLING = /(?:[,;:]|\s(?:a|an|the|and|or|but|for|to|of|in|on|at|by|with|from|that|this|it|its|is|are|was|as|so|than|then|into|over|your|you|we|our))+$/i

function clamp(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1).replace(/[^\w.)\]]+$/, '')
  return `${cut.replace(DANGLING, '')}…`
}

/** Tool pages read their copy from the tool registry (src/data/tools.ts). */
const TOOL_PAGES: PageMeta[] = tools.map((tool) => ({
  path: tool.path,
  title: tool.seo.title,
  description: clamp(tool.seo.description),
  heading: tool.name,
  inSitemap: true,
}))

/** Every page's final metadata, descriptions clamped in one place. */
export const pages: PageMeta[] = [...STATIC_PAGES, ...TOOL_PAGES].map((page) => ({
  ...page,
  description: clamp(page.description),
}))

/** Every route with a real page, in the order they should be written. */
export const pagePaths: string[] = pages.map((page) => page.path)

/** Metadata for a route, or undefined for anything unknown (→ NotFound). */
export function pageMetaFor(pathname: string): PageMeta | undefined {
  const path = pathname.replace(/\/+$/, '') || '/'
  return pages.find((page) => page.path === path)
}

/** The canonical URL of a route, what the <link rel="canonical"> points at. */
export function canonicalFor(path: string): string {
  return siteUrl(path)
}

/** Pages that belong in sitemap.xml. */
export function sitemapPages(): PageMeta[] {
  return pages.filter((page) => page.inSitemap)
}
