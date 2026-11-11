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
 * The recurring questions from support mail, answered in one place instead of
 * being rediscovered in each tool's guide. Every answer here is a statement
 * about how the code actually behaves, the skip rules are in
 * `ConvertQueue.addFiles` and the tool specs, the engine recycling thresholds
 * are `RECYCLE_EVERY_FILES` / `RECYCLE_EVERY_BYTES` in `useFFmpeg.ts`. If one
 * of those numbers moves, this page moves with it.
 */
export default function Faq() {
  return (
    <Page gap={5}>
      <VStack gap={5} maxWidth="68ch">
      <VStack gap={1}>
        <Heading level={1}>Frequently asked questions</Heading>
        <Text as="p" type="supporting">
          The short answers, and where in the site each one comes from.
        </Text>
      </VStack>

      <Text as="p" type="large" color="secondary">
        Everything below is about the tools as they are built, not a policy. Where a number is
        involved it is the number in the code.
      </Text>

      <VStack gap={2}>
        <Heading level={2}>Why was my file skipped?</Heading>
        <Text as="p" color="secondary">A file is not added to the queue for one of three reasons, and the toast says which:</Text>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary"><strong>It is under {MIN_SIZE_MB} MB, on TS → MP4 only.</strong> Sizes that small are almost always a fragment or a failed recording rather than something worth converting. MOV → MP4 has no size floor, because a small QuickTime clip is a normal file.</Text>} />
          <ListItem label={<Text color="secondary"><strong>It is not a file the tool takes.</strong> TS → MP4 accepts <Code>.ts</Code>,{' '} <Code>.mts</Code> and <Code>.m2ts</Code>; MOV → MP4 accepts <Code>.mov</Code> and{' '} <Code>.qt</Code>; Video → Audio takes the common video containers (and audio files, which it simply re-exports). A same-named{' '} <Code>.jpg</Code>/<Code>.png</Code> beside a recording is used as its thumbnail and a{' '} <Code>.star</Code> sidecar becomes a flag on the row; neither is queued as a video.</Text>} />
          <ListItem label={<Text color="secondary"><strong>You removed it earlier.</strong> Removing a file from the list is remembered by name for that tool, so re-adding the same name does nothing. The note above the queue shows how many names are remembered, and its “Clear list” button forgets them.</Text>} />
        </List>
        <Text as="p" color="secondary">
          Nothing is skipped silently: a skipped file produces the toast naming the count and the
          reason.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Why does the engine reload in the middle of a batch?</Heading>
        <Text as="p" color="secondary">
          FFmpeg runs as WebAssembly inside the page, and a wasm instance's memory only ever grows.
          Deleting the input and output from its virtual filesystem frees the files but not the
          ceiling the instance has already reached, so a long batch of large recordings eventually
          hits a memory trap. To avoid that, the engine is deliberately thrown away and reloaded,
          every six files or every ~1 GB of source video, whichever comes first.
        </Text>
        <Text as="p" color="secondary">
          The same recycle happens immediately after you press cancel, and after any fatal wasm
          error, because a trapped instance cannot be trusted with the next file. The reload is
          quick: the core is bundled with the site (not fetched from a CDN) and the browser has
          already cached it, so you see the “loading” phase rather than a download.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Is anything uploaded?</Heading>
        <Text as="p" color="secondary">
          No. There is no upload endpoint to send anything to, and no server holding your files.
          Each file is read by the browser, written into FFmpeg's in-page filesystem, converted
          there, and handed back to you as a download from a blob URL that exists only in this tab.
          Close the tab and the output is gone unless you saved it.
        </Text>
        <Text as="p" color="secondary">
          The one third party the page loads is the Google AdSense script; what it and its cookies
          do is set out on the <Link href="/privacy">privacy page</Link>. Nothing about your files
          ever reaches it: the conversion code has no network call in it at all.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Are big batches safe?</Heading>
        <Text as="p" color="secondary">
          Yes, with one practical limit. Files convert strictly one at a time, in name order, so a
          hundred-file queue is a queue rather than a hundred parallel jobs. The periodic engine
          recycle above is what keeps a long run from degrading.
        </Text>
        <Text as="p" color="secondary">
          The limit is per file: the source and the result both sit in browser memory while a job
          runs, so a single file over roughly 2 GB can fail no matter how much free disk you have.
          Splitting a very large recording is the workaround. Also keep the tab open and awake:
          the queue lives in the page, so a reload or a crash loses it, which is why the browser
          warns you before you leave with files still in the list. Download finished files as you
          go if the batch matters.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Does it work offline, and can I install it?</Heading>
        <Text as="p" color="secondary">
          Every tool is a page with no server round-trip in its conversion path, so once the page
          and its FFmpeg core have loaded it keeps working without a network, on a plane or on a
          locked-down laptop where a conversion site would be blocked. The site also ships a web
          app manifest, so a browser that offers “Install” can put it in its own window like an
          app. Installing changes nothing about the privacy story: it is still this page, running
          on your machine.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>What if the output will not play, or the conversion fails?</Heading>
        <Text as="p" color="secondary">
          A failed row keeps the error and the FFmpeg log, and the file is left in the list so you
          can retry it with a different mode. “Auto” copies streams that are already compatible and
          re-encodes only what has to change; “Stream copy” is the fast, lossless option that fails
          when the codec inside cannot live in an MP4; “Re-encode” always works but is much slower.
          If a file fails in all three, it is usually damaged at the source.
        </Text>
        <Text as="p" color="secondary">
          If something looks wrong that this page does not explain, email{' '}
          <Link href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</Link> with the file's codecs (the
          row's log has them). The <Link href="/contact">contact page</Link> lists what to include.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Where can I read more?</Heading>
        <Text as="p" color="secondary">
          Each tool has a guide below it covering its formats and modes, the{' '}
          <Link href="/about">about page</Link> explains why the site is built this way, and the{' '}
          <Link href="/terms">terms</Link> and <Link href="/privacy">privacy</Link> pages cover the
          rest.
        </Text>
      </VStack>
    </VStack>
    </Page>
  )
}
