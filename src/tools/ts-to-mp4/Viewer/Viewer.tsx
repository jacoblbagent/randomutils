import { useEffect } from 'react'
import type { Job } from '../types'
import { IconX } from '../../../icons/Icons'
import './Viewer.css'

interface ViewerProps {
  jobs: Job[]
  viewingId: number
  onChange: (id: number) => void
  onClose: () => void
  onToggleFavorite: () => void
}

// Sits inside the row of the job it's showing (JobRow renders it there when that job is
// isViewing), so it only ever needs to show the converted video itself — everything else about
// the file (name, star, download) is already right there in the row above it.
export default function Viewer({ jobs, viewingId, onChange, onClose, onToggleFavorite }: ViewerProps) {
  const index = jobs.findIndex((j) => j.id === viewingId)
  const job = jobs[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea')) return
      if (e.key === 'Escape') onClose()
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) onToggleFavorite()
      if (e.key === 'ArrowLeft' && index > 0) onChange(jobs[index - 1].id)
      if (e.key === 'ArrowRight' && index < jobs.length - 1) onChange(jobs[index + 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, jobs, onChange, onClose, onToggleFavorite])

  if (!job?.result) return null

  return (
    <div className="viewer">
      <div className="viewer-head">
        <button className="icon" aria-label="Close viewer" onClick={onClose}>
          <IconX />
        </button>
      </div>
      <div className="viewer-stage">
        <video src={job.result.url} controls autoPlay playsInline />
      </div>
    </div>
  )
}
