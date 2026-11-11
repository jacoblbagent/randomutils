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
          Strong random passwords, drawn from your browser&rsquo;s own cryptographic random
          source. Choose a length and the characters to allow, then copy. This page has no
          request it could send, so nothing generated here can leave the machine.
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
              {crackTimeNode(bits)}. That is the kindest case for the attacker; a slow hash or a
              login that throttles attempts takes far longer.
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
          description="Pick at least one set of characters below and a password appears here."
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
            description="Leaves out 0, O, o, 1, I and l, the ones people mistype when reading a password off a screen or a sheet of paper."
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
            The digits-only pool is {DIGITS.length} characters and the symbols are the ones that
            survive a signup form, a shell and a config file: no quotes, no backslash, no spaces.
            Nothing is saved: no list of what you generated, no cookie, nothing in local storage.
            The password is on screen until you close the tab.
          </Text>
        </VStack>
      </Card>

      <ToolGuide heading="About this tool">
        <VStack gap={2}>
          <Heading level={2}>Why length matters more than a clever substitution</Heading>
          <Text as="p" color="secondary">
            Every extra character multiplies the work an attacker has to do, while a clever
            substitution (<Code>p@ssw0rd</Code>) does not, because crackers try those swaps
            first. The number to watch is the entropy figure above: bits, not &ldquo;looks
            complicated&rdquo;. Thirty bits falls to a laptop; a hundred and twenty does not fall
            to anything.
          </Text>
          <Text as="p" color="secondary">
            That is why the length slider is the first control. If a site rejects the symbols,
            the answer is not to hunt for a symbol it accepts. Drop symbols, raise the length,
            and come out with more entropy than you started with.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Where the randomness comes from</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">Characters are drawn with your browser&rsquo;s <Code>crypto.getRandomValues</Code>, the same source it uses for TLS keys. It is not{' '} <Code>Math.random</Code>, which is a fast statistical generator whose output becomes predictable once enough of it is seen.</Text>} />
            <ListItem label={<Text color="secondary">Each index is taken by <strong>rejection</strong>, not by modulo: a draw that falls outside the largest whole multiple of the pool size is thrown away and redrawn. The lazy version, <Code>draw % poolSize</Code>, quietly gives the first few characters in the pool an extra chance, and a generator with a bias in it is not one to trust for anything else.</Text>} />
            <ListItem label={<Text color="secondary">Every password in a batch is drawn independently, so ten of them are ten independent passwords and not one password re-shuffled.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>The sets, and the look-alike trap</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>Letters</strong> are plain ASCII, both cases, and <strong>digits</strong>{' '} are all ten. <strong>Symbols</strong> are limited on purpose to the ones that survive being pasted around: no quote marks, no backtick, no backslash, no angle brackets, no pipe, no space. Those are the characters a signup form strips or a configuration file mangles, and a password that has to be re-typed is worse than a slightly shorter one.</Text>} />
            <ListItem label={<Text color="secondary"><strong>Excluding look-alikes</strong> removes 0, O, o, 1, I and l. It costs a little entropy: the pool drops from 86 characters to 80, which is far less than one extra character buys back. Turn it on if you ever read a password off a screen; leave it off if you only ever paste from a password manager.</Text>} />
            <ListItem label={<Text color="secondary">With every set on the pool is 86 characters, about 6.4 bits per character, so a 20-character password is around 128 bits, and 126 with the look-alikes excluded.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>What the crack-time number means, and what it hides</Heading>
          <Text as="p" color="secondary">
            The estimate assumes an attacker who has the password, offline, and can try 100
            billion guesses a second: a fast unsalted hash (MD5, SHA-1) on serious hardware. It is
            an <em>average</em> case (half the space), and it is the kindest thing that could
            happen to a password, so treat it as a floor, not a guarantee. Against a slow,
            salted hash such as bcrypt, or a login that throttles attempts, the same password
            lasts orders of magnitude longer.
          </Text>
          <Text as="p" color="secondary">
            What no crack-time figure covers is <strong>reuse</strong>. The overwhelmingly common
            way a good password gets someone broken into is being used on two sites, one of which
            leaks. A generated password belongs to one account, paired with two-factor
            authentication where the site offers it, and kept in a password manager rather than
            in a note or a browser tab you leave open.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy, in one line</Heading>
          <Text as="p" color="secondary">
            This page makes no network request after it loads, so there is nowhere for a password
            to go. The one place it leaves the page is your clipboard when you press Copy. On the
            way, check whether your clipboard is synced across devices or kept in a history, and
            clear it with <Code>Ctrl</Code>+<Code>Shift</Code>+<Code>Delete</Code> or the OS
            clipboard viewer if that matters. Nothing else is kept: closing the tab erases the
            passwords, and the <Link href="/privacy">privacy page</Link> covers the rest of the site.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="password-generator" />
    </Page>
  )
}
