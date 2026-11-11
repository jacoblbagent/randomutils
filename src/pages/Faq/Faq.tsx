import { SITE } from '../../config/site'
import { MIN_SIZE_MB } from '../../tools/ts-to-mp4/spec'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'
import { Link } from '@astryxdesign/core/Link'
import { Code } from '@astryxdesign/core/Code'
import Page from '../../components/Page/Page'

/**
 * FAQ.
 *
 * The recurring questions from support mail. Every answer is a statement about
 * how the code actually behaves: the skip rules are in `ConvertQueue.addFiles`
 * and the tool specs, the engine recycling thresholds are `RECYCLE_EVERY_FILES`
 * / `RECYCLE_EVERY_BYTES` in `useFFmpeg.ts`. If one of those numbers moves, this
 * page moves with it.
 */
export default function Faq() {
  return (
    <Page gap={5}>
      <VStack gap={5} maxWidth="68ch">
      <Heading level={1}>Frequently asked questions</Heading>

      <VStack gap={2}>
        <Heading level={2}>Why was my file skipped?</Heading>
        <Text as="p" color="secondary">Three reasons, and the toast says which:</Text>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary"><strong>It is under {MIN_SIZE_MB} MB, on TS → MP4 only.</strong> Files that small are usually a fragment or a failed recording. MOV → MP4 has no size floor.</Text>} />
          <ListItem label={<Text color="secondary"><strong>It is not a file the tool takes.</strong> TS → MP4 accepts <Code>.ts</Code>,{' '} <Code>.mts</Code> and <Code>.m2ts</Code>; MOV → MP4 accepts <Code>.mov</Code> and{' '} <Code>.qt</Code>; Video → Audio takes the common video and audio containers. A same-named{' '} <Code>.jpg</Code>/<Code>.png</Code> becomes the thumbnail and a <Code>.star</Code> sidecar becomes a flag on the row; neither is queued.</Text>} />
          <ListItem label={<Text color="secondary"><strong>You removed it earlier.</strong> Removing a file is remembered by name for that tool, so re-adding the same name does nothing. The note above the queue shows the count, and Clear list forgets them.</Text>} />
        </List>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Why does the engine reload in the middle of a batch?</Heading>
        <Text as="p" color="secondary">
          FFmpeg runs as WebAssembly in the page, and its memory only grows. Deleting files from
          its virtual filesystem frees the files but not the ceiling the instance has reached, so a
          long batch of large recordings hits a memory trap. The engine is therefore thrown away and
          reloaded every six files or every ~1 GB of source, whichever comes first.
        </Text>
        <Text as="p" color="secondary">
          The same recycle happens after you press cancel, and after any fatal wasm error, because a
          trapped instance cannot be trusted with the next file. The core is bundled with the site
          and already cached, so the reload is a short loading phase, not a download.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Is anything uploaded?</Heading>
        <Text as="p" color="secondary">
          No. There is no upload endpoint and no server holding your files. Each file is read by the
          browser, written into FFmpeg&rsquo;s in-page filesystem, converted there, and handed back
          as a download from a blob URL that exists only in this tab. Close the tab and the output
          is gone unless you saved it.
        </Text>
        <Text as="p" color="secondary">
          The one third party is the Google AdSense script; the <Link href="/privacy">privacy page</Link>{' '}
          covers its cookies. Nothing about your files reaches it: the conversion code makes no
          network call.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Are big batches safe?</Heading>
        <Text as="p" color="secondary">
          Yes, with one limit. Files convert one at a time, in name order, so a hundred-file queue
          is a queue rather than a hundred parallel jobs. The limit is per file: the source and the
          result both sit in browser memory, so a single file over roughly 2 GB can fail however
          much free disk you have. Split very large recordings. Keep the tab open and awake too: the
          queue lives in the page, so a reload loses it, and the browser warns before you leave with
          files still in the list. Download finished files as you go.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Does it work offline, and can I install it?</Heading>
        <Text as="p" color="secondary">
          Every tool is a page with no server round-trip, so once the page and its FFmpeg core have
          loaded it works without a network. The site ships a web app manifest, so a browser that
          offers Install can put it in its own window. Installing changes nothing about privacy: it
          is still this page, on your machine.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>What if the output will not play, or the conversion fails?</Heading>
        <Text as="p" color="secondary">
          A failed row keeps the error and the FFmpeg log, and the file stays in the list so you can
          retry with another mode. Auto copies streams that are already compatible and re-encodes
          only what has to change; Stream copy is fast and lossless but fails when the codec cannot
          live in an MP4; Re-encode always works and is much slower. If a file fails in all three,
          it is usually damaged at the source.
        </Text>
        <Text as="p" color="secondary">
          If this page does not explain it, email{' '}
          <Link href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</Link> with the file&rsquo;s
          codecs (the row&rsquo;s log has them). The <Link href="/contact">contact page</Link> lists
          what to include.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Where can I read more?</Heading>
        <Text as="p" color="secondary">
          Each tool has a guide below it. The <Link href="/about">about page</Link> explains why the
          site is built this way, and the <Link href="/terms">terms</Link> and{' '}
          <Link href="/privacy">privacy</Link> pages cover the rest.
        </Text>
      </VStack>
    </VStack>
    </Page>
  )
}
