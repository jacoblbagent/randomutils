import { ClickableCard } from '@astryxdesign/core/ClickableCard'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { VStack } from '@astryxdesign/core/Stack'
import type { Tool } from '../../data/tools'

/**
 * One card per tool, the whole card a link to its route.
 *
 * ClickableCard gives the link surface, the focus ring and the hover wash, so
 * the card is one tab stop and the heading alone is not a link inside a link.
 * The tags are plain supporting text: a list of words, not counts, so they do
 * not earn a Badge.
 */
export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <ClickableCard href={tool.path} label={tool.name} elevation="low">
      <VStack gap={2}>
        <VStack gap={1}>
          <Heading level={3}>{tool.name}</Heading>
          <Text type="supporting">{tool.tagline}</Text>
        </VStack>
        <Text>{tool.description}</Text>
        <Text type="supporting">{tool.tags.join(' · ')}</Text>
      </VStack>
    </ClickableCard>
  )
}
