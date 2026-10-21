import { useTools } from '../../data/tools'
import './SiteFooter.css'

export default function SiteFooter() {
  const live = useTools().filter((t) => t.status === 'live').length
  return (
    <footer className="site-foot">
      <span>Tools run entirely in your browser — nothing is uploaded anywhere.</span>
      <span className="site-foot__count">
        {live} tool{live === 1 ? '' : 's'} live
      </span>
    </footer>
  )
}
