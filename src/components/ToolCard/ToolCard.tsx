import { Link } from 'react-router-dom'
import type { Tool } from '../../data/tools'
import { IconArrowRight } from '../../icons/Icons'
import './ToolCard.css'

/** One card per tool — a whole-card link to its route. */
export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link className="tool-card" to={tool.path}>
      <span className="tool-card__head">
        <span className="tool-card__name">{tool.name}</span>
        <span className="tool-card__go" aria-hidden="true">
          <IconArrowRight />
        </span>
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
    </Link>
  )
}
