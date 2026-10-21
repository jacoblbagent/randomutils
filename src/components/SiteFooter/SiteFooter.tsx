import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import { useTools } from '../../data/tools'
import './SiteFooter.css'

/**
 * Footer. Beyond the count, it carries the two pages the site is expected to
 * have and be able to be reached by: the privacy policy (what the ad-serving
 * page loads, and the check on the "nothing is uploaded" claim beside it) and
 * contact (ad, takedown and abuse handling).
 */
export default function SiteFooter() {
  const live = useTools().filter((t) => t.status === 'live').length
  return (
    <footer className="site-foot">
      <div className="site-foot__note">
        <span>Tools run entirely in your browser — nothing is uploaded anywhere.</span>
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
      </div>
      <span className="site-foot__count">
        {live} tool{live === 1 ? '' : 's'} live
      </span>
    </footer>
  )
}
