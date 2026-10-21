import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import { useTools } from '../../data/tools'
import './SiteFooter.css'

/**
 * Footer. It carries the pages a visitor (and an ad reviewer) should be able to
 * reach from anywhere: what the site is, what the ads do to your data, the
 * terms, and a way to contact the owner.
 *
 * The tool links come from the registry, so every page on the site — not just
 * the home grid — links to every shipped tool, with the tool's own phrase as the
 * anchor text. A flagged tool drops out of here with its route.
 */
export default function SiteFooter() {
  const tools = useTools()
  return (
    <footer className="site-foot">
      {tools.length > 0 && (
        <nav className="site-foot__links" aria-label="Tools">
          {tools.map((tool) => (
            <Link className="site-foot__link" to={tool.path} key={tool.id}>
              {tool.seo.anchor}
            </Link>
          ))}
        </nav>
      )}
      <nav className="site-foot__links" aria-label="Site information">
        <Link className="site-foot__link" to="/about">
          About
        </Link>
        <Link className="site-foot__link" to="/faq">
          FAQ
        </Link>
        <Link className="site-foot__link" to="/privacy">
          Privacy
        </Link>
        <Link className="site-foot__link" to="/terms">
          Terms
        </Link>
        <Link className="site-foot__link" to="/contact">
          Contact
        </Link>
        <a className="site-foot__link" href={`mailto:${SITE.contactEmail}`}>
          {SITE.contactEmail}
        </a>
      </nav>
    </footer>
  )
}
