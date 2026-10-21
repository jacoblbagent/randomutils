import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import { IconExternal } from '../../icons/Icons'
import './SiteHeader.css'

export default function SiteHeader() {
  return (
    <header className="site-head">
      <Link className="site-head__brand" to="/">
        <span className="site-head__mark" aria-hidden="true" />
        {SITE.name}
      </Link>
      <nav className="site-head__links" aria-label="Site">
        {/* Reachable without a GitHub account — the repo alone is not enough. */}
        <Link className="site-head__link" to="/contact">
          Contact
        </Link>
        <a className="site-head__link" href={SITE.repo} target="_blank" rel="noreferrer">
          Source
          <IconExternal />
        </a>
      </nav>
    </header>
  )
}
