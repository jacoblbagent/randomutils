import { Link } from 'react-router-dom'
import type { Tool } from '../../data/tools'
import { IconArrowRight } from '../../icons/Icons'
import './ToolCard.css'

/**
 * One card per tool. A live tool is a whole-card link; anything not shipped yet
 * renders as an inert card so the grid can announce it without a dead link.
 */
export default function ToolCard({ tool }: { tool: Tool }) {
  const body = (
    <>
      <span className="tool-card__head">
        <span className="tool-card__name">{tool.name}</span>
        {tool.status === 'soon' ? (
          <span className="chip">Soon</span>
        ) : (
          <span className="tool-card__go" aria-hidden="true">
            <IconArrowRight />
          </span>
        )}
      </span>
      <span className="tool-card__tagline">{tool.tagline}</span>
      <span className="tool-card__desc">{tool.description}</span>
      <span className="tool-card__tags chips">
        {tool.tags.map((tag) => (
          <span className="chip" key={tag}>
            {tag}
          </span>
        ))}
      </span>
    </>
  )

  if (tool.status !== 'live') {
    return <div className="tool-card tool-card--soon">{body}</div>
  }

  return (
    <Link className="tool-card" to={tool.path}>
      {body}
    </Link>
  )
}
