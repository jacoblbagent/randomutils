/**
 * Site-wide constants — the things the pages, the head meta and the generated
 * sitemap.xml all need to agree on. Change a value here, not in five places.
 *
 * `contactEmail` is the public address on /contact: ad review, takedown and
 * abuse handling all assume a reachable owner, and mail must arrive without the
 * sender needing a GitHub account.
 */
export const SITE = {
  name: 'RandomUtils',
  /** Apex the site is served from, no trailing slash. */
  url: 'https://randomutils.com',
  repo: 'https://github.com/jacoblbagent/randomutils',
  owner: 'jacoblbagent',
  contactEmail: 'jacoblbagent@gmail.com',
  /** AdSense publisher id, matching public/ads.txt and the loader in index.html. */
  publisherId: 'ca-pub-7737570630269660',
} as const

export const CONTACT_MAILTO = `mailto:${SITE.contactEmail}`

/**
 * Canonical form of a site URL: the static build serves each route from a
 * directory (`/privacy/index.html`), so the addressable page ends in a slash
 * and that is what canonical tags and the sitemap must say.
 */
export function siteUrl(path: string): string {
  if (path === '/' || path === '') return `${SITE.url}/`
  return `${SITE.url}${path.replace(/\/$/, '')}/`
}
