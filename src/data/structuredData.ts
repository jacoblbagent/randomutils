/**
 * Structured data (JSON-LD) — one graph per route, built from the same
 * registries the pages render from.
 *
 * Read twice: `scripts/prerender.mjs` writes it into each static page's head at
 * build time, and `PageMetaSync` refreshes it in place when a visitor clicks
 * between tools. Both go through `structuredDataFor`, so the crawled graph and
 * the live one are the same object, not two hand-kept copies.
 *
 * What it is for: telling search engines that a tool page is a free, browser-run
 * application rather than just a page of prose (WebApplication), where the page
 * sits in the site (BreadcrumbList), and who publishes the site (Organization).
 * It deliberately does NOT claim FAQPage or HowTo markup: Google's FAQ rich
 * results are limited to authoritative sites, and both types must match visible
 * on-page content exactly — which means sourcing them from the rendered prose
 * rather than restating it here.
 *
 * `<!-- site:ld -->` in index.html is the managed slot: the prerenderer rewrites
 * it for every route, and the build fails if the markers are missing.
 */
import { SITE, siteUrl } from '../config/site'
import { pageMetaFor } from './pages'
import { tools } from './tools'

type Json = Record<string, unknown>

const HOME = `${SITE.url}/`
const ORG_ID = `${HOME}#organization`
const SITE_ID = `${HOME}#website`

/** Home-page description, reused for the WebSite node. */
const SITE_DESCRIPTION = 'Small, single-purpose browser tools that convert video and audio locally in your browser — nothing is uploaded.'

/** The publisher of every page — referenced by @id, defined once per graph. */
function organization(): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    url: HOME,
    email: SITE.contactEmail,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}/icon-512.png`,
      width: 512,
      height: 512,
    },
    sameAs: [SITE.repo],
  }
}

/** The site itself. The home page is its main entity; the rest are parts of it. */
function website(): Json {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE.name,
    url: HOME,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  }
}

/** Home › <page>, the trail search engines show instead of a bare URL. */
function breadcrumb(url: string, crumbs: { name: string; path: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: siteUrl(crumb.path),
    })),
  }
}

/**
 * The graph for one route, or null for a path the site does not publish (the
 * NotFound view) — an unknown URL must not carry structured data claiming to be
 * a page.
 */
export function structuredDataFor(pathname: string): Json | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  const page = pageMetaFor(path)
  if (!page) return null

  const url = siteUrl(page.path)
  const tool = tools.find((entry) => entry.path === page.path)
  const isHome = page.path === '/'

  const graph: Json[] = [organization(), website()]

  graph.push({
    '@type': 'WebPage',
    '@id': `${url}#page`,
    url,
    name: page.heading,
    description: page.description,
    isPartOf: { '@id': SITE_ID },
    inLanguage: 'en',
    ...(isHome ? { mainEntity: { '@id': SITE_ID } } : {}),
    ...(isHome ? {} : { breadcrumb: { '@id': `${url}#breadcrumb` } }),
  })

  if (tool) {
    graph.push({
      '@type': 'WebApplication',
      '@id': `${url}#app`,
      name: tool.seo.anchor,
      alternateName: tool.name,
      url,
      description: tool.seo.description,
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'File converter',
      operatingSystem: 'Any — runs in the browser',
      browserRequirements: 'Requires JavaScript and WebAssembly',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: tool.seo.features,
      mainEntityOfPage: { '@id': `${url}#page` },
      publisher: { '@id': ORG_ID },
    })
  }

  if (!isHome) {
    graph.push(
      breadcrumb(url, [
        { name: SITE.name, path: '/' },
        { name: tool ? tool.name : page.heading, path: page.path },
      ]),
    )
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

/**
 * The graph as a `<script type="application/ld+json">` body: pretty-printed to
 * match the rest of the managed head block, with `<` escaped so nothing in the
 * JSON can close the element early. Empty string for an unpublished route.
 */
export function structuredDataJson(pathname: string, indent = '    '): string {
  const data = structuredDataFor(pathname)
  if (!data) return ''
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c')
  return json
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n')
}