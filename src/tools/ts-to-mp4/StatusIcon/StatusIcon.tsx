import type { ReactElement } from 'react'
import type { JobStatus } from '../types'
import { IconAlert, IconCheck, IconCircle } from '../../../icons/Icons'
import './StatusIcon.css'

const LABELS: Record<Exclude<JobStatus, 'converting'>, { Icon: () => ReactElement; label: string }> = {
  queued: { Icon: IconCircle, label: 'Queued' },
  done: { Icon: IconCheck, label: 'Done' },
  error: { Icon: IconAlert, label: 'Failed' },
}

export default function StatusIcon({ status }: { status: JobStatus }) {
  if (status === 'converting') return <span className="spinner" role="status" aria-label="Converting" />
  const { Icon, label } = LABELS[status]
  return (
    <span className={`status-icon ${status}`} role="img" aria-label={label}>
      <Icon />
    </span>
  )
}
