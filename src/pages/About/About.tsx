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
 *
 * (Written for this site as built; it is not legal advice.)
 */
export default function About() {
  return (
    <Page gap={5}>
      <VStack gap={5} maxWidth="68ch">
      <VStack gap={1}>
        <Heading level={1}>About {SITE.name}</Heading>
        <Text as="p" type="supporting">
          Run by {SITE.owner}, individually, with no company behind it.
        </Text>
      </VStack>

      <Text as="p" type="large" color="secondary">
        {SITE.name} is a small set of single-purpose tools for everyday chores: converting a DVR
        recording or a QuickTime clip into an MP4 that plays anywhere, pulling the audio track out
        of a video, and generating a password or a UUID that is genuinely random. Each one does
        that one job and nothing else.
      </Text>

      <VStack gap={2}>
        <Heading level={2}>What makes it different</Heading>
        <Text as="p" color="secondary">
          The tools run entirely in your browser: the video converters on FFmpeg compiled to
          WebAssembly, the password and UUID generators on the browser's own cryptographic random
          source. What you drop in, or ask for, is handled on your own machine, and there is no
          upload step because there is no server to upload to. There are no accounts, no sign-up,
          no queue on someone else's disk, and no copy of your file (or of a password or id you
          generated) anywhere you cannot see. Close the tab and it is gone.
        </Text>
        <Text as="p" color="secondary">
          This matters most for the files people convert here. A DVR recording may carry something
          you would rather not hand to a stranger, and a work clip may be confidential before it is
          shared. Sending either one to a conversion website means trusting that site to delete it
          afterwards. Here that question does not come up, because nothing leaves your device.
        </Text>
        <Text as="p" color="secondary">
          The tools also keep working on a plane, on a locked-down work laptop, or anywhere a
          conversion site would be blocked, because once the page has loaded there is no network
          call left to make.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>What the site does not do</Heading>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary">It does not upload, store, log or forward your files. There is no upload endpoint.</Text>} />
          <ListItem label={<Text color="secondary">It does not ask you to create an account, or even to give a name.</Text>} />
          <ListItem label={<Text color="secondary">It does not run analytics on your files, or on you: the only third party the page loads is the ad service.</Text>} />
          <ListItem label={<Text color="secondary">It does not install anything, ask for unusual permissions, or keep a copy after the tab closes.</Text>} />
          <ListItem label={<Text color="secondary">It does not put a watermark on the output or cap how many files you convert.</Text>} />
        </List>
        <Text as="p" color="secondary">
          What the browser does keep, a few preference toggles in local storage, is set out in full
          on the <Link href="/privacy">privacy page</Link>.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Where the tools came from</Heading>
        <Text as="p" color="secondary">
          They started as one-off scripts for a real problem: a pile of DVR recordings that would
          not open in QuickTime, and a batch of clips that needed only their audio. A desktop tool
          meant installing one, and a website meant handing over files that had no business leaving
          the machine. Running FFmpeg inside the page removed both problems, and the result was
          worth keeping and sharing.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>How it is paid for</Heading>
        <Text as="p" color="secondary">
          The site is free and has no paid tier. It is supported by advertising served by Google
          AdSense, which is the only third party the page loads. There are no sponsored
          recommendations, no affiliate links in the tool copy, and no attempt to sell you an
          upgrade. The ad service and the cookies it uses are described on the{' '}
          <Link href="/privacy">privacy page</Link>.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Open source, and how to reach me</Heading>
        <Text as="p" color="secondary">
          The source is public: read it, file an issue, or run your own copy:{' '}
          <Link href={SITE.repo} target="_blank">
            github.com/{SITE.owner}
            <IconExternal />
          </Link>
          . For a broken conversion, a format request, an ad question or a takedown, email{' '}
          <Link href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</Link>, or see the{' '}
          <Link href="/contact">contact page</Link> for exactly what to include. Replies are best
          effort, usually within a few days.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Using the site</Heading>
        <Text as="p" color="secondary">
          The tools are free to use, provided as-is and without warranty, and your files stay
          yours. Those terms, in full, are on the <Link href="/terms">terms of use</Link>.
        </Text>
      </VStack>
    </VStack>
    </Page>
  )
}
