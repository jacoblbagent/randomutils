import { useCallback, useEffect, useState } from 'react'
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
import { Icon } from '@astryxdesign/core/Icon'
import { List, ListItem } from '@astryxdesign/core/List'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Selector } from '@astryxdesign/core/Selector'
import { Switch } from '@astryxdesign/core/Switch'
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden'
import { Link } from '@astryxdesign/core/Link'
import Page from '../../components/Page/Page'
import { writeClipboard } from '../../lib/clipboard'
import { DEFAULT_FORMAT, VERSIONS, generateMany, timestampOf, type Format, type Version } from './uuid'

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

  const shape =
    version === 'v4'
      ? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      : 'tttttttt-tttt-7xxx-yxxx-xxxxxxxxxxxx'
  const selectedVersion = VERSIONS.find((option) => option.id === version)

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
        <Heading level={1}>UUID generator</Heading>
        <Text type="large" color="secondary">
          Version 4 and version 7 UUIDs, drawn from your browser&rsquo;s own cryptographic random
          source. Pick a version and a format, then copy. This page has no request it could send,
          so nothing generated here can leave the machine.
        </Text>
      </VStack>

      <Card padding={4}>
        <VStack gap={3}>
          <VStack gap={2}>
            {results.map((uuid, index) => (
              <HStack gap={2} vAlign="center" key={`${index}-${uuid}`}>
                <StackItem size="fill">
                  <Text type="code" wordBreak="break-all">
                    {uuid}
                  </Text>
                </StackItem>
                <Button
                  size="sm"
                  label={copied === index ? 'Copied' : 'Copy'}
                  icon={<Icon icon={copied === index ? IconCheck : IconCopy} size="sm" />}
                  onClick={() => copy(uuid, index)}
                />
              </HStack>
            ))}
          </VStack>

          <HStack gap={1} wrap="wrap">
            <Badge label={version === 'v4' ? 'Version 4' : 'Version 7'} />
            <Badge label={`${format.hyphens ? 36 : 32} characters`} />
            <Badge label="128 bits" />
            <Badge label={version === 'v4' ? '122 random bits' : '48-bit timestamp first'} />
          </HStack>

          {firstStamp && (
            <Text type="supporting">
              The first id carries {firstStamp.toLocaleString()} (your local time), and every id
              in this batch sorts after the one before it.
            </Text>
          )}
          {note && <Text type="supporting">{note}</Text>}
          <VisuallyHidden>
            <span role="status" aria-live="polite">
              {copied === 'all'
                ? 'All UUIDs copied'
                : copied !== null
                  ? `UUID ${copied + 1} copied`
                  : ''}
            </span>
          </VisuallyHidden>
        </VStack>
      </Card>

      <Card padding={4}>
        <VStack gap={4}>
          <VStack gap={1}>
            <SegmentedControl
              label="Version"
              value={version}
              onChange={(value) => apply({ version: value as Version })}
            >
              {VERSIONS.map((option) => (
                <SegmentedControlItem key={option.id} value={option.id} label={option.label} />
              ))}
            </SegmentedControl>
            <Text type="supporting">{selectedVersion?.blurb}</Text>
            <Code>{shape}</Code>
          </VStack>

          <VStack gap={2}>
            <Text type="label">Format</Text>
            <Switch
              label="Hyphens"
              description={format.hyphens ? '8-4-4-4-12' : '32 hex digits'}
              value={format.hyphens}
              onChange={() => toggleFormat('hyphens')}
            />
            <Switch
              label="Braces"
              description={format.braces ? 'Wrapped in {…}' : 'No surrounding braces'}
              value={format.braces}
              onChange={() => toggleFormat('braces')}
            />
            <Switch
              label="Upper case"
              description={format.uppercase ? 'A-F' : 'a-f'}
              value={format.uppercase}
              onChange={() => toggleFormat('uppercase')}
            />
          </VStack>

          <HStack gap={2} vAlign="end" wrap="wrap">
            <Selector
              label="How many"
              options={COUNTS.map((value) => ({
                value: String(value),
                label: `${value} UUID${value > 1 ? 's' : ''}`,
              }))}
              value={String(count)}
              onChange={(value) => apply({ count: Number(value) })}
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
              />
            )}
          </HStack>

          <Text type="supporting">
            Nothing is saved: no history of what you generated, no cookie, nothing in local
            storage. The ids are on screen until you close the tab.
          </Text>
        </VStack>
      </Card>

      <ToolGuide heading="About this tool">
        <VStack gap={2}>
          <Heading level={2}>Which version to use</Heading>
          <Text as="p" color="secondary">
            Version 4 is 122 random bits with nothing else in them, so an id tells nobody when or
            where it was made, and two ids never collide by anything but chance. It is the right
            default for anything a user can see: a reset token, a share link, a record id.
          </Text>
          <Text as="p" color="secondary">
            Version 7 puts a 48-bit millisecond timestamp first. That is worth having when the ids
            land in a database primary key, because the index is written in roughly insertion
            order instead of scattering each insert across the tree. The cost is that an id reveals
            the millisecond it was created in, which is harmless in most systems and a detail to
            think about in a public one.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>What makes a v7 sort correctly</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">The first 48 bits are the timestamp, big-endian, so a byte-wise comparison of two ids compares the times they were made. Because it is a fixed-width prefix, sorting the text sorts the time.</Text>} />
            <ListItem label={<Text color="secondary">The next 12 bits are a counter, not random filler. Several ids made inside the same millisecond would otherwise have identical prefixes and sort arbitrarily; the counter is advanced for each one, so this page&rsquo;s batches come out in the order they were generated. When the counter runs out, the timestamp is borrowed forward by one millisecond.</Text>} />
            <ListItem label={<Text color="secondary">The remaining 62 bits are random, and the version and variant nibbles are stamped over the buffer rather than drawn, so the id is still self-describing.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Where the randomness comes from</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><Code>crypto.getRandomValues</Code>, the same source the browser uses for TLS keys, not <Code>Math.random</Code>, whose output becomes predictable once enough of it has been seen.</Text>} />
            <ListItem label={<Text color="secondary">No modulo arithmetic touches the random bytes: the timestamp and the counter are written into their own fields and the rest of the buffer is used as drawn, so there is no reduction step that could bias a bit.</Text>} />
            <ListItem label={<Text color="secondary">The hyphens, braces and letter case are display-only. They change the string, never the 128 bits, and a reader that takes either form gets the same uuid.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy, in one line</Heading>
          <Text as="p" color="secondary">
            This page makes no network request after it loads, so there is nowhere for an id to go.
            The one place it leaves the page is your clipboard when you press Copy. Closing the tab
            erases the list, and the <Link href="/privacy">privacy page</Link> covers the rest of the
            site.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="uuid-generator" />
    </Page>
  )
}
