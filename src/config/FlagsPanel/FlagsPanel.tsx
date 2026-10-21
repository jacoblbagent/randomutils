import { useEffect, useState } from 'react'
import {
  clearFlag,
  FLAG_IDS,
  FLAGS,
  flagPreviewUrl,
  resetFlags,
  setFlag,
  useFlagSources,
  useFlags,
  useFlagsPanel,
} from '../flags'
import './FlagsPanel.css'

/**
 * The flags panel: every registered flag with a live switch.
 *
 * Reached with `?flags=1` on any URL or Shift+Alt+F — deliberately not linked
 * from the site chrome, so visitors never see it. Each switch writes
 * localStorage for this browser, so a flip survives reloads, navigations and
 * deploys that do not change the default. "Copy preview link" produces a URL
 * that carries the current state to another browser.
 */
export default function FlagsPanel() {
  const [open, setOpen] = useFlagsPanel()
  const flags = useFlags()
  const sources = useFlagSources()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  const overridden = FLAG_IDS.some((id) => sources[id] !== 'default')

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(flagPreviewUrl())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — the URL bar is the fallback */
    }
  }

  return (
    <aside className="flags" aria-label="Feature flags">
      <div className="flags__head">
        <strong className="flags__title">Feature flags</strong>
        <button
          type="button"
          className="flags__close"
          onClick={() => setOpen(false)}
          aria-label="Close feature flags"
        >
          ×
        </button>
      </div>

      <p className="flags__hint">Saved in this browser only — no redeploy needed.</p>

      <ul className="flags__list">
        {FLAG_IDS.map((id) => (
          <li className="flags__row" key={id}>
            <label className="flags__flip">
              <input
                type="checkbox"
                checked={flags[id]}
                onChange={(event) => setFlag(id, event.target.checked)}
              />
              <span className="flags__label">{FLAGS[id].label}</span>
            </label>
            <span className="flags__desc">{FLAGS[id].description}</span>
            <span className="flags__meta">
              <code className={`flags__tag flags__tag--${sources[id]}`}>{sources[id]}</code>
              {sources[id] !== 'default' && (
                <button type="button" className="flags__link" onClick={() => clearFlag(id)}>
                  clear
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="flags__foot">
        <button type="button" className="flags__action" onClick={() => void copyLink()}>
          {copied ? 'Link copied' : 'Copy preview link'}
        </button>
        <button
          type="button"
          className="flags__action"
          onClick={() => resetFlags()}
          disabled={!overridden}
        >
          Reset all
        </button>
      </div>
    </aside>
  )
}
