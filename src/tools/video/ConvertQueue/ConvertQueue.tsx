import { useCallback, useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import { Link } from 'react-router-dom'
import { IconArrowLeft } from '../../../icons/Icons'
import InfoTip from '../InfoTip/InfoTip'
import JobRow from '../JobRow/JobRow'
import Toast from '../Toast/Toast'
import type { Job, JobStatus, VideoToolSpec } from '../types'
import { useDismissedNames } from '../useDismissedNames'
import { CancelledError, useFFmpeg } from '../useFFmpeg'
import { useFavorites } from '../useFavorites'
import { baseKey, compareJobs, downloadFilename, isImage, makeJob } from '../utils'
import './ConvertQueue.css'

/**
 * The whole converter page, format-agnostic: drop zone, queue, per-row state, selection,
 * bulk download and the video viewer. Everything specific to a format — which extensions it
 * takes, whether a `.star` sidecar flags a recording, whether copied AAC needs the ADTS fix,
 * the copy that goes under the title — comes from the `spec` the tool passes in.
 */
export default function ConvertQueue({ spec }: { spec: VideoToolSpec }) {
  const { convert, cancel } = useFFmpeg({ adtsAudio: spec.adtsAudio, posters: spec.posters })
  const [jobs, setJobs] = useState<Job[]>([])
  const [mode, setMode] = useState(spec.modes[0].value)
  const [running, setRunning] = useState(false) // queue is processing
  const [activeId, setActiveId] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const [thumbs, setThumbs] = useState<Record<string, string>>({}) // baseKey -> object URL
  const thumbsRef = useRef(thumbs)
  thumbsRef.current = thumbs
  const sidecarKeysRef = useRef<Set<string>>(new Set()) // baseKey -> a sidecar was seen
  const [zipName, setZipName] = useState('') // optional name for the "Download all" .zip
  const [zipping, setZipping] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [selectionAnchorId, setSelectionAnchorId] = useState<number | null>(null)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const viewingRowRef = useRef<HTMLLIElement | null>(null)
  const [lastId, setLastId] = useState<number | null>(null) // row you last interacted with (outlined)

  const { isFavorite, toggleFavorite } = useFavorites(spec.id)
  const { dismissed, addDismissed, clearDismissed } = useDismissedNames(spec.id)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const favCount = jobs.filter((j) => isFavorite(j.file)).length
  const visibleJobs = favoritesOnly ? jobs.filter((j) => isFavorite(j.file)) : jobs

  // Moving through videos in the viewer counts as interacting with that row
  useEffect(() => {
    if (viewingId !== null) setLastId(viewingId)
  }, [viewingId])

  // Turn the filter off by itself once nothing is starred any more
  useEffect(() => {
    if (favoritesOnly && favCount === 0) setFavoritesOnly(false)
  }, [favoritesOnly, favCount])

  // Close the viewer if its video is filtered out, removed, or no longer done
  useEffect(() => {
    if (viewingId !== null && !visibleJobs.some((j) => j.id === viewingId && j.status === 'done')) {
      setViewingId(null)
    }
  }, [viewingId, visibleJobs])

  // Auto-dismiss the toast after 5s; a newer toast (different id) resets the clock,
  // and the timer for a toast the user already closed never fires against a later one.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast((cur) => (cur?.id === toast.id ? null : cur)), 5000)
    return () => clearTimeout(t)
  }, [toast])

  // Warn before reload / close / navigating away while there are files in the list.
  // Browsers show their own "Leave site?" dialog; custom text isn't allowed.
  const hasFiles = jobs.length > 0
  useEffect(() => {
    if (!hasFiles) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // required by older Chrome/Safari
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasFiles])

  // Bring the row (with its now-nested viewer) into view whenever it opens or moves
  useEffect(() => {
    if (viewingId === null) return
    const row = viewingRowRef.current
    if (!row) return
    const top = row.getBoundingClientRect().top + window.scrollY - 12
    const bottom = row.getBoundingClientRect().bottom + window.scrollY + 12
    const fits = bottom - top <= window.innerHeight
    const target = fits && top > window.scrollY && bottom < window.scrollY + window.innerHeight ? null : top
    if (target !== null) window.scrollTo({ top: target, behavior: 'instant' })
  }, [viewingId])

  const inputRef = useRef<HTMLInputElement | null>(null)
  const jobsRef = useRef(jobs)
  jobsRef.current = jobs

  const patch = useCallback((id: number, changes: Partial<Job> | ((job: Job) => Partial<Job>)) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...(typeof changes === 'function' ? changes(j) : changes) } : j)),
    )
  }, [])

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      jobsRef.current.forEach((j) => {
        if (j.result) URL.revokeObjectURL(j.result.url)
        if (j.poster) URL.revokeObjectURL(j.poster)
      })
      Object.values(thumbsRef.current).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const addFiles = (list: FileList | null) => {
    const files = Array.from(list ?? [])
    // Paired images and sidecars are consumed, never queued: they dress up a source file instead.
    const images = spec.pairImages ? files.filter((f) => isImage(f.name)) : []
    const rest = files.filter((f) => !images.includes(f))
    const sidecars = spec.sidecar ? rest.filter((f) => spec.sidecar!.matches(f.name)) : []
    const notSource = rest.filter((f) => !spec.isSource(f.name) && !sidecars.includes(f))
    const sources = rest.filter((f) => spec.isSource(f.name))
    // Files whose name was removed from the list before are skipped silently on re-upload.
    const previouslyRemoved = sources.filter((f) => dismissed.has(f.name))
    const remaining = sources.filter((f) => !dismissed.has(f.name))
    const tooSmall =
      spec.minSizeMB > 0 ? remaining.filter((f) => f.size < spec.minSizeMB * 1000 * 1000) : []
    const good = remaining.filter((f) => !tooSmall.includes(f))

    const message = [
      tooSmall.length > 0 &&
        `${tooSmall.length} file${tooSmall.length > 1 ? 's' : ''} under ${spec.minSizeMB} MB`,
      notSource.length > 0 &&
        `${notSource.length} non-${spec.sourceNoun} file${notSource.length > 1 ? 's' : ''}`,
      previouslyRemoved.length > 0 &&
        `${previouslyRemoved.length} previously removed file${previouslyRemoved.length > 1 ? 's' : ''}`,
    ]
      .filter(Boolean)
      .join(' and ')
      .replace(/^/, 'Skipped ')
    if (tooSmall.length > 0 || notSource.length > 0 || previouslyRemoved.length > 0) {
      setToast({ id: Date.now(), message })
    }

    // A .jpg/.png becomes the thumbnail for the source with the same base name
    // (e.g. hdz_0056.jpg -> hdz_0056.ts), matched whichever side arrives first.
    if (images.length) {
      setThumbs((prev) => {
        const next = { ...prev }
        for (const img of images) {
          const key = baseKey(img.name)
          if (next[key]) URL.revokeObjectURL(next[key])
          next[key] = URL.createObjectURL(img)
        }
        return next
      })
    }
    // Remember sidecar flags, so one added before or after its source still applies — then flag
    // the matching rows and append the new ones. Keep the whole list sorted ascending by name;
    // the queue converts in this order too.
    if (sidecars.length && spec.sidecar) {
      for (const f of sidecars) sidecarKeysRef.current.add(spec.sidecar.key(f.name))
    }
    if (good.length || sidecars.length) {
      const flagged = sidecarKeysRef.current
      setJobs((prev) => {
        const marked = prev.map((j) =>
          j.starred || !flagged.has(baseKey(j.file.name)) ? j : { ...j, starred: true },
        )
        const added = good.map((f) => ({ ...makeJob(f, spec), starred: flagged.has(baseKey(f.name)) }))
        return [...marked, ...added].sort(compareJobs)
      })
    }
  }

  // Queue runner: whenever the queue is running and nothing is active, start the next queued job.
  useEffect(() => {
    if (!running || activeId !== null) return
    const next = jobs.find((j) => j.status === 'queued')
    if (!next) {
      setRunning(false)
      return
    }

    setActiveId(next.id)
    patch(next.id, { status: 'converting', progress: 0, error: '', phase: null })
    const log: string[] = [] // ffmpeg output, only surfaced in the console if this file fails
    const t0 = performance.now()

    convert(next.file, mode, {
      onPhase: (phase) => patch(next.id, { phase }),
      onProgress: (progress) => patch(next.id, { progress }),
      onLog: (line) => {
        log.push(line)
        if (log.length > 500) log.splice(0, 100)
      },
    })
      .then(({ blob, mode: used, poster }) => {
        patch(next.id, {
          status: 'done',
          progress: 1,
          phase: null,
          poster: poster ? URL.createObjectURL(poster) : null,
          result: {
            url: URL.createObjectURL(blob),
            blob,
            size: blob.size,
            name: `${next.stem}.mp4`,
            mode: used,
            seconds: (performance.now() - t0) / 1000,
          },
        })
      })
      .catch((err: unknown) => {
        if (err instanceof CancelledError) {
          patch(next.id, { status: 'queued', progress: 0, phase: null })
        } else {
          console.error(
            `[${spec.id}] ${next.file.name} failed:`,
            err,
            '\n' + log.join('\n'),
          )
          patch(next.id, {
            status: 'error',
            phase: null,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      })
      .finally(() => setActiveId(null))
  }, [running, activeId, jobs, mode, convert, patch, spec])

  const startBatch = () => setRunning(true)

  const stop = () => {
    setRunning(false)
    cancel()
  }

  const remove = (id: number) => {
    if (id === viewingId) setViewingId(null)
    if (id === activeId) return
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setJobs((prev) => {
      const j = prev.find((x) => x.id === id)
      if (j?.result) URL.revokeObjectURL(j.result.url)
      if (j?.poster) URL.revokeObjectURL(j.poster)
      // Remembered so re-uploading this same file later is skipped automatically.
      if (j) addDismissed([j.file.name])
      return prev.filter((x) => x.id !== id)
    })
  }

  const retry = (id: number) => {
    patch(id, { status: 'queued', error: '', progress: 0 })
    if (!running) startBatch()
  }

  const clearFinished = () => {
    setJobs((prev) => {
      const doneIds = new Set(prev.filter((j) => j.status === 'done').map((j) => j.id))
      setSelectedIds((sel) => {
        if (![...doneIds].some((id) => sel.has(id))) return sel
        const next = new Set(sel)
        doneIds.forEach((id) => next.delete(id))
        return next
      })
      return prev.filter((j) => {
        if (j.status !== 'done') return true
        URL.revokeObjectURL(j.result!.url)
        if (j.poster) URL.revokeObjectURL(j.poster)
        return false
      })
    })
  }

  const rename = (id: number, value: string) =>
    patch(id, { customName: value.trim() ? value : null })

  // Plain click (on a checkbox) or cmd/ctrl-click (on a row): toggle just this one, and it
  // becomes the anchor a following shift-click ranges from — same as Finder/Gmail/etc.
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectionAnchorId(id)
  }

  // Shift-click: select the contiguous run of done, visible rows between the anchor and this one
  // (added to whatever's already selected, not replacing it), without moving the anchor.
  const selectRange = (targetId: number) => {
    const ids = visibleJobs.filter((j) => j.status === 'done').map((j) => j.id)
    const anchor =
      selectionAnchorId !== null && ids.includes(selectionAnchorId) ? selectionAnchorId : targetId
    const a = ids.indexOf(anchor)
    const b = ids.indexOf(targetId)
    if (a === -1 || b === -1) return
    const [lo, hi] = a < b ? [a, b] : [b, a]
    const range = ids.slice(lo, hi + 1)
    setSelectedIds((prev) => new Set([...prev, ...range]))
    if (selectionAnchorId === null) setSelectionAnchorId(targetId)
  }

  const toggleSelectAll = () => {
    const doneIds = jobs.filter((j) => j.status === 'done').map((j) => j.id)
    const allSelected = doneIds.length > 0 && doneIds.every((id) => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(doneIds))
    setSelectionAnchorId(null)
  }

  // A real folder, unlike the old approach of putting "/" in a `download` attribute (Chrome just
  // sanitizes that to "_" instead of creating one) — a .zip becomes a real folder once extracted.
  const zipAndDownload = async (list: Job[]) => {
    if (!list.length) return
    setZipping(true)
    try {
      const zip = new JSZip()
      const used = new Map<string, number>() // dedupe filenames that collide after renaming
      for (const j of list) {
        let name = downloadFilename(j)
        const n = (used.get(name) || 0) + 1
        used.set(name, n)
        if (n > 1) name = name.replace(/(\.mp4)?$/, (ext) => ` (${n})${ext}`)
        zip.file(name, j.result!.blob)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const name =
        zipName
          .trim()
          .replace(/[\\/:*?"<>|]+/g, '-')
          .replace(/^\.+/, '')
          .slice(0, 80) || spec.zipDefault
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } finally {
      setZipping(false)
    }
  }

  const downloadAll = () => zipAndDownload(jobsRef.current.filter((x) => x.status === 'done'))
  const downloadSelected = async () => {
    await zipAndDownload(jobsRef.current.filter((x) => x.status === 'done' && selectedIds.has(x.id)))
    setSelectedIds(new Set())
  }

  const counts: Record<JobStatus, number> = { queued: 0, converting: 0, done: 0, error: 0 }
  for (const j of jobs) counts[j.status] += 1

  const total = jobs.length
  const finished = counts.done + counts.error
  const active = jobs.find((j) => j.id === activeId)
  const activePos = active ? jobs.indexOf(active) + 1 : 0
  const overall = total ? (finished + (active ? active.progress : 0)) / total : 0
  const selectedDoneCount = jobs.filter((j) => j.status === 'done' && selectedIds.has(j.id)).length
  const allDoneSelected = counts.done > 0 && selectedDoneCount === counts.done
  const doneJobsForViewer = visibleJobs.filter((j) => j.status === 'done')

  return (
    <div className="tool">
      <header className="tool-head">
        <Link className="tool-head__back" to="/">
          <IconArrowLeft />
          All tools
        </Link>
        <h1>{spec.title}</h1>
        <p className="tool-head__sub">{spec.sub}</p>
      </header>

      <section
        className={`drop ${dragging ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={spec.accept}
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <strong>{spec.dropTitle}</strong>
        {spec.dropNotes.map((note) => (
          <span className="small-note" key={note}>
            {note}
          </span>
        ))}
      </section>

      {dismissed.size > 0 && (
        <div className="dismissed-note muted small-note">
          <span>
            {dismissed.size} previously removed file{dismissed.size > 1 ? 's are' : ' is'} skipped
            automatically on upload.
          </span>
          <button className="link" onClick={clearDismissed}>
            Clear list
          </button>
        </div>
      )}

      {toast && <Toast key={toast.id} message={toast.message} onClose={() => setToast(null)} />}

      <fieldset className="modes" disabled={running}>
        <legend>Conversion method</legend>
        <div className="segmented">
          {spec.modes.map(({ value, label, hint }) => (
            <label key={value} className={mode === value ? 'on' : ''}>
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              <span>{label}</span>
              <InfoTip text={hint} />
            </label>
          ))}
        </div>
      </fieldset>

      {total > 0 && (
        <section className="batch">
          <div className="batch-head">
            <div className="batch-status">
              {running && active ? (
                <>
                  <strong>
                    Converting {activePos} of {total}
                  </strong>
                  <span className="muted ellipsis">{active.file.name}</span>
                </>
              ) : (
                <strong>
                  {total} file{total > 1 ? 's' : ''}
                  <span className="chips">
                    {counts.done > 0 && <span className="chip">{counts.done} done</span>}
                    {counts.error > 0 && <span className="chip">{counts.error} failed</span>}
                    {counts.queued > 0 && <span className="chip">{counts.queued} queued</span>}
                  </span>
                </strong>
              )}
            </div>
            <div className="actions">
              {running ? (
                <button className="secondary" onClick={stop}>
                  Stop
                </button>
              ) : (
                counts.queued > 0 && (
                  <button className="primary" onClick={startBatch}>
                    {counts.done || counts.error
                      ? `Convert ${counts.queued} queued`
                      : `Convert all (${total})`}
                  </button>
                )
              )}
              {counts.done > 1 && (
                <span className="dl-group">
                  <label className="select-all">
                    <input
                      type="checkbox"
                      checked={allDoneSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all converted files"
                    />
                    Select all
                  </label>
                  <input
                    type="text"
                    className="dl-folder"
                    placeholder="Zip name"
                    aria-label="Name for the download zip file"
                    value={zipName}
                    onChange={(e) => setZipName(e.target.value)}
                    maxLength={80}
                    disabled={zipping}
                  />
                  {selectedDoneCount > 0 ? (
                    <button className="secondary" onClick={downloadSelected} disabled={zipping}>
                      {zipping ? 'Zipping…' : `Download selected as .zip (${selectedDoneCount})`}
                    </button>
                  ) : (
                    <button className="secondary" onClick={downloadAll} disabled={zipping}>
                      {zipping ? 'Zipping…' : `Download all as .zip (${counts.done})`}
                    </button>
                  )}
                </span>
              )}
              {favCount > 0 && (
                <button
                  className={`secondary fav-filter ${favoritesOnly ? 'on' : ''}`}
                  aria-pressed={favoritesOnly}
                  onClick={() => setFavoritesOnly((v) => !v)}
                >
                  ★ Favorites ({favCount})
                </button>
              )}
              {counts.done > 0 && !running && (
                <button className="link" onClick={clearFinished}>
                  Clear done
                </button>
              )}
            </div>
          </div>

          {(running || finished > 0) && (
            <div className="bar thin" aria-label="Overall progress">
              <div style={{ transform: `scaleX(${overall})` }} />
            </div>
          )}

          <ul className="jobs">
            {visibleJobs.map((job) => {
              const isViewing = job.id === viewingId
              return (
                <JobRow
                  key={job.id}
                  job={job}
                  index={jobs.indexOf(job) + 1}
                  thumb={thumbs[baseKey(job.file.name)]}
                  favorite={isFavorite(job.file)}
                  onToggleFavorite={() => toggleFavorite(job.file)}
                  isActive={job.id === activeId}
                  isViewing={isViewing}
                  isLast={job.id === lastId}
                  isSelected={selectedIds.has(job.id)}
                  onToggleSelect={() => toggleSelect(job.id)}
                  onRangeSelect={() => selectRange(job.id)}
                  onInteract={() => setLastId(job.id)}
                  onView={() => setViewingId(job.id)}
                  onRemove={() => remove(job.id)}
                  onRetry={() => retry(job.id)}
                  onRename={(value) => rename(job.id, value)}
                  // Only used when isViewing — the viewer renders nested inside this row so it
                  // visually reads as one card instead of two bordered pieces with a gap.
                  viewerJobs={doneJobsForViewer}
                  onChangeViewing={setViewingId}
                  onCloseViewing={() => setViewingId(null)}
                  viewingRowRef={isViewing ? viewingRowRef : undefined}
                />
              )
            })}
          </ul>
        </section>
      )}

      <p className="tool-note muted">{spec.note}</p>
    </div>
  )
}