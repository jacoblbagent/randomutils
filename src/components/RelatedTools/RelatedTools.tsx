import { Link } from 'react-router-dom'
import { useTools } from '../../data/tools'
import './RelatedTools.css'

/**
 * The links from this tool to its siblings, sitting under the guide.
 *
 * Why it exists: without it every tool page is a leaf with exactly one editorial
 * inbound link — the card on the home page — and no contextual link between the
 * tools themselves, so a crawler has nothing to follow sideways and no anchor
 * text telling it what the other pages are about. The block carries the phrase
 * for each sibling ("MOV to MP4 converter") rather than a bare "read more", and
 * the tools come from the registry, so a flagged tool's link disappears with its
 * route and the section hides itself when nothing is left.
 */
export default function RelatedTools({ currentId }: { currentId: string }) {
  const others = useTools().filter((tool) => tool.id !== currentId)
  if (others.length === 0) return null

  return (
    <nav className="related-tools" aria-labelledby="related-tools-title">
      <h2 className="related-tools__title" id="related-tools-title">
        {others.length === 1 ? 'The other browser tool' : 'Other browser tools'}
      </h2>
      <ul className="related-tools__list">
        {others.map((tool) => (
          <li className="related-tools__item" key={tool.id}>
            <Link className="related-tools__link" to={tool.path}>
              <span className="related-tools__name">{tool.seo.anchor}</span>
              <span className="related-tools__line">{tool.tagline}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="related-tools__note">
        Same setup on every page: the work happens in this tab with FFmpeg compiled to
        WebAssembly, so nothing you open is uploaded.
      </p>
    </nav>
  )
}