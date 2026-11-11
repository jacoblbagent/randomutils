import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import RelatedTools from '../../components/RelatedTools/RelatedTools'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import { IconArrowLeft, IconCheck, IconCopy, IconRefresh } from '../../icons/Icons'
import { VStack, HStack, StackItem } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Card } from '@astryxdesign/core/Card'
import { Code } from '@astryxdesign/core/Code'
import { List, ListItem } from '@astryxdesign/core/List'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Icon } from '@astryxdesign/core/Icon'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { Selector } from '@astryxdesign/core/Selector'
import { Slider } from '@astryxdesign/core/Slider'
import { Switch } from '@astryxdesign/core/Switch'
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden'
import { Link } from '@astryxdesign/core/Link'
import Page from '../../components/Page/Page'
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

/**
 * Password generator: cryptographically random passwords, made in this tab.
 *
 * The page is the passwords, the count of what the settings give you, and the
 * settings. The maths lives in `random.ts`; this file is the readout and the
 * controls. A generated password exists only in this page's state and, when you
 * press Copy, in your clipboard.
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
 * number: 200 bits of entropy is 10^50 years, and `10 ** 500` is `Infinity`, so
 * past a trillion years it is rendered as a power.
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
   * the chips beside it, and nothing is redrawn in an effect for a value that
   * was knowable when the click arrived.
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

  const strengthVariant =
    strength.tone === 'bad' ? 'error' : strength.tone === 'mid' ? 'warning' : 'success'

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
        <Heading level={1}>Password generator</Heading>
        <Text type="large" color="secondary">
          Strong random passwords from your browser&rsquo;s cryptographic random source. Choose a
          length and the characters to allow, then copy. The page makes no network request.
        </Text>
      </VStack>

      {ready ? (
        <Card padding={4}>
          <VStack gap={3}>
            <VStack gap={2}>
              {results.map((password, index) => (
                <HStack gap={2} vAlign="center" key={`${index}-${password}`}>
                  <StackItem size="fill">
                    <Text type="code" wordBreak="break-all">
                      {password}
                    </Text>
                  </StackItem>
                  <Button
                    size="sm"
                    label={copied === index ? 'Copied' : 'Copy'}
                    icon={<Icon icon={copied === index ? IconCheck : IconCopy} size="sm" />}
                    onClick={() => copy(password, index)}
                  />
                </HStack>
              ))}
            </VStack>

            <HStack gap={1} wrap="wrap">
              <Badge label={`${length} characters`} />
              <Badge label={`${poolSize} possible characters`} />
              <Badge label={`${Math.round(bits)} bits of entropy`} />
              <Badge variant={strengthVariant} label={strength.label} />
            </HStack>

            <Text type="supporting">
              An offline attack at {(GUESSES_PER_SECOND / 1e9).toFixed(0)} billion guesses a
              second (a stolen password file and a fast hash) would need about{' '}
              {crackTimeNode(bits)}. That is the attacker&rsquo;s best case; a slow hash or a
              throttled login takes far longer.
            </Text>
            {note && <Text type="supporting">{note}</Text>}
            <VisuallyHidden>
              <span role="status" aria-live="polite">
                {copied === 'all'
                  ? 'All passwords copied'
                  : copied !== null
                    ? `Password ${copied + 1} copied`
                    : ''}
              </span>
            </VisuallyHidden>
          </VStack>
        </Card>
      ) : (
        <EmptyState
          headingLevel={2}
          title="No characters selected"
          description="Pick at least one character set below."
        />
      )}

      <Card padding={4}>
        <VStack gap={4}>
          <HStack gap={3} vAlign="end" wrap="wrap">
            <StackItem size="fill">
              <Slider
                label="Length"
                value={length}
                onChange={changeLength}
                min={LENGTH_MIN}
                max={LENGTH_MAX}
                valueDisplay="text"
              />
            </StackItem>
            <NumberInput
              label="Length in characters"
              isLabelHidden
              value={length}
              onChange={changeLength}
              width={112}
            />
          </HStack>

          <VStack gap={2}>
            <Text type="label">Characters to include</Text>
            {SETS.map((set) => {
              const available = charsOf(set, options.avoidAmbiguous)
              const sample = set.id === 'digits' ? available : `${available.slice(0, 14)}…`
              return (
                <CheckboxInput
                  key={set.id}
                  label={set.label}
                  description={`${sample} · ${available.length} characters`}
                  value={options.sets[set.id]}
                  onChange={() => toggleSet(set.id)}
                />
              )
            })}
          </VStack>

          <Switch
            label="Exclude look-alike characters"
            description="Leaves out 0, O, o, 1, I and l."
            value={options.avoidAmbiguous}
            onChange={(checked) => apply({ avoidAmbiguous: checked })}
          />

          <HStack gap={2} vAlign="end" wrap="wrap">
            <Selector
              label="How many"
              options={COUNTS.map((value) => ({
                value: String(value),
                label: `${value} password${value > 1 ? 's' : ''}`,
              }))}
              value={String(count)}
              onChange={(value) => apply({}, Number(value))}
              width={160}
            />
            <Button
              variant="primary"
              label="Generate new"
              icon={<Icon icon={IconRefresh} size="sm" />}
              onClick={() => apply({})}
            />
            {results.length > 1 && (
              <Button
                label={copied === 'all' ? 'Copied all' : `Copy all ${results.length}`}
                icon={<Icon icon={copied === 'all' ? IconCheck : IconCopy} size="sm" />}
                onClick={() => copy(results.join('\n'), 'all')}
                isDisabled={!ready}
              />
            )}
          </HStack>

          <Text type="supporting">
            The digits pool is {DIGITS.length} characters; the symbols are the ones that survive a
            signup form, a shell and a config file, with no quotes, backslash or spaces. Nothing is
            saved: no history, no cookie, no local storage. The password lasts until you close the
            tab.
          </Text>
        </VStack>
      </Card>

      <ToolGuide heading="About this tool">
        <VStack gap={2}>
          <Heading level={2}>Why length matters</Heading>
          <Text as="p" color="secondary">
            Every extra character multiplies the attacker&rsquo;s work; a clever substitution (
            <Code>p@ssw0rd</Code>) does not, because crackers try those swaps first. Watch the
            entropy figure above: bits, not looks. Thirty bits falls to a laptop; 120 falls to
            nothing.
          </Text>
          <Text as="p" color="secondary">
            That is why length is the first control. If a site rejects symbols, drop symbols and
            raise the length rather than hunting for one it accepts; you come out with more entropy
            than you started with.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Where the randomness comes from</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">Characters are drawn with <Code>crypto.getRandomValues</Code>, the source the browser uses for TLS keys, not <Code>Math.random</Code>, which becomes predictable once enough output is seen.</Text>} />
            <ListItem label={<Text color="secondary">Each index is taken by <strong>rejection</strong>, not modulo: a draw outside the largest whole multiple of the pool size is discarded and redrawn. <Code>draw % poolSize</Code> would quietly favour the first characters in the pool.</Text>} />
            <ListItem label={<Text color="secondary">Every password in a batch is drawn independently, not one password reshuffled.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Character sets</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>Letters</strong> are plain ASCII in both cases and <strong>digits</strong>{' '} are all ten. <strong>Symbols</strong> are limited to the ones that survive being pasted around: no quotes, backtick, backslash, angle brackets, pipe or space, because a signup form strips them and a config file mangles them.</Text>} />
            <ListItem label={<Text color="secondary"><strong>Excluding look-alikes</strong> removes 0, O, o, 1, I and l. It costs little entropy: the pool drops from 86 to 80, less than one extra character buys back. Turn it on if you read passwords off a screen; leave it off if you paste from a manager.</Text>} />
            <ListItem label={<Text color="secondary">With every set on, the pool is 86 characters, about 6.4 bits each, so 20 characters is around 128 bits and 126 without look-alikes.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>What the crack time means</Heading>
          <Text as="p" color="secondary">
            The estimate assumes an attacker with the password, offline, trying 100 billion guesses a
            second: a fast unsalted hash (MD5, SHA-1) on serious hardware. It is an <em>average</em>{' '}
            case, half the space, and the kindest thing that could happen, so treat it as a floor.
            Against a slow salted hash such as bcrypt, or a login that throttles attempts, the same
            password lasts orders of magnitude longer.
          </Text>
          <Text as="p" color="secondary">
            No crack-time figure covers <strong>reuse</strong>. The common way a good password fails
            is being used on two sites, one of which leaks. One password per account, two-factor
            where it is offered, and a password manager rather than a note.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy</Heading>
          <Text as="p" color="secondary">
            The page makes no network request after it loads, so a password has nowhere to go. It
            leaves only through your clipboard when you press Copy; check whether your clipboard
            syncs across devices or keeps a history. Closing the tab erases the passwords, and the{' '}
            <Link href="/privacy">privacy page</Link> covers the rest.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="password-generator" />
    </Page>
  )
}
