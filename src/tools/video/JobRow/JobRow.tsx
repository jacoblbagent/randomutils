import { useEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { VStack, HStack, StackItem } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { IconButton } from '@astryxdesign/core/IconButton'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { Icon } from '@astryxdesign/core/Icon'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Thumbnail } from '@astryxdesign/core/Thumbnail'
import type { Job } from '../types'
import { baseName, downloadFilename, formatBytes, PHASE_LABEL } from '../utils'
import { IconDownload, IconPencil, IconStar, IconX } from '../../../icons/Icons'
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
  viewingRowRef?: Ref<HTMLElement>
}

const STATUS_BADGE = {
  queued: { variant: 'neutral' as const, label: 'Queued' },
  converting: { variant: 'info' as const, label: 'Converting' },
  done: { variant: 'success' as const, label: 'Done' },
  error: { variant: 'error' as const, label: 'Failed' },
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
  // A paired .jpg/.png wins; otherwise a frame pulled out of the video itself (poster formats).
  const image = thumb ?? job.poster
  const pct = Math.round(progress * 100)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const editRef = useRef<HTMLInputElement | null>(null)

  const indeterminate = isActive && (phase === 'loading' || phase === 'reading')
  const name = baseName(job)
  const badge = STATUS_BADGE[status]

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

  // The download has to carry a filename, and Button has no download attribute, so the
  // click drives a throwaway anchor: same bytes, same name, one real button for the user.
  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = downloadFilename(job)
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <section
      ref={viewingRowRef}
      className={`job ${status} ${isActive ? 'active' : ''} ${isViewing ? 'viewing' : ''} ${isLast ? 'last' : ''} ${status !== 'done' ? 'no-view' : ''}`}
      onPointerDown={(e) => {
        if (e.shiftKey) e.preventDefault() // stop native text-selection drag during shift-click
        onInteract()
      }}
      onClick={(e) => {
        // Row acts as "View" everywhere except its buttons/links/inputs, and only once the file
        // has actually converted. Shift/cmd/ctrl-click select instead, same as Finder or Gmail.
        if (status !== 'done') return
        if ((e.target as HTMLElement).closest('button, a, input')) return
        if (e.shiftKey) return onRangeSelect()
        if (e.metaKey || e.ctrlKey) return onToggleSelect()
        onView()
      }}
    >
      <VStack gap={2}>
        <HStack gap={3} vAlign="center" wrap="wrap">
          {status === 'done' && (
            <CheckboxInput
              label={`Select ${name}`}
              isLabelHidden
              value={isSelected}
              onChange={() => onToggleSelect()}
            />
          )}
          {image ? (
            <Thumbnail src={image} alt="" />
          ) : (
            <span className="thumb thumb-empty" aria-hidden="true" />
          )}
          <StackItem size="fill">
            <VStack gap={0.5}>
              <HStack gap={1.5} vAlign="center">
                <Text type="supporting">{index}.</Text>
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
                    <Text maxLines={1}>{name}</Text>
                    <Badge variant={badge.variant} label={badge.label} />
                    <IconButton
                      label={`Rename ${name}`}
                      icon={<Icon icon={IconPencil} size="sm" />}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit()
                      }}
                    />
                  </>
                )}
              </HStack>
              <Text type="supporting">
                {formatBytes(file.size)}
                {status === 'queued' && ' · Waiting'}
                {status === 'converting' &&
                  ` · ${(phase && PHASE_LABEL[phase]) || 'Starting…'}${indeterminate ? '' : ` ${pct}%`}`}
                {status === 'done' && result && ` · ${result.seconds.toFixed(1)}s`}
                {status === 'error' && ` · ${error}`}
              </Text>
            </VStack>
          </StackItem>
          <HStack gap={1} vAlign="center">
            <IconButton
              label={favorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
              icon={<Icon icon={IconStar} size="sm" />}
              variant={favorite ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={favorite}
              onClick={() => onToggleFavorite()}
            />
            {status === 'done' && result && (
              <Button
                label="Download"
                size="sm"
                icon={<Icon icon={IconDownload} size="sm" />}
                onClick={() => download()}
              />
            )}
            {status === 'error' && <Button label="Retry" size="sm" onClick={() => onRetry()} />}
            {!isActive && (
              <IconButton
                label={`Remove ${file.name}`}
                icon={<Icon icon={IconX} size="sm" />}
                variant="ghost"
                size="sm"
                onClick={() => onRemove()}
              />
            )}
          </HStack>
        </HStack>

        {status === 'converting' && (
          <ProgressBar
            label={`${name} progress`}
            value={indeterminate ? 0 : pct}
            isIndeterminate={indeterminate}
            isLabelHidden
          />
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
      </VStack>
    </section>
  )
}
