import { SITE } from '../../config/site'
import { IconExternal } from '../../icons/Icons'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'
import { Link } from '@astryxdesign/core/Link'
import Page from '../../components/Page/Page'

/**
 * About.
 *
 * The page Google's reviewers and a cautious first-time visitor both look for:
 * what this site is, why the tools run the way they do, what it deliberately
 * does not do, and who is behind it. Everything here is a statement about how
 * the site is actually built (see src/tools/video/useFFmpeg.ts for the claim
 * that nothing is uploaded), so the wording has to stay true to the code.
 */
export default function About() {
  return (
    <Page gap={5}>
      <VStack gap={5} maxWidth="68ch">
      <VStack gap={1}>
        <Heading level={1}>About {SITE.name}</Heading>
        <Text as="p" type="supporting">
          Run by {SITE.owner}, with no company behind it.
        </Text>
      </VStack>

      <Text as="p" type="large" color="secondary">
        {SITE.name} is a small set of single-purpose tools: convert a DVR recording or a QuickTime
        clip to MP4, extract a video&rsquo;s audio, generate a UUID, or work out compound interest.
        Each does one job.
      </Text>

      <VStack gap={2}>
        <Heading level={2}>Everything runs in your browser</Heading>
        <Text as="p" color="secondary">
          The video converters run on FFmpeg compiled to WebAssembly, the UUID generator uses
          the browser&rsquo;s cryptographic random source, and the calculator is arithmetic in
          the page. Files are read and written
          on your own machine, with no upload step and no server to upload to. There are no
          accounts, no queue on someone else&rsquo;s disk, and no copy of your file anywhere you
          cannot see. Close the tab and it is gone.
        </Text>
        <Text as="p" color="secondary">
          That matters for the files people bring here: a DVR recording or a work clip you would
          rather not hand to a stranger. A conversion site means trusting it to delete the file
          afterwards. Here nothing leaves your device, and the tools keep working offline, on a
          plane or on a locked-down laptop, once the page has loaded.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>What the site does not do</Heading>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary">Upload, store, log or forward your files. There is no upload endpoint.</Text>} />
          <ListItem label={<Text color="secondary">Ask for an account, or even a name.</Text>} />
          <ListItem label={<Text color="secondary">Run analytics on your files, or on you. The only third party is the ad service.</Text>} />
          <ListItem label={<Text color="secondary">Install anything, request unusual permissions, or keep a copy after the tab closes.</Text>} />
          <ListItem label={<Text color="secondary">Watermark the output or cap how many files you convert.</Text>} />
        </List>
        <Text as="p" color="secondary">
          The few preferences the browser keeps are listed on the{' '}
          <Link href="/privacy">privacy page</Link>.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>How it is paid for</Heading>
        <Text as="p" color="secondary">
          Free, with no paid tier. Ads served by Google AdSense pay for it, and that is the only
          third party the page loads. No sponsored recommendations, no affiliate links, no upsell.
          The <Link href="/privacy">privacy page</Link> covers the ad cookies.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Source and contact</Heading>
        <Text as="p" color="secondary">
          The source is public: read it, file an issue, or run your own copy:{' '}
          <Link href={SITE.repo} target="_blank">
            github.com/{SITE.owner}
            <IconExternal />
          </Link>
          . For a broken conversion, a format request, an ad question or a takedown, email{' '}
          <Link href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</Link>, or see the{' '}
          <Link href="/contact">contact page</Link> for what to include. Replies are best effort,
          usually within a few days.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Using the site</Heading>
        <Text as="p" color="secondary">
          Free to use, provided as-is and without warranty, and your files stay yours. The full
          terms are on the <Link href="/terms">terms of use</Link>.
        </Text>
      </VStack>
    </VStack>
    </Page>
  )
}
