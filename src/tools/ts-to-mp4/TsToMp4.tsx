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
            A <Code>.ts</Code> file is an MPEG transport stream: the container broadcasters and
            tuners write because it is built to survive a lossy signal. Instead of an index at
            the head of the file, as MP4 has, it is a continuous run of small fixed-size packets,
            which lets a receiver tune in mid-stream and start playing. That design is why a
            recording plays fine in VLC and badly, or not at all, in QuickTime, on most
            phones, and in editors that expect a seekable file. The video inside is fine; the container is the
            problem, and moving it into MP4 is what this tool does.
          </Text>
          <Text as="p" color="secondary">
            You will usually meet one of three things, and they are the same conversion here:
            a capture from a network tuner such as an HDHomeRun, a recording pulled off a cable
            box or DVR, or an over-the-air capture. Files named <Code>.mts</Code> or{' '}
            <Code>.m2ts</Code> are the same family under different initials: AVCHD camcorders
            and Blu-ray use those extensions, and this tool takes all three.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Stream copy or re-encode?</Heading>
          <Text as="p" color="secondary">
            <strong>Auto</strong> is the right answer almost every time: it copies the video and
            audio across untouched where they are already playable in an MP4, and re-encodes only
            the parts that are not. A copy is lossless and limited by your disk rather than your
            processor, so a two-hour recording finishes in seconds.
          </Text>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>Stream copy</strong>: force it when you know the recording is already H.264 or HEVC video with AAC audio and you want the fastest, pixel-identical result. If the video cannot legally sit in an MP4 it will fail outright rather than re-encode silently, which is what choosing it is for.</Text>} />
            <ListItem label={<Text color="secondary"><strong>Re-encode</strong>: H.264 video and AAC audio, playable anywhere, but slow: roughly real time or worse on a laptop, and it discards the original quality in favour of compatibility. Reach for it when Auto produced a file that still will not play, or when you want the safest possible copy of an odd recording.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>The 50 MB floor, and DVR .star files</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">Any <Code>.ts</Code> under {MIN_SIZE_MB} MB is skipped when you add it. Small files are almost always stubs, ad-break fragments or index scraps rather than real recordings, and converting them is noise. If a genuine clip is under the floor, the <Link href="/contact">contact page</Link> explains what to send.</Text>} />
            <ListItem label={<Text color="secondary">A <Code>.star</Code> file sitting next to a recording (<Code>hdz_0000.ts.star</Code>{' '} and the like) is a DVR sidecar naming the programme. Drop it in with the video and it is never converted itself; it just flags the matching row and rides along into the output name.</Text>} />
            <ListItem label={<Text color="secondary">A same-named <Code>.jpg</Code> becomes that row&rsquo;s thumbnail, since DVRs usually ship one beside each recording.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>If something goes wrong</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>The MP4 plays but has no sound.</strong> The audio was probably AC-3, which MP4 players commonly refuse. Re-run that file with <strong>Re-encode</strong>.</Text>} />
            <ListItem label={<Text color="secondary"><strong>The picture shows comb-like lines on movement.</strong> The source is interlaced. <strong>Re-encode</strong> de-interlaces; a stream copy cannot.</Text>} />
            <ListItem label={<Text color="secondary"><strong>&ldquo;Stream copy failed.&rdquo;</strong> Expected: the video inside the stream is not MP4-legal. Auto or Re-encode handles it.</Text>} />
            <ListItem label={<Text color="secondary"><strong>A very large file stops part-way.</strong> The whole input and output sit in the page&rsquo;s memory, so a single recording over roughly 2 GB may run out of room. Split it first, or convert on a machine with more free memory.</Text>} />
            <ListItem label={<Text color="secondary"><strong>Dropping a file does nothing.</strong> Check the extension is{' '} <Code>.ts</Code>, <Code>.mts</Code> or <Code>.m2ts</Code>, and that the file is over{' '} {MIN_SIZE_MB} MB.</Text>} />
          </List>
          <Text as="p" type="supporting">
            Still stuck? The <Link href="/contact">contact page</Link> lists exactly what to include
            so it can be worked out without sending the file.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy, in one line</Heading>
          <Text as="p" color="secondary">
            The conversion runs in this tab with FFmpeg compiled to WebAssembly, so the recording
            never leaves your machine: there is no upload step, and nothing is kept after you
            close the tab. The <Link href="/privacy">privacy page</Link> is the long version.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="ts-to-mp4" />
    </Page>
  )
}
