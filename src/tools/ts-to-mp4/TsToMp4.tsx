import RelatedTools from '../../components/RelatedTools/RelatedTools'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import ConvertQueue from '../video/ConvertQueue/ConvertQueue'
import { TS_SPEC, MIN_SIZE_MB } from './spec'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'
import { Link } from '@astryxdesign/core/Link'
import { Code } from '@astryxdesign/core/Code'
import Page from '../../components/Page/Page'

/**
 * TS → MP4. The page is the shared converter queue (src/tools/video/) plus the MPEG-TS spec:
 * a 50 MB floor, DVR `.star` flags and same-named .jpg thumbnails, ADTS-fixed AAC copies.
 * Under the tool sits the guide, what a .ts actually is, when a copy is safe, and the failures
 * people hit, so the page is worth reading before it is worth using.
 */
export default function TsToMp4() {
  return (
    <Page>
      <ConvertQueue spec={TS_SPEC} />

      <ToolGuide heading="About this tool">
        <VStack gap={2}>
          <Heading level={2}>What a .ts file is</Heading>
          <Text as="p" color="secondary">
            A <Code>.ts</Code> file is an MPEG transport stream: the container tuners write because
            it survives a lossy signal. It has no index at the head like MP4, just a continuous run
            of small fixed-size packets, so a receiver can tune in mid-stream. That is why a
            recording plays in VLC and badly, or not at all, in QuickTime, on most phones, and in
            editors that expect a seekable file. The video inside is fine; the container is the
            problem, and this tool moves it into MP4.
          </Text>
          <Text as="p" color="secondary">
            Recordings usually come from a network tuner such as an HDHomeRun, a cable box or DVR,
            or an over-the-air capture. <Code>.mts</Code> and <Code>.m2ts</Code> are the same family
            from AVCHD camcorders and Blu-ray, and this tool takes all three.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Stream copy or re-encode?</Heading>
          <Text as="p" color="secondary">
            <strong>Auto</strong> is right almost every time: it copies video and audio untouched
            where an MP4 can hold them and re-encodes only what it cannot. A copy is lossless and
            limited by disk rather than processor, so a two-hour recording finishes in seconds.
          </Text>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>Stream copy</strong>: force it when the recording is H.264 or HEVC with AAC and you want the fastest, identical result. If the video cannot sit in an MP4 it fails rather than re-encoding silently.</Text>} />
            <ListItem label={<Text color="secondary"><strong>Re-encode</strong>: H.264 + AAC, playable anywhere, but slow, roughly real time on a laptop, and it discards the original quality. Use it when Auto produced a file that still will not play.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>The 50 MB floor, and DVR .star files</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">Any <Code>.ts</Code> under {MIN_SIZE_MB} MB is skipped. Files that small are almost always stubs, ad-break fragments or index scraps. For a genuine smaller clip, see the <Link href="/contact">contact page</Link>.</Text>} />
            <ListItem label={<Text color="secondary">A <Code>.star</Code> file sitting next to a recording (<Code>hdz_0000.ts.star</Code>{' '} and the like) is a DVR sidecar naming the programme. Drop it in with the video and it is never converted itself; it flags the matching row and rides into the output name.</Text>} />
            <ListItem label={<Text color="secondary">A same-named <Code>.jpg</Code> becomes that row&rsquo;s thumbnail.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>If something goes wrong</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>The MP4 plays but has no sound.</strong> The audio was probably AC-3, which MP4 players commonly refuse. Re-run that file with <strong>Re-encode</strong>.</Text>} />
            <ListItem label={<Text color="secondary"><strong>The picture shows comb-like lines on movement.</strong> The source is interlaced. <strong>Re-encode</strong> de-interlaces; a stream copy cannot.</Text>} />
            <ListItem label={<Text color="secondary"><strong>&ldquo;Stream copy failed.&rdquo;</strong> The video inside the stream is not MP4-legal. Auto or Re-encode handles it.</Text>} />
            <ListItem label={<Text color="secondary"><strong>A very large file stops part-way.</strong> Input and output sit in page memory, so a recording over roughly 2 GB may run out of room. Split it first.</Text>} />
            <ListItem label={<Text color="secondary"><strong>Dropping a file does nothing.</strong> Check the extension is{' '} <Code>.ts</Code>, <Code>.mts</Code> or <Code>.m2ts</Code>, and that the file is over{' '} {MIN_SIZE_MB} MB.</Text>} />
          </List>
          <Text as="p" type="supporting">
            Still stuck? The <Link href="/contact">contact page</Link> lists what to include.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy</Heading>
          <Text as="p" color="secondary">
            The conversion runs in this tab on FFmpeg compiled to WebAssembly, so the recording never
            leaves your machine and nothing is kept after the tab closes. The{' '}
            <Link href="/privacy">privacy page</Link> is the long version.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="ts-to-mp4" />
    </Page>
  )
}
