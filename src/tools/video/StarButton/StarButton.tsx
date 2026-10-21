import { IconStar } from '../../../icons/Icons'
import './StarButton.css'

interface StarButtonProps {
  on: boolean
  name: string
  onClick: () => void
}

export default function StarButton({ on, name, onClick }: StarButtonProps) {
  return (
    <button
      type="button"
      className={`star ${on ? 'on' : ''}`}
      aria-pressed={on}
      aria-label={on ? `Unfavorite ${name}` : `Favorite ${name}`}
      title={on ? 'Remove from favorites' : 'Add to favorites'}
      onClick={onClick}
    >
      <IconStar filled={on} />
    </button>
  )
}
