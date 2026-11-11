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
            A <Code>.mov</Code> file is a QuickTime movie: one of the oldest surviving media
            containers, and still the one Apple&rsquo;s cameras, phones and editors write by
            default. The container is organized much like an MP4, read from its header, which is why a .mov
            seeks and scrubs cleanly, but it is far more permissive about what it will carry. That
            permissiveness is why two files both ending in <Code>.mov</Code> can be as different
            inside as a text file and a photograph.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>What copies and what gets re-encoded</Heading>
          <Text as="p" color="secondary">
            The <strong>Auto</strong> method keeps whatever an MP4 player will accept, and
            re-encodes only the rest:
          </Text>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>Copied untouched</strong>: H.264 and HEVC video, and AAC or MP3 audio. This covers what an iPhone, an iPad or a screen recording produces, which is the overwhelming majority of what people drop in. A copy is lossless and takes seconds.</Text>} />
            <ListItem label={<Text color="secondary"><strong>Re-encoded</strong>: professional and camera codecs MP4 players refuse: ProRes, DV and Motion JPEG video, and PCM, ALAC and similar audio. These are high-quality formats that simply have no place in the MP4 specification, so the video is transcoded to H.264 and the audio to AAC.</Text>} />
          </List>
          <Text as="p" color="secondary">
            If you would rather not transcode anything, force <strong>Stream copy</strong> and let
            a ProRes or PCM file fail rather than be converted. If you want one file that will
            play anywhere without checking first, force <strong>Re-encode</strong>.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Where these .mov files come from</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">iPhone, iPad and Mac screen recordings, which are H.264 or HEVC and copy straight across.</Text>} />
            <ListItem label={<Text color="secondary">Camera and camcorder exports, often ProRes, which are converted.</Text>} />
            <ListItem label={<Text color="secondary">Video-editing exports from Final Cut, Premiere or DaVinci, which can be any of the above depending on how they were set to render.</Text>} />
            <ListItem label={<Text color="secondary">Old QuickTime movies, where the video may be DV or an even earlier codec.</Text>} />
          </List>
          <Text as="p" type="supporting">
            There is no minimum size here, unlike the .ts tool: a .mov is already a finished file,
            and a two-second clip is a normal thing to convert.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>If something goes wrong</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary"><strong>The MP4 has silent, unfollowable sound or no audio at all.</strong> The audio was PCM or ALAC, which MP4 cannot carry. Re-run it with{' '} <strong>Re-encode</strong>.</Text>} />
            <ListItem label={<Text color="secondary"><strong>&ldquo;Stream copy failed.&rdquo;</strong> The file is ProRes, DV or similar, which is expected and exactly what Auto fixes.</Text>} />
            <ListItem label={<Text color="secondary"><strong>The picture is very dark or washed out.</strong> Some camera footage carries a colour profile MP4 players read differently. A <strong>Re-encode</strong> usually normalizes it.</Text>} />
            <ListItem label={<Text color="secondary"><strong>A large file stops part-way.</strong> Input and output both sit in the page&rsquo;s memory; a single movie over roughly 2 GB may exhaust it.</Text>} />
            <ListItem label={<Text color="secondary"><strong>The file is a .mov but nothing happens.</strong> Check it is really a movie and not a mislabelled export; if in doubt, open it once in a player.</Text>} />
          </List>
          <Text as="p" type="supporting">
            Still stuck? The <Link href="/contact">contact page</Link> lists exactly what to include.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy, in one line</Heading>
          <Text as="p" color="secondary">
            QuickTime movies are often the personal ones: family clips, screen recordings with
            something private on screen. That is a good reason this conversion runs in your
            browser and never uploads. The <Link href="/privacy">privacy page</Link> has the
            detail.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="mov-to-mp4" />
    </Page>
  )
}
