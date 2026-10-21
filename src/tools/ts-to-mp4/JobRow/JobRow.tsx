import { useEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import type { Job } from '../types'
import { baseName, downloadFilename, formatBytes, PHASE_LABEL } from '../utils'
import { IconDownload, IconPencil, IconX } from '../../../icons/Icons'
import StarButton from '../StarButton/StarButton'
import StatusIcon from '../StatusIcon/StatusIcon'
import Viewer from '../Viewer/Viewer'
import './JobRow.css'

interface JobRowProps {
  job: Job
  index: number
  thumb?: string
  favorite: boolean
  onToggleFavorite: () => void
  isActive: boolean
  isViewing: boolean
  isLast: boolean
  isSelected: boolean
  onToggleSelect: () => void
  onRangeSelect: () => void
  onInteract: () => void
  onView: () => void
  onRemove: () => void
  onRetry: () => void
  onRename: (value: string) => void
  viewerJobs: Job[]
  onChangeViewing: (id: number) => void
  onCloseViewing: () => void
  /** Set only on the row currently being viewed, so the row can scroll itself into view. */
  viewingRowRef?: Ref<HTMLLIElement>
}

export default function JobRow({
  job,
  index,
  thumb,
  favorite,
  onToggleFavorite,
  isActive,
  isViewing,
  isLast,
  isSelected,
  onToggleSelect,
  onRangeSelect,
  onInteract,
  onView,
  onRemove,
  onRetry,
  onRename,
  viewerJobs,
  onChangeViewing,
  onCloseViewing,
  viewingRowRef,
}: JobRowProps) {
  const { file, status, phase, progress, result, error } = job
  const pct = Math.round(progress * 100)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const editRef = useRef<HTMLInputElement | null>(null)
  // Checkboxes' native 'change' event carries no modifier-key info (it's a plain Event, not a
  // MouseEvent), so the shift state is captured on the preceding 'click' (which does have it —
  // click always fires immediately before change) and read back when 'change' fires.
  const checkShiftRef = useRef(false)

  const indeterminate = isActive && (phase === 'loading' || phase === 'reading')
  const name = baseName(job)

  const startEdit = () => {
    setDraft(name)
    setEditing(true)
  }
  const commit = () => {
    setEditing(false)
    onRename(draft)
  }

  useEffect(() => {
    if (editing) editRef.current?.select()
  }, [editing])

  return (
    <li
      ref={viewingRowRef}
      className={`job ${status} ${isActive ? 'active' : ''} ${isViewing ? 'viewing' : ''} ${isLast ? 'last' : ''} ${status !== 'done' ? 'no-view' : ''}`}
      onPointerDown={(e) => {
        if (e.shiftKey) e.preventDefault() // stop native text-selection drag during shift-click
        onInteract()
      }}
      onClick={(e) => {
        // Row acts as "View" everywhere except its buttons/links/rename field (star, download, retry, remove, rename),
        // and only once the file has actually converted — nothing to watch before that. Shift/cmd/ctrl-click select
        // instead of viewing, same as Finder/Gmail/etc: shift extends a range from the last pick, cmd/ctrl toggles one.
        if (status !== 'done') return
        if ((e.target as HTMLElement).closest('button, a, input')) return
        if (e.shiftKey) return onRangeSelect()
        if (e.metaKey || e.ctrlKey) return onToggleSelect()
        onView()
      }}
    >
      <div className="job-main">
        {status === 'done' && (
          <input
            type="checkbox"
            className="select-check"
            checked={isSelected}
            onClick={(e) => {
              e.stopPropagation()
              checkShiftRef.current = e.shiftKey
            }}
            onChange={() => {
              // The native toggle already ran (or didn't); either way this is a controlled input,
              // so the next render sets `checked` to whatever our selection state says regardless.
              if (checkShiftRef.current) onRangeSelect()
              else onToggleSelect()
            }}
            aria-label={`Select ${name}`}
          />
        )}
        {thumb ? (
          <img className="thumb" src={thumb} alt="" />
        ) : (
          <div className="thumb thumb-empty" aria-hidden="true" />
        )}
        <div className="job-info">
          <div className="job-name">
            <span className="muted idx">{index}.</span>
            {editing ? (
              <input
                ref={editRef}
                type="text"
                className="name-edit"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditing(false)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="ellipsis" title={file.name}>
                  {name}
                </span>
                <StatusIcon status={status} />
                <button
                  type="button"
                  className="icon rename-btn"
                  aria-label={`Rename ${name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    startEdit()
                  }}
                >
                  <IconPencil />
                </button>
              </>
            )}
          </div>
          <div className="job-meta muted">
            {formatBytes(file.size)}
            {status === 'queued' && ' · Waiting'}
            {status === 'converting' && ` · ${(phase && PHASE_LABEL[phase]) || 'Starting…'}${indeterminate ? '' : ` ${pct}%`}`}
            {status === 'done' && result && ` · ${result.seconds.toFixed(1)}s`}
            {status === 'error' && <span className="error-text"> · {error}</span>}
          </div>
        </div>
        <div className="job-actions">
          <span className="fav-dl">
            <StarButton on={favorite} name={file.name} onClick={onToggleFavorite} />
            {status === 'done' && result && (
              <a className="secondary small" href={result.url} download={downloadFilename(job)}>
                <IconDownload />
                Download
              </a>
            )}
          </span>
          {status === 'error' && (
            <button className="secondary small" onClick={onRetry}>
              Retry
            </button>
          )}
          {!isActive && (
            <button className="icon" aria-label={`Remove ${file.name}`} onClick={onRemove}>
              <IconX />
            </button>
          )}
        </div>
      </div>

      {status === 'converting' && (
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={indeterminate ? 'indeterminate' : ''}
            style={{ transform: `scaleX(${indeterminate ? 1 : progress})` }}
          />
        </div>
      )}

      {isViewing && (
        <Viewer
          jobs={viewerJobs}
          viewingId={job.id}
          onChange={onChangeViewing}
          onClose={onCloseViewing}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </li>
  )
}
