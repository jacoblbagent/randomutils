import { Link } from 'react-router-dom'
import { IconExternal } from '../../icons/Icons'
import './SiteHeader.css'

const REPO = 'https://github.com/jacoblbagent/randomutils'

export default function SiteHeader() {
  return (
    <header className="site-head">
      <Link className="site-head__brand" to="/">
        <span className="site-head__mark" aria-hidden="true" />
        RandomUtils
      </Link>
      <nav className="site-head__links" aria-label="Site">
        <a className="site-head__link" href={REPO} target="_blank" rel="noreferrer">
          Source
          <IconExternal />
        </a>
      </nav>
    </header>
  )
}
