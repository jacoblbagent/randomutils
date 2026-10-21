/**
 * The page registry — every URL the site answers with a real, indexable page.
 *
 * This is the single source of truth for `<title>`, the meta description, the
 * canonical URL and sitemap.xml: `scripts/prerender.mjs` reads it at build time
 * to emit one static HTML file per route (so GitHub Pages answers 200 instead
 * of serving the 404 fallback), and `PageMetaSync` in App.tsx reads it at
 * runtime to keep the head correct while a visitor navigates client-side.
 *
 * Adding a page: add its route in App.tsx and an entry here.
 */
import { SITE, siteUrl } from '../config/site'
import { tools } from './tools'

export interface PageMeta {
  /** Route path as react-router sees it — '/' for home, no trailing slash. */
  path: string
  /** Full <title> text. */
  title: string
  /** Meta description, ~155 characters. */
  description: string
  /** Page heading, where one is not rendered by the page body. */
  heading: string
  /**
   * Whether the page belongs in sitemap.xml. Pages a crawler should not index
   * (the 404 shell) are left out.
   */
  inSitemap: boolean
}

const STATIC_PAGES: PageMeta[] = [
  {
    path: '/',
    title: `${SITE.name} — browser tools that never upload your files`,
    description:
      'Small, single-purpose browser tools: convert TS and MOV video to MP4 and pull the audio out of a video. Everything runs locally with FFmpeg in WebAssembly — nothing is uploaded.',
    heading: SITE.name,
    inSitemap: true,
  },
  {
    path: '/privacy',
    title: `Privacy policy — ${SITE.name}`,
    description:
      'What we do with the files you open in a RandomUtils tool (nothing leaves your browser) and what our one third party, Google AdSense, does with cookies.',
    heading: 'Privacy policy',
    inSitemap: true,
  },
  {
    path: '/contact',
    title: `Contact — ${SITE.name}`,
    description:
      'Report a broken conversion, ask about a format, or reach the owner about advertising, business or takedown questions — no GitHub account needed.',
    heading: 'Contact',
    inSitemap: true,
  },
  {
    path: '/about',
    title: `About — ${SITE.name}`,
    description:
      'What RandomUtils is, why every tool runs entirely in your browser instead of uploading your files, what the site deliberately does not do, and who runs it.',
    heading: 'About',
    inSitemap: true,
  },
  {
    path: '/faq',
    title: `FAQ — ${SITE.name}`,
    description:
      'Why a file is skipped, why the FFmpeg engine reloads mid-batch, whether anything is uploaded, whether big batches are safe, and how to install the site as an app.',
    heading: 'Frequently asked questions',
    inSitemap: true,
  },
  {
    path: '/terms',
    title: `Terms of use — ${SITE.name}`,
    description:
      'The plain terms for using the RandomUtils tools: free to use and provided as-is without warranty, your files stay yours, and the site is supported by advertising.',
    heading: 'Terms of use',
    inSitemap: true,
  },
]

/** Trim a description to the length search engines actually display. */
function clamp(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).replace(/[,.;:\s]\S*$/, '')}…`
}

const TOOL_PAGES: PageMeta[] = tools.map((tool) => ({
  path: tool.path,
  title: `${tool.name} — ${tool.tagline} — ${SITE.name}`,
  description: clamp(tool.description),
  heading: tool.name,
  inSitemap: true,
}))

export const pages: PageMeta[] = [...STATIC_PAGES, ...TOOL_PAGES]

/** Every route with a real page, in the order they should be written. */
export const pagePaths: string[] = pages.map((page) => page.path)

/** Metadata for a route, or undefined for anything unknown (→ NotFound). */
export function pageMetaFor(pathname: string): PageMeta | undefined {
  const path = pathname.replace(/\/+$/, '') || '/'
  return pages.find((page) => page.path === path)
}

/** The canonical URL of a route — what the <link rel="canonical"> points at. */
export function canonicalFor(path: string): string {
  return siteUrl(path)
}

/** Pages that belong in sitemap.xml. */
export function sitemapPages(): PageMeta[] {
  return pages.filter((page) => page.inSitemap)
}
