import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import './SiteFooter.css'

/**
 * Footer. It carries the two pages the site is expected to have and be able to
 * be reached by: the privacy policy (what the ad-serving page loads) and
 * contact (ad, takedown and abuse handling).
 */
export default function SiteFooter() {
  return (
    <footer className="site-foot">
      <nav className="site-foot__links" aria-label="Site information">
        <Link className="site-foot__link" to="/privacy">
          Privacy
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
