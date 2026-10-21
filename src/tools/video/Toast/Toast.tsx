import { IconX } from '../../../icons/Icons'
import './Toast.css'

/** Bottom-corner status note. Auto-dismissing is the caller's job; this is closed by hand. */
export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button className="icon" aria-label="Dismiss" onClick={onClose}>
        <IconX />
      </button>
    </div>
  )
}
