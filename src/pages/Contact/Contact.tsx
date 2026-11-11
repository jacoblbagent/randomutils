import { SITE } from '../../config/site'
import { IconExternal } from '../../icons/Icons'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'
import { Link } from '@astryxdesign/core/Link'
import Page from '../../components/Page/Page'

/**
 * Contact.
 *
 * One address, reachable without a GitHub account: a broken conversion needs
 * reporting, a format question needs answering, and ad review plus takedown and
 * abuse handling all assume an owner who can be reached. The GitHub repo stays
 * as a second route for people who prefer an issue.
 */
export default function Contact() {
  return (
    <Page gap={5}>
      <VStack gap={5} maxWidth="68ch">
      <VStack gap={1}>
        <Heading level={1}>Contact</Heading>
        <Text as="p" type="supporting">Run by {SITE.owner}, individually, with no company behind it.</Text>
      </VStack>

      <Text as="p" type="large" color="secondary">
        Email{' '}
        <Link href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</Link>{' '}
        for anything about this site. It reaches the person who builds it; no GitHub account, form or
        sign-up is involved.
      </Text>

      <VStack gap={2}>
        <Heading level={2}>Report a conversion that came out wrong</Heading>
        <Text as="p" color="secondary">Include as much of this as you can, and it can usually be worked out without the file:</Text>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary">Which tool: TS → MP4, MOV → MP4 or Video → Audio.</Text>} />
          <ListItem label={<Text color="secondary">The source format and roughly how the file was made (a DVR recording, an iPhone clip, a camera export).</Text>} />
          <ListItem label={<Text color="secondary">Your browser and version, and whether you are on desktop or mobile.</Text>} />
          <ListItem label={<Text color="secondary">What you expected and what you got: a file that will not play, no audio, a stall, an error message.</Text>} />
          <ListItem label={<Text color="secondary">Anything the browser's console reported. Open developer tools (F12) before you start the conversion and copy the error out.</Text>} />
        </List>
        <Text as="p" type="supporting">
          If a file is small and you can share it, say so first, but never send anything private or
          confidential. Files are not needed to answer most questions.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Formats, features and ideas</Heading>
        <Text as="p" color="secondary">
          Wanting another format or a missing option is a good reason to write. A short note on the format
          and what you need it for is enough; format requests are what most of these tools started as.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Advertising, business and takedown</Heading>
        <Text as="p" color="secondary">
          For ad enquiries, licensing, press, copyright or takedown, and anything that needs a name and a
          paper trail, use the same address and put the site name and the subject in the subject line. Do
          the same for anything about the ads being shown here or a page that looks wrong or abusive.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Elsewhere</Heading>
        <Text as="p" color="secondary">
          Source code, and a place to file an issue if you would rather use one:{' '}
          <Link href={SITE.repo} target="_blank">
            github.com/{SITE.owner}
            <IconExternal />
          </Link>
          . What the tools do with your files is set out on the privacy page; the short version is that they
          never leave your browser.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Replies</Heading>
        <Text as="p" color="secondary">
          Best effort, usually within a few days. Bug reports and format questions get answered first.
        </Text>
      </VStack>
    </VStack>
    </Page>
  )
}
