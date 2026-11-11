import { Section } from '@astryxdesign/core/Section'
import { Layout, LayoutContent } from '@astryxdesign/core/Layout'
import { VStack, HStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Link } from '@astryxdesign/core/Link'
import { SITE } from '../../config/site'
import { useTools } from '../../data/tools'

/**
 * Footer. It carries the pages a visitor (and an ad reviewer) should be able to
 * reach from anywhere: what the site is, what the ads do to your data, the
 * terms, and a way to contact the owner.
 *
 * The tool links come from the registry, so every page on the site, not just
 * the home grid, links to every shipped tool, with the tool's own phrase as the
 * anchor text. A flagged tool drops out of here with its route.
 */
export default function SiteFooter() {
  const tools = useTools()

  return (
    <Section variant="transparent" padding={0} dividers={['top']}>
      <Layout
        height="auto"
        contentWidth={960}
        padding={4}
        content={
          <LayoutContent>
            <VStack gap={3}>
              {tools.length > 0 && (
                <HStack gap={2} wrap="wrap">
                  {tools.map((tool) => (
                    <Link key={tool.id} href={tool.path}>
                      {tool.seo.anchor}
                    </Link>
                  ))}
                </HStack>
              )}
              <HStack gap={2} wrap="wrap">
                <Link href="/about">About</Link>
                <Link href="/faq">FAQ</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/contact">Contact</Link>
                <Link href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</Link>
              </HStack>
              <Text type="supporting">
                {SITE.name} runs in your browser. No account, no upload, no server holding your files.
              </Text>
            </VStack>
          </LayoutContent>
        }
      />
    </Section>
  )
}
