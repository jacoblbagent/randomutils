import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import './SiteFooter.css'

/**
 * Footer. It carries the pages a visitor (and an ad reviewer) should be able to
 * reach from anywhere: what the site is, what the ads do to your data, the
 * terms, and a way to contact the owner.
 */
export default function SiteFooter() {
  return (
    <footer className="site-foot">
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
