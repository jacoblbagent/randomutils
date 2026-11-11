import RelatedTools from '../../components/RelatedTools/RelatedTools'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import ConvertQueue from '../video/ConvertQueue/ConvertQueue'
import { MOV_SPEC } from './spec'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'
import { Link } from '@astryxdesign/core/Link'
import { Code } from '@astryxdesign/core/Code'
import Page from '../../components/Page/Page'

/**
 * MOV → MP4. The page is the shared converter queue (src/tools/video/) plus the QuickTime spec:
 * no size floor, no sidecars, a poster frame per row, and audio copied without the ADTS fix.
 * The guide below it covers what varies inside a .mov, which is a great deal, and what that
 * means for a copy versus a re-encode.
 */
export default function MovToMp4() {
  return (
    <Page>
      <ConvertQueue spec={MOV_SPEC} />

      <ToolGuide heading="About this tool">
        <VStack gap={2}>
          <Heading level={2}>What a .mov file is</Heading>
          <Text as="p" color="secondary">
            A <Code>.mov</Code> file is a QuickTime movie: one of the oldest surviving containers,
            and what Apple&rsquo;s cameras, phones and editors write by default. It reads like an
            MP4 and seeks cleanly, but it accepts far more codecs, so two .mov files can differ
            inside as much as a text file and a photograph.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>What copies and what gets re-encoded</Heading>
          <Text as="p" color="secondary">
            <strong>Auto</strong> keeps what an MP4 player accepts and re-encodes the rest:
          </Text>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>Copied untouched</strong>: H.264 and HEVC video, and AAC or MP3 audio. That covers what an iPhone, an iPad or a screen recording produces, most of what people drop in. A copy is lossless and takes seconds.</Text>} />
            <ListItem label={<Text color="secondary"><strong>Re-encoded</strong>: codecs MP4 players refuse, namely ProRes, DV and Motion JPEG video, and PCM, ALAC and similar audio. Video becomes H.264 and audio AAC.</Text>} />
          </List>
          <Text as="p" color="secondary">
            To avoid transcoding, force <strong>Stream copy</strong> and let a ProRes or PCM file
            fail. For one file that plays anywhere without checking first, force{' '}
            <strong>Re-encode</strong>.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Where these .mov files come from</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">iPhone, iPad and Mac screen recordings: H.264 or HEVC, copied straight across.</Text>} />
            <ListItem label={<Text color="secondary">Camera and camcorder exports, often ProRes, converted.</Text>} />
            <ListItem label={<Text color="secondary">Final Cut, Premiere or DaVinci exports, any of the above depending on the render settings.</Text>} />
            <ListItem label={<Text color="secondary">Old QuickTime movies, where the video may be DV or older.</Text>} />
          </List>
          <Text as="p" type="supporting">
            There is no minimum size here, unlike TS → MP4: a .mov is already a finished file, and a
            two-second clip is normal.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>If something goes wrong</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>The MP4 has no audio, or sound that will not play.</strong> The audio was PCM or ALAC, which MP4 cannot carry. Re-run it with{' '} <strong>Re-encode</strong>.</Text>} />
            <ListItem label={<Text color="secondary"><strong>&ldquo;Stream copy failed.&rdquo;</strong> The file is ProRes, DV or similar. Auto fixes it.</Text>} />
            <ListItem label={<Text color="secondary"><strong>The picture is very dark or washed out.</strong> Some camera footage carries a colour profile players read differently. <strong>Re-encode</strong> usually normalises it.</Text>} />
            <ListItem label={<Text color="secondary"><strong>A large file stops part-way.</strong> Input and output sit in page memory; a movie over roughly 2 GB may exhaust it.</Text>} />
            <ListItem label={<Text color="secondary"><strong>The file is a .mov but nothing happens.</strong> Check it is really a movie and not a mislabelled export; open it once in a player.</Text>} />
          </List>
          <Text as="p" type="supporting">
            Still stuck? The <Link href="/contact">contact page</Link> lists what to include.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy</Heading>
          <Text as="p" color="secondary">
            QuickTime movies are often the personal ones. That is why the conversion runs in your
            browser and never uploads. The <Link href="/privacy">privacy page</Link> has the detail.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="mov-to-mp4" />
    </Page>
  )
}
