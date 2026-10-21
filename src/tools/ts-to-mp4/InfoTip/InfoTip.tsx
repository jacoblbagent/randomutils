import { useState } from 'react'
import { IconInfo } from '../../../icons/Icons'
import './InfoTip.css'

/** Hover- and click-open explanation bubble for the conversion methods. */
export default function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="info-tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="info-tip-btn"
        aria-label="More info"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault()
          setOpen((o) => !o)
        }}
        onBlur={() => setOpen(false)}
      >
        <IconInfo />
      </button>
      {open && (
        <span className="info-tip-bubble" role="tooltip">
          {text}
        </span>
      )}
    </span>
  )
}
