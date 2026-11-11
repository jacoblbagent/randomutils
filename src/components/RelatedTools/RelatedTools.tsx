import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { List, ListItem } from '@astryxdesign/core/List'
import { Divider } from '@astryxdesign/core/Divider'
import { useTools } from '../../data/tools'

/**
 * The links from this tool to its siblings, sitting under the guide.
 *
 * Why it exists: without it every tool page is a leaf with exactly one editorial
 * inbound link, the card on the home page, and no contextual link between the
 * tools themselves, so a crawler has nothing to follow sideways and no anchor
 * text telling it what the other pages are about. The block carries the phrase
 * for each sibling ("MOV to MP4 converter") rather than a bare "read more", and
 * the tools come from the registry, so a flagged tool's link disappears with its
 * route and the section hides itself when nothing is left.
 */
export default function RelatedTools({ currentId }: { currentId: string }) {
  const others = useTools().filter((tool) => tool.id !== currentId)
  if (others.length === 0) return null

  return (
    <VStack gap={3} maxWidth="68ch">
      <Divider />
      <Heading level={2}>
        {others.length === 1 ? 'The other browser tool' : 'Other browser tools'}
      </Heading>
      <List hasDividers>
        {others.map((tool) => (
          <ListItem
            key={tool.id}
            href={tool.path}
            label={tool.seo.anchor}
            description={tool.tagline}
          />
        ))}
      </List>
      <Text type="supporting">
        Same setup on every page: the work happens in this tab, on your own machine, and nothing
        you open or generate is uploaded.
      </Text>
    </VStack>
  )
}
