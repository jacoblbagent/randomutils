import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE } from '../../config/site'
import { canonicalFor, pageMetaFor } from '../../data/pages'

/**
 * Keeps the document head in step with the route.
 *
 * The build already writes the correct title, description and canonical into
 * each prerendered page (scripts/prerender.mjs), so a cold load — and every
 * crawler — sees the right thing without running any JavaScript. This is for
 * what happens next: a visitor clicking between tools, where nothing would
 * reload the document and the tab would keep saying "RandomUtils".
 *
 * The canonical uses the same trailing-slash form as the static HTML and
 * sitemap.xml, because that is the URL the static host answers 200 for; the
 * address bar can say /privacy while the canonical says /privacy/.
 *
 * Unknown routes (the SPA's NotFound view) get noindex and drop the canonical,
 * so a crawler never files them under an address that was never published.
 */
export default function PageMetaSync() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = pageMetaFor(pathname)
    const title = meta ? meta.title : `Not found — ${SITE.name}`
    const description = meta ? meta.description : 'That link does not match a page on RandomUtils.'

    document.title = title

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      const selector = `meta[${attr}="${key}"]`
      let tag = document.head.querySelector<HTMLMetaElement>(selector)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, key)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    setMeta('name', 'description', description)
    setMeta('name', 'robots', meta ? 'index, follow' : 'noindex, follow')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (meta) {
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonicalFor(meta.path)
    } else if (link) {
      link.remove()
    }
  }, [pathname])

  return null
}
