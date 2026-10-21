import ToolCard from '../../components/ToolCard/ToolCard'
import { tools } from '../../data/tools'
import './Home.css'

const shown = tools

export default function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <h1>RandomUtils</h1>
        <p className="home__lede">
          A hub for small, single-purpose tools. Each one runs entirely in your browser — no accounts, no
          uploads, no server holding your files.
        </p>
      </section>

      <section className="home__tools">
        <div className="tool-grid">
          {shown.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
        <p className="small-note home__note">
          More tools land here as they get built — the grid is driven by{' '}
          <code>src/data/tools.ts</code>.
        </p>
      </section>
    </div>
  )
}
