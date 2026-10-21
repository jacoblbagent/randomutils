import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>Nothing here</h1>
      <p className="muted">That link doesn’t match a tool. Pick one from the list instead.</p>
      <p>
        <Link className="btn-home secondary" to="/">
          Back to all tools
        </Link>
      </p>
    </div>
  )
}
