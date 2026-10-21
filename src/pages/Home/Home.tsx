import { useState } from 'react'
import { Link } from 'react-router-dom'
import ToolCard from '../../components/ToolCard/ToolCard'
import { useFlag } from '../../config/flags'
import { useTools, type Tool } from '../../data/tools'
import './Home.css'

function matches(tool: Tool, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [tool.name, tool.tagline, tool.description, ...tool.tags]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

export default function Home() {
  const search = useFlag('tool-search')
  const available = useTools()
  const [query, setQuery] = useState('')
  const shown = search ? available.filter((tool) => matches(tool, query)) : available

  return (
    <div className="home">
      <section className="home__hero">
        {/* The page's one h1. It states what the site is rather than repeating
            the brand the header already carries — the title says the same thing,
            so the tab, the crawler and the reader agree. */}
        <h1 className="home__title">Browser tools that never upload your files</h1>
        <p className="home__lede">
          A hub for small, single-purpose tools. Each one runs entirely in your browser — no accounts, no
          uploads, no server holding your files.
        </p>
      </section>

      <section className="home__tools">
        {search && (
          <input
            type="search"
            className="home__search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter tools…"
            aria-label="Filter tools"
          />
        )}
        <div className="tool-grid">
          {shown.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
        {shown.length === 0 && (
          <p className="small-note home__note">Nothing matches “{query.trim()}”.</p>
        )}
      </section>

      <section className="home__hero">
        <p className="home__lede">
          Every tool here is a page, not a service: the conversion runs on your own machine with
          FFmpeg compiled to WebAssembly, so your file is never uploaded and nothing is kept when
          you close the tab. That is not a setting you have to trust us to leave alone — there is
          no upload step to disable. <Link className="link" to="/about">How that works</Link>, and
          what the site does and does not do, is on the about page.
        </p>
      </section>
    </div>
  )
}
