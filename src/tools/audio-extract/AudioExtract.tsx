import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import RelatedTools from '../../components/RelatedTools/RelatedTools'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import { IconArrowLeft, IconDownload, IconX } from '../../icons/Icons'
import { VStack, HStack, StackItem } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { IconButton } from '@astryxdesign/core/IconButton'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { FileInput } from '@astryxdesign/core/FileInput'
import { Icon } from '@astryxdesign/core/Icon'
import { List, ListItem } from '@astryxdesign/core/List'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Link } from '@astryxdesign/core/Link'
import Page from '../../components/Page/Page'
import {
  CancelledError,
  FORMATS,
  FORMAT_IDS,
  useAudioFFmpeg,
  type AudioFormat,
} from './useAudioFFmpeg'

/**
 * Video → Audio: drop a video (or audio) file in, pick WAV or MP3, get the audio track back
 * as a download. The whole thing runs on ffmpeg.wasm inside this tab, no upload, no backend,
 * the file never leaves the machine.
 */

// Drag-and-drop ignores the input's `accept`, so the same list is enforced in code. Extensions
// cover the containers browsers don't know (.mkv, .avi, .flv, .ts …); audio inputs are allowed
// too, extracting the audio of an audio file is just a format conversion.
const MEDIA_RE =
  /\.(mp4|m4v|mov|qt|mkv|webm|avi|divx|flv|wmv|mpg|mpeg|m2ts|mts|ts|3gp|3g2|ogv|vob|mxf|mp3|wav|m4a|aac|flac|ogg|oga|opus|wma|aif|aiff|amr)$/i

const isMedia = (file: File) =>
  MEDIA_RE.test(file.name) || file.type.startsWith('video/') || file.type.startsWith('audio/')

const ACCEPT =
  'video/*,audio/*,.mkv,.avi,.divx,.flv,.wmv,.ts,.mts,.m2ts,.mpg,.mpeg,.3gp,.ogv,.m4v,.vob,.mxf'

const stemOf = (name: string) => name.replace(/\.[^.]+$/, '').trim() || 'audio'

/** Filenames are swapped to dashes on download, same convention as the video tools. */
const downloadName = (job: Job, ext: string) =>
  `${stemOf(job.stem).replace(/\s+/g, '-')}.${ext}`

type JobStatus = 'queued' | 'working' | 'done' | 'error'

interface JobResult {
  url: string
  blob: Blob
  size: number
  /** Output extension, the job keeps the format it was run with, even if the radio moves on. */
  ext: string
  name: string
  elapsed: number
}

interface Job {
  id: number
  file: File
  stem: string
  status: JobStatus
  progress: number
  phase: string
  error: string
  result: JobResult | null
}

const formatBytes = (n: number) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1000)), u.length - 1)
  return `${(n / 1000 ** i).toFixed(i ? 1 : 0)} ${u[i]}`
}

// Decimal MB, matching the video tools and Finder.
const mb = (n: number) => `${(n / 1_000_000).toFixed(1)} MB`

const PHASE_ORDER = ['Loading FFmpeg…', 'Reading file…', 'Extracting audio…']

export default function AudioExtract() {
  const { convert, maybeRecycle, cancel, engine } = useAudioFFmpeg()
  const [jobs, setJobs] = useState<Job[]>([])
  const [format, setFormat] = useState<AudioFormat>('wav')
  const [running, setRunning] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [skipped, setSkipped] = useState('')
  const [zipping, setZipping] = useState(false)
  const nextId = useRef(1)
  const jobsRef = useRef(jobs)
  jobsRef.current = jobs

  const patch = useCallback((id: number, changes: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...changes } : j)))
  }, [])

  // Warn before reload / close / navigating away while there are files in the list.
  useEffect(() => {
    if (!jobs.length) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [jobs.length])

  // Revoke every object URL on unmount.
  useEffect(
    () => () => {
      jobsRef.current.forEach((j) => j.result && URL.revokeObjectURL(j.result.url))
    },
    [],
  )

  const addFiles = (list: FileList | File[] | null) => {
    const files = Array.from(list ?? [])
    const good = files.filter(isMedia)
    const bad = files.filter((f) => !isMedia(f))
    setSkipped(
      bad.length
        ? `Skipped ${bad.length} file${bad.length > 1 ? 's' : ''} that ${bad.length > 1 ? "aren't" : "isn't"} a video or audio file: ${bad
            .map((f) => f.name)
            .slice(0, 3)
            .join(', ')}${bad.length > 3 ? '…' : ''}`
        : '',
    )
    if (!good.length) return
    const known = new Set(jobsRef.current.map((j) => `${j.file.name}:${j.file.size}`))
    const fresh = good.filter((f) => !known.has(`${f.name}:${f.size}`))
    const dupes = good.length - fresh.length
    if (dupes) {
      setSkipped(
        (prev) => `${prev ? `${prev} ` : ''}${dupes} file${dupes > 1 ? 's were' : ' was'} already in the list.`,
      )
    }
    if (!fresh.length) return
    const added: Job[] = fresh.map((file) => ({
      id: nextId.current++,
      file,
      stem: stemOf(file.name),
      status: 'queued',
      progress: 0,
      phase: '',
      error: '',
      result: null,
    }))
    setJobs((prev) => [...prev, ...added])
  }

  // Queue runner: one job at a time, ffmpeg.wasm can't take two.
  useEffect(() => {
    if (!running || activeId !== null) return
    const next = jobs.find((j) => j.status === 'queued')
    if (!next) {
      setRunning(false)
      return
    }

    setActiveId(next.id)
    patch(next.id, { status: 'working', progress: 0, error: '', phase: PHASE_ORDER[0] })
    const log: string[] = []

    convert(next.file, format, {
      onPhase: (phase) => patch(next.id, { phase }),
      onProgress: (progress) => patch(next.id, { progress }),
      onLog: (line) => {
        log.push(line)
        if (log.length > 500) log.splice(0, 100)
      },
    })
      .then(({ blob, elapsed }) => {
        patch(next.id, {
          status: 'done',
          progress: 1,
          phase: '',
          result: {
            url: URL.createObjectURL(blob),
            blob,
            size: blob.size,
            ext: FORMATS[format].ext,
            name: downloadName(next, FORMATS[format].ext),
            elapsed,
          },
        })
        maybeRecycle(next.file)
      })
      .catch((err: unknown) => {
        if (err instanceof CancelledError) {
          patch(next.id, { status: 'queued', progress: 0, phase: '' })
        } else {
          console.error(`[audio-extract] ${next.file.name} failed:`, err, '\n' + log.join('\n'))
          patch(next.id, {
            status: 'error',
            phase: '',
            error: err instanceof Error ? err.message : String(err),
          })
        }
      })
      .finally(() => setActiveId(null))
  }, [running, activeId, jobs, format, convert, maybeRecycle, patch])

  const startBatch = () => setRunning(true)

  const stop = () => {
    setRunning(false)
    cancel()
  }

  const remove = (id: number) => {
    if (id === activeId) return
    setJobs((prev) => {
      const job = prev.find((j) => j.id === id)
      if (job?.result) URL.revokeObjectURL(job.result.url)
      return prev.filter((j) => j.id !== id)
    })
  }

  const retry = (id: number) => {
    patch(id, { status: 'queued', error: '', progress: 0 })
    if (!running) startBatch()
  }

  const clearFinished = () => {
    setJobs((prev) => {
      prev.filter((j) => j.status === 'done').forEach((j) => j.result && URL.revokeObjectURL(j.result.url))
      return prev.filter((j) => j.status !== 'done')
    })
  }

  const zipAndDownload = async (list: Job[]) => {
    if (!list.length) return
    setZipping(true)
    try {
      const zip = new JSZip()
      const used = new Map<string, number>()
      for (const job of list) {
        let name = job.result!.name
        const n = (used.get(name) ?? 0) + 1
        used.set(name, n)
        if (n > 1) name = name.replace(/(\.[a-z0-9]+)?$/i, (ext) => ` (${n})${ext}`)
        zip.file(name, job.result!.blob)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'extracted-audio.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } finally {
      setZipping(false)
    }
  }

  // Button has no download attribute, so a throwaway anchor carries the filename.
  const downloadFile = (job: Job) => {
    if (!job.result) return
    const a = document.createElement('a')
    a.href = job.result.url
    a.download = job.result.name
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const counts = useMemo(() => {
    const c: Record<JobStatus, number> = { queued: 0, working: 0, done: 0, error: 0 }
    for (const j of jobs) c[j.status] += 1
    return c
  }, [jobs])

  const total = jobs.length
  const finished = counts.done + counts.error
  const active = jobs.find((j) => j.id === activeId) ?? null
  const overall = total ? (finished + (active ? active.progress : 0)) / total : 0
  const ext = FORMATS[format].ext

  return (
    <Page>
      <VStack gap={2}>
        <Button
          label="All tools"
          variant="ghost"
          size="sm"
          icon={<Icon icon={IconArrowLeft} size="sm" />}
          href="/"
        />
        <Heading level={1}>Video → Audio</Heading>
        <Text type="large" color="secondary">
          Extract audio from a video as WAV or MP3. Everything runs in this tab on FFmpeg
          (WebAssembly): no upload, no server, and your file never leaves the machine.
        </Text>
      </VStack>

      <FileInput
        label="Drop video files here"
        mode="dropzone"
        isMultiple
        accept={ACCEPT}
        value={null}
        onChange={(files) => addFiles((files as File[] | null) ?? null)}
        description="Or click to browse, and you can add more while a batch runs. MP4, MOV, MKV, WebM, AVI, FLV, TS and more; audio files work too."
      />

      {skipped && (
        <Banner
          status="warning"
          title={skipped}
          isDismissable
          onDismiss={() => setSkipped('')}
          collapsible={false}
        />
      )}

      <VStack gap={1}>
        <SegmentedControl
          label="Output format"
          value={format}
          onChange={(value) => setFormat(value as typeof format)}
          isDisabled={running}
        >
          {FORMAT_IDS.map((id) => (
            <SegmentedControlItem key={id} value={id} label={FORMATS[id].label} />
          ))}
        </SegmentedControl>
        <Text type="supporting">{FORMATS[format].hint}</Text>
      </VStack>

      {total > 0 && (
        <VStack gap={3}>
          <HStack gap={2} wrap="wrap" vAlign="center">
            <StackItem size="fill">
              {running && active ? (
                <VStack gap={0.5}>
                  <Text type="label">
                    Extracting {jobs.indexOf(active) + 1} of {total}
                  </Text>
                  <Text type="supporting" maxLines={1}>
                    {active.file.name}
                  </Text>
                </VStack>
              ) : (
                <HStack gap={2} wrap="wrap" vAlign="center">
                  <Text type="label">
                    {total} file{total > 1 ? 's' : ''}
                  </Text>
                  {counts.done > 0 && <Badge variant="success" label={`${counts.done} done`} />}
                  {counts.error > 0 && <Badge variant="error" label={`${counts.error} failed`} />}
                  {counts.queued > 0 && <Badge label={`${counts.queued} queued`} />}
                  {!running && engine === 'loading' && <Text type="supporting">Loading FFmpeg…</Text>}
                </HStack>
              )}
            </StackItem>
            <HStack gap={2} wrap="wrap">
              {running ? (
                <Button label="Stop" size="sm" onClick={stop} />
              ) : (
                counts.queued > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={startBatch}
                    label={
                      counts.queued === 1
                        ? `Extract as ${ext.toUpperCase()}`
                        : `Extract ${counts.queued} files`
                    }
                  />
                )
              )}
              {counts.done > 1 && (
                <Button
                  size="sm"
                  isDisabled={zipping}
                  onClick={() => zipAndDownload(jobs.filter((j) => j.status === 'done'))}
                  label={zipping ? 'Zipping…' : `Download all as .zip (${counts.done})`}
                />
              )}
              {counts.done > 0 && !running && (
                <Button label="Clear done" size="sm" variant="ghost" onClick={clearFinished} />
              )}
            </HStack>
          </HStack>

          {(running || finished > 0) && (
            <ProgressBar label="Overall progress" value={Math.round(overall * 100)} isLabelHidden />
          )}

          <VStack gap={2}>
            {jobs.map((job) => {
              const index = PHASE_ORDER.indexOf(job.phase)
              return (
                <VStack
                  key={job.id}
                  gap={2}
                  padding={3}
                  className={`ax-job ${job.status}${job.id === activeId ? ' active' : ''}`}
                >
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <StackItem size="fill">
                      <VStack gap={0.5}>
                        <Text maxLines={1}>
                          {job.stem}
                          <span className="ax-ext">.{job.result?.ext ?? ext}</span>
                        </Text>
                        <Text type="supporting">
                          {job.status === 'done' && job.result ? (
                            <>
                              {mb(job.file.size)} → {formatBytes(job.result.size)} · done in{' '}
                              {job.result.elapsed < 0.1 ? '<0.1' : job.result.elapsed.toFixed(1)}s
                            </>
                          ) : job.status === 'error' ? (
                            job.error
                          ) : job.status === 'working' ? (
                            <>
                              {job.phase}
                              {index > 0 ? ` · step ${index + 1} of ${PHASE_ORDER.length}` : ''}
                            </>
                          ) : (
                            <>{mb(job.file.size)} · queued</>
                          )}
                        </Text>
                      </VStack>
                    </StackItem>
                    <HStack gap={1} vAlign="center">
                      {job.status === 'done' && job.result && (
                        <Button
                          size="sm"
                          label={job.result.ext.toUpperCase()}
                          icon={<Icon icon={IconDownload} size="sm" />}
                          onClick={() => downloadFile(job)}
                        />
                      )}
                      {job.status === 'error' && (
                        <Button size="sm" label="Retry" onClick={() => retry(job.id)} />
                      )}
                      <IconButton
                        label={`Remove ${job.file.name}`}
                        tooltip="Remove from list"
                        icon={<Icon icon={IconX} size="sm" />}
                        variant="ghost"
                        size="sm"
                        isDisabled={job.id === activeId}
                        onClick={() => remove(job.id)}
                      />
                    </HStack>
                  </HStack>
                  {(job.status === 'working' || (job.status === 'done' && job.progress < 1)) && (
                    <ProgressBar
                      label={`Progress for ${job.file.name}`}
                      value={Math.round(job.progress * 100)}
                      isLabelHidden
                    />
                  )}
                </VStack>
              )
            })}
          </VStack>
        </VStack>
      )}

      <Text type="supporting">
        Files are processed one at a time in browser memory, so a video over ~2 GB may fail. The
        first file loads the ~31 MB FFmpeg core, cached afterwards. Audio comes from the first track
        and is re-encoded: WAV keeps the source sample rate, MP3 is 192 kbps.
      </Text>

      <ToolGuide heading="About this tool">
        <VStack gap={2}>
          <Heading level={2}>WAV or MP3?</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>WAV</strong>: uncompressed 16-bit PCM at the source&rsquo;s own sample rate. Lossless and accepted by every editor, at roughly 10 MB per minute stereo. Choose it when you will edit, transcribe or re-encode the audio later.</Text>} />
            <ListItem label={<Text color="secondary"><strong>MP3</strong>: 192 kbps, transparent enough for speech and fine for most music, about a tenth the WAV&rsquo;s size and plays on anything. Choose it when the audio is the finished product: a podcast, a voice memo, a soundtrack for a phone.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Where the audio comes from</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">Audio comes from the <strong>first audio track</strong> and is re-encoded to the format you pick. For a normal video with one track, that is the audio.</Text>} />
            <ListItem label={<Text color="secondary">A video with several tracks, such as multiple language dubs, yields the first. For another track, note it on the{' '} <Link href="/contact">contact page</Link>.</Text>} />
            <ListItem label={<Text color="secondary">A video with <strong>no</strong> audio track fails rather than producing a silent file.</Text>} />
            <ListItem label={<Text color="secondary">Audio files work as input too: WAV→MP3 or MP3→WAV is a format conversion.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Formats it accepts</Heading>
          <Text as="p" color="secondary">
            Video: MP4, MOV, MKV, WebM, AVI, FLV, WMV, MPEG, TS, M2TS, 3GP, OGV, VOB, MXF and
            more. Audio: MP3, WAV, M4A, AAC, FLAC, OGG, Opus, WMA, AIFF and more. Anything else is
            skipped and named above the queue.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>If something goes wrong</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>The job fails at &ldquo;Extracting audio&rdquo;.</strong> Usually no audio track, or a codec the bundled FFmpeg cannot decode. Try another file to confirm the tool itself is fine.</Text>} />
            <ListItem label={<Text color="secondary"><strong>The WAV is enormous.</strong> It is uncompressed. Extract to MP3 if size matters more than fidelity.</Text>} />
            <ListItem label={<Text color="secondary"><strong>A rental or store-bought download fails.</strong> DRM files are unreadable by ordinary tools, and are not yours to convert.</Text>} />
            <ListItem label={<Text color="secondary"><strong>A very long video stops part-way.</strong> The file and its output live in page memory, so a video over roughly 2 GB may run out of room.</Text>} />
          </List>
          <Text as="p" type="supporting">
            Still stuck? The <Link href="/contact">contact page</Link> lists exactly what to include.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy</Heading>
          <Text as="p" color="secondary">
            The extraction runs in this tab on FFmpeg compiled to WebAssembly, so the file never
            leaves your machine and nothing is kept after the tab closes. The{' '}
            <Link href="/privacy">privacy page</Link> is the long version.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="audio-extract" />
    </Page>
  )
}
