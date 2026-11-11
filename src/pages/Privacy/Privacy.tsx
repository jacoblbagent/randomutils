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
 * claim in the footer, so the wording has to stay true to the code.
 *
 * Inline links to Google's own pages are deliberate: a visitor should reach the
 * opt-out and the vendor policy in one hop.
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
        {SITE.name} is a set of tools that run inside your browser. Every file you open is
        processed on your own machine by FFmpeg compiled to WebAssembly, and every password or
        UUID is drawn from your browser&rsquo;s own random source. Nothing is uploaded,
        transmitted or stored: no account, no server-side processing, no copy of your file leaving
        your device.
      </Text>

      <VStack gap={2}>
        <Heading level={2}>What stays on your device</Heading>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary">Files you drop into a converter are read locally. Results are produced in the page and handed back as downloads.</Text>} />
          <ListItem label={<Text color="secondary">Passwords are generated in the page by your browser&rsquo;s cryptographic random source, shown to you, and copied only when you press Copy. No list is kept and nothing is written to storage.</Text>} />
          <ListItem label={<Text color="secondary">The queue and the results live in the page&rsquo;s memory. Closing or reloading the tab discards them.</Text>} />
          <ListItem label={<Text color="secondary">A few preferences are saved in <Code>localStorage</Code> so a reload keeps them: the feature-flag switches (<Code>randomutils.flags</Code>), and each converter&rsquo;s starred files and removed list. They stay in your browser, are not sent anywhere, and clearing site data removes them.</Text>} />
          <ListItem label={<Text color="secondary">We cannot see your files: there is no upload endpoint, no analytics on them, and no copy on any server we control.</Text>} />
        </List>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Advertising</Heading>
        <Text as="p" color="secondary">
          The site is funded by ads served by Google AdSense, the only third party the page loads.
          AdSense uses cookies:
        </Text>
        <List listStyle="disc">
          <ListItem label={<Text color="secondary">Third-party vendors, including Google, use cookies to serve ads based on your visits to this and other sites.</Text>} />
          <ListItem label={<Text color="secondary">Google&rsquo;s advertising cookies let it and its partners show you ads based on your visit here and elsewhere.</Text>} />
          <ListItem label={<Text color="secondary">You can opt out of personalised advertising at{' '} <Link href="https://adssettings.google.com/" target="_blank"> Google Ad Settings </Link> . Google describes what it collects in its{' '} <Link href="https://policies.google.com/technologies/partner-sites" target="_blank"> advertising and partner-sites policy </Link> .</Text>} />
          <ListItem label={<Text color="secondary">Other vendors and ad networks may place or read cookies, or use web beacons, when an ad is served. Where the law requires consent, Google&rsquo;s consent tooling collects it before personalised ads are shown; declining still shows ads, just not personalised ones.</Text>} />
        </List>
        <Text as="p" color="secondary">
          The site sets no cookie of its own, runs no analytics and builds no profile. The publisher
          id is public in <Link href={`${SITE.url}/ads.txt`}>ads.txt</Link>.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Hosting and server logs</Heading>
        <Text as="p" color="secondary">
          The site is a static build hosted on GitHub Pages and served at{' '}
          <Link href={SITE.url}>{SITE.url.replace('https://', '')}</Link>. Serving a page normally means the host
          records the request (IP address, user agent, timestamp) for security and delivery. That logging
          is GitHub&rsquo;s, not ours; see GitHub&rsquo;s{' '}
          <Link
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noreferrer"
          >
            privacy statement
          </Link>
          . We do not collect or process that data, and nothing in a tool session reaches the host.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Children</Heading>
        <Text as="p" color="secondary">
          The site has no accounts, uploads or sign-up, and is not directed at children. We do not
          knowingly collect personal information from anyone, including children.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Changes to this policy</Heading>
        <Text as="p" color="secondary">
          If what the site loads or stores changes, this page and the date at the top change with
          it.
        </Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>Contact</Heading>
        <Text as="p" color="secondary">
          Questions about this policy, a correction, or a privacy request (there is no data about you
          for us to hand over, but ask anyway): see the <Link href="/contact">contact page</Link>, or
          email <Link href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</Link>.
        </Text>
      </VStack>
    </VStack>
    </Page>
  )
}
