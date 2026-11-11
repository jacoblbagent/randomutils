import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import RelatedTools from '../../components/RelatedTools/RelatedTools'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import { IconArrowLeft, IconCheck, IconCopy, IconRefresh } from '../../icons/Icons'
import {
  DIGITS,
  GUESSES_PER_SECOND,
  SETS,
  charsOf,
  entropyBits,
  generateMany,
  log10CrackSeconds,
  poolsFor,
  strengthOf,
  type Options,
  type SetId,
} from './random'
import { writeClipboard } from '../../lib/clipboard'
import './PasswordGenerator.css'

/**
 * Password generator: cryptographically random passwords, made in this tab.
 *
 * The page is deliberately three things and no more, the passwords, the count
 * of what the settings actually give you, and the settings. The maths lives in
 * `random.ts`; this file is the readout and the controls.
 *
 * The promise on the rest of the site is that nothing is uploaded, and this tool
 * keeps it in the strongest form available: there is no request it could make. A
 * generated password exists only in this page's state and, when you press Copy,
 * in your clipboard.
 */

const LENGTH_MIN = 4
const LENGTH_MAX = 128
const COUNTS = [1, 3, 5, 10, 25]

const DEFAULT_SETS: Record<SetId, boolean> = { lower: true, upper: true, digits: true, symbols: true }

const DEFAULT_OPTIONS: Options = { length: 20, sets: DEFAULT_SETS, avoidAmbiguous: true }

/** The passwords a set of options implies, the page's one generation entry point. */
function roll(options: Options, count: number): string[] {
  const pools = poolsFor(options)
  if (pools.length === 0) return []
  return generateMany(count, Math.max(options.length, pools.length), pools)
}

/**
 * A duration from a log10-of-seconds figure, without ever materialising the
 * number: 200 bits of entropy is 10^50 years, and `10 ** 50` is fine but
 * `10 ** 500` is `Infinity`, so past a trillion years it is rendered as a power.
 */
function crackTimeNode(bits: number): ReactNode {
  const log10Seconds = log10CrackSeconds(bits)
  if (log10Seconds < 0) return 'less than a second'

  if (log10Seconds < 15) {
    const seconds = 10 ** log10Seconds
    if (seconds < 60) return `${Math.max(1, Math.round(seconds))} seconds`
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
    if (seconds < 31557600) return `${Math.round(seconds / 86400)} days`
    const years = seconds / 31557600
    if (years < 1e3) return `${Math.round(years)} years`
    if (years < 1e6) return `${Math.round(years / 1e3)},000 years`
    if (years < 1e9) return `${Math.round(years / 1e6)} million years`
    if (years < 1e12) return `${Math.round(years / 1e9)} billion years`
    return `${Math.round(years / 1e12)} trillion years`
  }

  const exponent = Math.floor(log10Seconds - Math.log10(31557600))
  return (
    <>
      10<sup>{exponent}</sup> years
    </>
  )
}

export default function PasswordGenerator() {
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS)
  const [count, setCount] = useState(1)
  const [results, setResults] = useState<string[]>(() => roll(DEFAULT_OPTIONS, 1))
  const [copied, setCopied] = useState<number | 'all' | null>(null)
  const [note, setNote] = useState('')

  const pools = useMemo(() => poolsFor(options), [options])
  const poolSize = pools.reduce((total, pool) => total + pool.length, 0)
  const ready = pools.length > 0
  const length = Math.max(options.length, pools.length)
  const bits = entropyBits(poolSize, length)
  const strength = strengthOf(bits)

  /**
   * Every control goes through here, so the password on screen always matches
   * the chips beside it and there is no "did I regenerate?" step to forget ,
   * and nothing is redrawn in an effect, which would cost a second render pass
   * for a value that was already knowable when the click arrived.
   */
  const apply = useCallback(
    (patch: Partial<Options>, nextCount = count) => {
      const next: Options = { ...options, ...patch }
      setOptions(next)
      setCount(nextCount)
      setResults(roll(next, nextCount))
      setCopied(null)
      setNote('')
    },
    [count, options],
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
      setNote('This browser blocked the clipboard; select the password and copy it by hand.')
    }
  }

  const toggleSet = (id: SetId) =>
    apply({ sets: { ...options.sets, [id]: !options.sets[id] } })

  const changeLength = (value: number) => {
    if (Number.isNaN(value)) return
    apply({ length: Math.min(LENGTH_MAX, Math.max(LENGTH_MIN, Math.round(value))) })
  }

  return (
    <div className="pg">
      <header className="pg-head">
        <Link className="pg-head__back" to="/">
          <IconArrowLeft />
          All tools
        </Link>
        <h1>Password generator</h1>
        <p className="pg-head__sub">
          Strong random passwords, drawn from your browser&rsquo;s own cryptographic random
          source. Choose a length and the characters to allow, then copy. This page has no
          request it could send, so nothing generated here can leave the machine.
        </p>
      </header>

      {ready ? (
        <section className="pg-out" aria-label="Generated passwords">
          <ul className="pg-out__list">
            {results.map((password, index) => (
              <li className="pg-out__row" key={`${index}-${password}`}>
                <code className="pg-out__value">{password}</code>
                <button
                  className="secondary small"
                  onClick={() => copy(password, index)}
                  aria-label={`Copy password ${index + 1}`}
                >
                  {copied === index ? <IconCheck /> : <IconCopy />}
                  {copied === index ? 'Copied' : 'Copy'}
                </button>
              </li>
            ))}
          </ul>

          <div className="pg-meta">
            <span className="chips">
              <span className="chip">
                {Math.max(length, pools.length)} characters
              </span>
              <span className="chip">{poolSize} possible characters</span>
              <span className="chip">{Math.round(bits)} bits of entropy</span>
              <span className={`chip ${strength.tone}`}>{strength.label}</span>
            </span>
            <p className="small-note">
              An offline attack at {(GUESSES_PER_SECOND / 1e9).toFixed(0)} billion guesses a
              second (a stolen password file and a fast hash) would need about{' '}
              {crackTimeNode(bits)}. That is the kindest case for the attacker; a slow hash or a
              login that throttles attempts takes far longer.
            </p>
            {note && <p className="small-note">{note}</p>}
            <span className="pg-sr" role="status" aria-live="polite">
              {copied === 'all'
                ? 'All passwords copied'
                : copied !== null
                  ? `Password ${copied + 1} copied`
                  : ''}
            </span>
          </div>
        </section>
      ) : (
        <p className="pg-empty">
          Pick at least one set of characters below and a password appears here.
        </p>
      )}

      <section className="pg-controls">
        <div className="pg-field">
          <label className="pg-field__label" htmlFor="pg-length">
            Length
          </label>
          <div className="pg-length">
            <input
              id="pg-length"
              type="range"
              min={LENGTH_MIN}
              max={LENGTH_MAX}
              value={length}
              onChange={(event) => changeLength(Number(event.target.value))}
            />
            <input
              type="number"
              min={LENGTH_MIN}
              max={LENGTH_MAX}
              value={length}
              aria-label="Length in characters"
              onChange={(event) => changeLength(Number(event.target.value))}
            />
          </div>
        </div>

        <fieldset className="pg-sets">
          <legend>Characters to include</legend>
          {SETS.map((set) => {
            const available = charsOf(set, options.avoidAmbiguous)
            const sample = set.id === 'digits' ? available : `${available.slice(0, 14)}…`
            return (
              <label className={`pg-set${options.sets[set.id] ? ' on' : ''}`} key={set.id}>
                <input
                  type="checkbox"
                  checked={options.sets[set.id]}
                  onChange={() => toggleSet(set.id)}
                />
                <span className="pg-set__name">{set.label}</span>
                <span className="pg-set__sample">{sample}</span>
                <span className="chip">{available.length}</span>
              </label>
            )
          })}
        </fieldset>

        <label className="pg-toggle">
          <input
            type="checkbox"
            checked={options.avoidAmbiguous}
            onChange={() => apply({ avoidAmbiguous: !options.avoidAmbiguous })}
          />
          <span>
            <strong>Exclude look-alike characters</strong>
            <span className="small-note">
              Leaves out 0, O, o, 1, I and l, the ones people mistype when reading a password
              off a screen or a sheet of paper.
            </span>
          </span>
        </label>

        <div className="pg-actions">
          <label className="pg-field">
            <span className="pg-field__label">How many</span>
            <select value={count} onChange={(event) => apply({}, Number(event.target.value))}>
              {COUNTS.map((value) => (
                <option key={value} value={value}>
                  {value} password{value > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" onClick={() => apply({})}>
            <IconRefresh />
            Generate new
          </button>
          {results.length > 1 && (
            <button
              className="secondary"
              onClick={() => copy(results.join('\n'), 'all')}
              disabled={!ready}
            >
              {copied === 'all' ? <IconCheck /> : <IconCopy />}
              {copied === 'all' ? 'Copied all' : `Copy all ${results.length}`}
            </button>
          )}
        </div>

        <p className="small-note">
          The digits-only pool is {DIGITS.length} characters and the symbols are the ones that
          survive a signup form, a shell and a config file: no quotes, no backslash, no spaces.
          Nothing is saved: no list of what you generated, no cookie, nothing in local storage.
          The password is on screen until you close the tab.
        </p>
      </section>

      <ToolGuide heading="About this tool">
        <section className="doc__section">
          <h2>Why length matters more than a clever substitution</h2>
          <p>
            Every extra character multiplies the work an attacker has to do, while a clever
            substitution (<code>p@ssw0rd</code>) does not, because crackers try those swaps
            first. The number to watch is the entropy figure above: bits, not &ldquo;looks
            complicated&rdquo;. Thirty bits falls to a laptop; a hundred and twenty does not fall
            to anything.
          </p>
          <p>
            That is why the length slider is the first control. If a site rejects the symbols,
            the answer is not to hunt for a symbol it accepts. Drop symbols, raise the length,
            and come out with more entropy than you started with.
          </p>
        </section>

        <section className="doc__section">
          <h2>Where the randomness comes from</h2>
          <ul>
            <li>
              Characters are drawn with your browser&rsquo;s <code>crypto.getRandomValues</code>,
              the same source it uses for TLS keys. It is not{' '}
              <code>Math.random</code>, which is a fast statistical generator whose output
              becomes predictable once enough of it is seen.
            </li>
            <li>
              Each index is taken by <strong>rejection</strong>, not by modulo: a draw that falls
              outside the largest whole multiple of the pool size is thrown away and redrawn. The
              lazy version, <code>draw % poolSize</code>, quietly gives the first few
              characters in the pool an extra chance, and a generator with a bias in it is not one
              to trust for anything else.
            </li>
            <li>
              Every password in a batch is drawn independently, so ten of them are ten
              independent passwords and not one password re-shuffled.
            </li>
          </ul>
        </section>

        <section className="doc__section">
          <h2>The sets, and the look-alike trap</h2>
          <ul>
            <li>
              <strong>Letters</strong> are plain ASCII, both cases, and <strong>digits</strong>{' '}
              are all ten. <strong>Symbols</strong> are limited on purpose to the ones that
              survive being pasted around: no quote marks, no backtick, no backslash, no angle
              brackets, no pipe, no space. Those are the characters a signup form strips or a
              configuration file mangles, and a password that has to be re-typed is worse than a
              slightly shorter one.
            </li>
            <li>
              <strong>Excluding look-alikes</strong> removes 0, O, o, 1, I and l. It costs a
              little entropy: the pool drops from 86 characters to 80, which is far less than
              one extra character buys back. Turn it on if you ever read a password off a screen;
              leave it off if you only ever paste from a password manager.
            </li>
            <li>
              With every set on the pool is 86 characters, about 6.4 bits per character, so a
              20-character password is around 128 bits, and 126 with the look-alikes excluded.
            </li>
          </ul>
        </section>

        <section className="doc__section">
          <h2>What the crack-time number means, and what it hides</h2>
          <p>
            The estimate assumes an attacker who has the password, offline, and can try 100
            billion guesses a second: a fast unsalted hash (MD5, SHA-1) on serious hardware. It is
            an <em>average</em> case (half the space), and it is the kindest thing that could
            happen to a password, so treat it as a floor, not a guarantee. Against a slow,
            salted hash such as bcrypt, or a login that throttles attempts, the same password
            lasts orders of magnitude longer.
          </p>
          <p>
            What no crack-time figure covers is <strong>reuse</strong>. The overwhelmingly common
            way a good password gets someone broken into is being used on two sites, one of which
            leaks. A generated password belongs to one account, paired with two-factor
            authentication where the site offers it, and kept in a password manager rather than
            in a note or a browser tab you leave open.
          </p>
        </section>

        <section className="doc__section">
          <h2>Privacy, in one line</h2>
          <p>
            This page makes no network request after it loads, so there is nowhere for a password
            to go. The one place it leaves the page is your clipboard when you press Copy. On the
            way, check whether your clipboard is synced across devices or kept in a history, and
            clear it with <code>Ctrl</code>+<code>Shift</code>+<code>Delete</code> or the OS
            clipboard viewer if that matters. Nothing else is kept: closing the tab erases the
            passwords, and the{' '}
            <Link to="/privacy">privacy page</Link> covers the rest of the site.
          </p>
        </section>
      </ToolGuide>

      <RelatedTools currentId="password-generator" />
    </div>
  )
}
