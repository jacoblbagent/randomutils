import type { ReactNode } from 'react'
import './ToolGuide.css'

/**
 * The reference that sits under a converter: what the format actually is, when
 * a stream copy is safe versus when a re-encode is the only way through, and
 * the handful of failures people actually hit.
 *
 * The tool is the product and stays the first thing on the page — this is a
 * sibling below it, not a preamble above it. Layout comes from the shared .doc
 * prose frame in App.css, so a guide reads like the privacy and contact pages
 * rather than a second design; only the separator and the heading scale are
 * local.
 */
export default function ToolGuide({
  heading,
  children,
}: {
  /** Sentence-case heading for the block, e.g. "About this tool". */
  heading: string
  children: ReactNode
}) {
  return (
    <article className="doc tool-guide">
      <header className="tool-guide__head">
        <h2 className="tool-guide__title">{heading}</h2>
      </header>
      {children}
    </article>
  )
}
