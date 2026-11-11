import { SITE } from '../../config/site'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'
import { Link } from '@astryxdesign/core/Link'
import { Code } from '@astryxdesign/core/Code'
import Page from '../../components/Page/Page'

/**
 * Privacy policy.
 *
 * Two jobs: state plainly what the tools do with your files (nothing leaves the
 * browser), and disclose the one third party the site actually loads, Google
 * AdSense. Ad review expects a linked privacy page on an ad-serving site, and
 * this is also the page a visitor checks against the "nothing is uploaded"
 * claim in the footer, so the wording here has to stay true to the code.
 *
 * Inline links to Google's own pages are deliberate: a visitor should be able
 * to reach the opt-out and the vendor policy in one hop.
 *
 * (This disclosure is written for this site as built; it is not legal advice.)
 */
export default function Privacy() {
  return (
    <Page gap={5}>
      <VStack gap={5} maxWidth="68ch">
      <VStack gap={1}>
        <Heading level={1}>Privacy policy</Heading>
        <Text as="p" type="supporting">Last updated 21 October 2026</Text>
      </VStack>

      <Text as="p" type="large" color="secondary">
        {SITE.name} is a set of small tools that run inside your browser. The tools are the whole product:
        every file you open in one of them is processed on your own machine by FFmpeg compiled to
        WebAssembly, and every password or UUID is drawn from your browser's own random source.
        Neither is uploaded, transmitted or stored anywhere: there is no account, no server-side
        processing, and no copy of your file leaves your device.
      </Text>

      <VStack gap={2}>
        <Heading level={2}>What stays on your device</Heading>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary">Files you drop into a converter are read locally to convert them. The results are produced in the page and handed straight back to you as downloads.</Text>} />
          <ListItem label={<Text color="secondary">Passwords generated here are made in the page by your browser's cryptographic random source. They are shown to you, and put on your clipboard only if you press Copy. The site keeps no list of them, and they are never written to storage.</Text>} />
          <ListItem label={<Text color="secondary">The queue, the conversion and the results live only in the page's memory. Closing or reloading the tab discards them.</Text>} />
          <ListItem label={<Text color="secondary">A few preferences are saved in your browser's <Code>localStorage</Code> so a reload keeps them: the feature-flag switches (<Code>randomutils.flags</Code>), and each converter's starred files and &ldquo;previously removed&rdquo; list. They stay in your browser, are not sent anywhere, and clearing site data removes them.</Text>} />
          <ListItem label={<Text color="secondary">We have no way to see your files. There is no upload endpoint, no analytics on the files, and no copy of them on any server we control.</Text>} />
        </List>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Advertising</Heading>
        <Text as="p" color="secondary">
          The site is supported by advertising served by Google AdSense, which is the only third party the
          page loads. AdSense is a third-party ad vendor, and it uses cookies:
        </Text>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary">Third-party vendors, including Google, use cookies to serve ads based on your visits to this site and other sites.</Text>} />
          <ListItem label={<Text color="secondary">Google's use of advertising cookies lets it and its partners show you ads based on your visit here and elsewhere on the internet.</Text>} />
          <ListItem label={<Text color="secondary">You can opt out of personalised advertising at{' '} <Link href="https://adssettings.google.com/" target="_blank"> Google Ad Settings </Link> . Google describes what it collects and how it uses it in its{' '} <Link href="https://policies.google.com/technologies/partner-sites" target="_blank"> advertising and partner-sites policy </Link> .</Text>} />
          <ListItem label={<Text color="secondary">Other third-party vendors and ad networks may place or read cookies, or use web beacons, when an ad is served. Where the law requires consent for personalised advertising, that consent is collected by Google's consent tooling before personalised ads are shown; declining still shows ads, just not personalised ones.</Text>} />
        </List>
        <Text as="p" color="secondary">
          The site itself sets no cookie of its own, runs no analytics, and builds no profile of you. The
          publisher id used for ad serving is recorded publicly in{' '}
          <Link href={`${SITE.url}/ads.txt`}>ads.txt</Link>.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Hosting and server logs</Heading>
        <Text as="p" color="secondary">
          The site is a static build hosted on GitHub Pages and served at{' '}
          <Link href={SITE.url}>{SITE.url.replace('https://', '')}</Link>. Serving a page normally means the host
          records the request (IP address, user agent, timestamp) for security and delivery. That logging
          is GitHub's, not ours; see GitHub's{' '}
          <Link
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noreferrer"
          >
            privacy statement
          </Link>
          . We do not collect, store or process that data ourselves, and nothing in a tool session reaches
          the host at all.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Children</Heading>
        <Text as="p" color="secondary">
          The site has no accounts, no uploads and no sign-up, and it is not directed at children. We do not
          knowingly collect personal information from anyone, including children.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Changes to this policy</Heading>
        <Text as="p" color="secondary">
          If what the site loads or stores changes, this page changes with it and the date at the top moves
          forward. The current version is always the one served here.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Contact</Heading>
        <Text as="p" color="secondary">
          Questions about this policy, a correction, or a privacy request (there is no data about you for us
          to hand over, but ask anyway). See the{' '}
          <Link href="/contact">contact page</Link>, or email{' '}
          <Link href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</Link>.
        </Text>
      </VStack>
    </VStack>
    </Page>
  )
}
