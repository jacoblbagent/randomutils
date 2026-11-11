import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RelatedTools from '../../components/RelatedTools/RelatedTools'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import { IconArrowLeft, IconCheck, IconCopy, IconRefresh } from '../../icons/Icons'
import { writeClipboard } from '../../lib/clipboard'
import { DEFAULT_FORMAT, VERSIONS, generateMany, timestampOf, type Format, type Version } from './uuid'
import './UuidGenerator.css'

/**
 * UUID generator: version 4 and version 7 identifiers, made in this tab.
 *
 * Same shape as the password generator, because it is the same kind of tool: a
 * readout of what the settings produce, then the settings. The maths is in
 * `uuid.ts`; this file is the readout, the controls and the copy buttons.
 *
 * The site's promise is that nothing is uploaded, and this page keeps it in the
 * strongest form available: it has no request it could make.
 */

const COUNTS = [1, 5, 10, 25, 100]

/** The ids a set of settings implies, the page's one generation entry point. */
function roll(version: Version, format: Format, count: number): string[] {
  return generateMany(count, version, format)
}

export default function UuidGenerator() {
  const [version, setVersion] = useState<Version>('v4')
  const [format, setFormat] = useState<Format>(DEFAULT_FORMAT)
  const [count, setCount] = useState(1)
  const [results, setResults] = useState<string[]>(() => roll('v4', DEFAULT_FORMAT, 1))
  const [copied, setCopied] = useState<number | 'all' | null>(null)
  const [note, setNote] = useState('')

  /**
   * Every control funnels through here, so the ids on screen always match the
   * chips beside them and there is no "did I regenerate?" step to forget. Like
   * the password generator, nothing is redrawn in an effect: the value is
   * knowable when the click arrives.
   */
  const apply = useCallback(
    (patch: { version?: Version; format?: Format; count?: number }) => {
      const nextVersion = patch.version ?? version
      const nextFormat = patch.format ?? format
      const nextCount = patch.count ?? count
      setVersion(nextVersion)
      setFormat(nextFormat)
      setCount(nextCount)
      setResults(roll(nextVersion, nextFormat, nextCount))
      setCopied(null)
      setNote('')
    },
    [count, format, version],
  )

  useEffect(() => {
    if (copied === null) return
    const timer = window.setTimeout(() => setCopied(null), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async (text: string, key: number | 'all') => {
    const ok = await writeClipboard(text)
    if (ok) {
      setNote('')
      setCopied(key)
    } else {
      setCopied(null)
      setNote('This browser blocked the clipboard; select the id and copy it by hand.')
    }
  }

  const toggleFormat = (key: keyof Format) => apply({ format: { ...format, [key]: !format[key] } })

  const firstStamp = version === 'v7' && results.length > 0 ? timestampOf(results[0]) : null

  return (
    <div className="ug">
      <header className="ug-head">
        <Link className="ug-head__back" to="/">
          <IconArrowLeft />
          All tools
        </Link>
        <h1>UUID generator</h1>
        <p className="ug-head__sub">
          Version 4 and version 7 UUIDs, drawn from your browser&rsquo;s own cryptographic random
          source. Pick a version and a format, then copy. This page has no request it could send,
          so nothing generated here can leave the machine.
        </p>
      </header>

      <section className="ug-out" aria-label="Generated UUIDs">
        <ul className="ug-out__list">
          {results.map((uuid, index) => (
            <li className="ug-out__row" key={`${index}-${uuid}`}>
              <code className="ug-out__value">{uuid}</code>
              <button
                className="secondary small"
                onClick={() => copy(uuid, index)}
                aria-label={`Copy UUID ${index + 1}`}
              >
                {copied === index ? <IconCheck /> : <IconCopy />}
                {copied === index ? 'Copied' : 'Copy'}
              </button>
            </li>
          ))}
        </ul>

        <div className="ug-meta">
          <span className="chips">
            <span className="chip">{version === 'v4' ? 'Version 4' : 'Version 7'}</span>
            <span className="chip">{format.hyphens ? 36 : 32} characters</span>
            <span className="chip">128 bits</span>
            <span className="chip">
              {version === 'v4' ? '122 random bits' : '48-bit timestamp first'}
            </span>
          </span>
          {firstStamp && (
            <p className="small-note">
              The first id carries {firstStamp.toLocaleString()} (your local time), and every id in
              this batch sorts after the one before it.
            </p>
          )}
          {note && <p className="small-note">{note}</p>}
          <span className="ug-sr" role="status" aria-live="polite">
            {copied === 'all'
              ? 'All UUIDs copied'
              : copied !== null
                ? `UUID ${copied + 1} copied`
                : ''}
          </span>
        </div>
      </section>

      <section className="ug-controls">
        <fieldset className="ug-versions">
          <legend>Version</legend>
          {VERSIONS.map((option) => (
            <label className={`ug-version${version === option.id ? ' on' : ''}`} key={option.id}>
              <input
                type="radio"
                name="ug-version"
                checked={version === option.id}
                onChange={() => apply({ version: option.id })}
              />
              <span className="ug-version__body">
                <span className="ug-version__name">{option.label}</span>
                <span className="small-note">{option.blurb}</span>
              </span>
              <code className="ug-version__shape">
                {option.id === 'v4' ? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' : 'tttttttt-tttt-7xxx-yxxx-xxxxxxxxxxxx'}
              </code>
            </label>
          ))}
        </fieldset>

        <fieldset className="ug-formats">
          <legend>Format</legend>
          <label className={`ug-toggle${format.hyphens ? ' on' : ''}`}>
            <input type="checkbox" checked={format.hyphens} onChange={() => toggleFormat('hyphens')} />
            <span>Hyphens</span>
            <code>{format.hyphens ? '8-4-4-4-12' : '32 hex digits'}</code>
          </label>
          <label className={`ug-toggle${format.braces ? ' on' : ''}`}>
            <input type="checkbox" checked={format.braces} onChange={() => toggleFormat('braces')} />
            <span>Braces</span>
            <code>{format.braces ? `{…}` : 'none'}</code>
          </label>
          <label className={`ug-toggle${format.uppercase ? ' on' : ''}`}>
            <input
              type="checkbox"
              checked={format.uppercase}
              onChange={() => toggleFormat('uppercase')}
            />
            <span>Upper case</span>
            <code>{format.uppercase ? 'A-F' : 'a-f'}</code>
          </label>
        </fieldset>

        <div className="ug-actions">
          <label className="ug-field">
            <span className="ug-field__label">How many</span>
            <select value={count} onChange={(event) => apply({ count: Number(event.target.value) })}>
              {COUNTS.map((value) => (
                <option key={value} value={value}>
                  {value} UUID{value > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" onClick={() => apply({})}>
            <IconRefresh />
            Generate new
          </button>
          {results.length > 1 && (
            <button className="secondary" onClick={() => copy(results.join('\n'), 'all')}>
              {copied === 'all' ? <IconCheck /> : <IconCopy />}
              {copied === 'all' ? 'Copied all' : `Copy all ${results.length}`}
            </button>
          )}
        </div>

        <p className="small-note">
          Nothing is saved: no history of what you generated, no cookie, nothing in local storage.
          The ids are on screen until you close the tab.
        </p>
      </section>

      <ToolGuide heading="About this tool">
        <section className="doc__section">
          <h2>Which version to use</h2>
          <p>
            Version 4 is 122 random bits with nothing else in them, so an id tells nobody when or
            where it was made, and two ids never collide by anything but chance. It is the right
            default for anything a user can see: a reset token, a share link, a record id.
          </p>
          <p>
            Version 7 puts a 48-bit millisecond timestamp first. That is worth having when the ids
            land in a database primary key, because the index is written in roughly insertion
            order instead of scattering each insert across the tree. The cost is that an id reveals
            the millisecond it was created in, which is harmless in most systems and a detail to
            think about in a public one.
          </p>
        </section>

        <section className="doc__section">
          <h2>What makes a v7 sort correctly</h2>
          <ul>
            <li>
              The first 48 bits are the timestamp, big-endian, so a byte-wise comparison of two ids
              compares the times they were made. Because it is a fixed-width prefix, sorting the
              text sorts the time.
            </li>
            <li>
              The next 12 bits are a counter, not random filler. Several ids made inside the same
              millisecond would otherwise have identical prefixes and sort arbitrarily; the counter
              is advanced for each one, so this page&rsquo;s batches come out in the order they were
              generated. When the counter runs out, the timestamp is borrowed forward by one
              millisecond.
            </li>
            <li>
              The remaining 62 bits are random, and the version and variant nibbles are stamped
              over the buffer rather than drawn, so the id is still self-describing.
            </li>
          </ul>
        </section>

        <section className="doc__section">
          <h2>Where the randomness comes from</h2>
          <ul>
            <li>
              <code>crypto.getRandomValues</code>, the same source the browser uses for TLS keys,
              not <code>Math.random</code>, whose output becomes predictable once enough of it has
              been seen.
            </li>
            <li>
              No modulo arithmetic touches the random bytes: the timestamp and the counter are
              written into their own fields and the rest of the buffer is used as drawn, so there is
              no reduction step that could bias a bit.
            </li>
            <li>
              The hyphens, braces and letter case are display-only. They change the string, never
              the 128 bits, and a reader that takes either form gets the same uuid.
            </li>
          </ul>
        </section>

        <section className="doc__section">
          <h2>Privacy, in one line</h2>
          <p>
            This page makes no network request after it loads, so there is nowhere for an id to go.
            The one place it leaves the page is your clipboard when you press Copy. Closing the tab
            erases the list, and the <Link to="/privacy">privacy page</Link> covers the rest of the
            site.
          </p>
        </section>
      </ToolGuide>

      <RelatedTools currentId="uuid-generator" />
    </div>
  )
}
