import { useState } from 'react'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Grid } from '@astryxdesign/core/Grid'
import { VStack } from '@astryxdesign/core/Stack'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Link } from '@astryxdesign/core/Link'
import Page from '../../components/Page/Page'
import ToolCard from '../../components/ToolCard/ToolCard'
import { useFlag } from '../../config/flags'
import { useTools, type Tool } from '../../data/tools'

function matches(tool: Tool, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [tool.name, tool.tagline, tool.description, ...tool.tags]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

export default function Home() {
  const search = useFlag('tool-search')
  const available = useTools()
  const [query, setQuery] = useState('')
  const shown = available.filter((tool) => matches(tool, query))

  return (
    <Page>
      <VStack gap={2}>
        {/* The page's one h1. */}
        <Heading level={1} type="display-2">
          Browser tools that never upload your files
        </Heading>
        <Text type="large" color="secondary">
          Small single-purpose tools that run entirely in your browser. No accounts, no uploads, no
          server holding your files.
        </Text>
      </VStack>

      <VStack gap={3}>
        {search && (
          <TextInput
            type="search"
            label="Filter tools"
            isLabelHidden
            placeholder="Filter tools"
            value={query}
            onChange={setQuery}
            startIcon="search"
            hasClear
            width="100%"
          />
        )}
        {shown.length > 0 ? (
          <Grid columns={{ minWidth: 260, max: 3 }} gap={3}>
            {shown.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </Grid>
        ) : (
          <EmptyState
            title={`Nothing matches “${query.trim()}”`}
            description="Try a format, a file type or a job, such as MP4, audio or UUID."
            headingLevel={2}
          />
        )}
      </VStack>

      <Text color="secondary">
        The video tools run on FFmpeg compiled to WebAssembly, the UUID generator uses
        your browser&rsquo;s own crypto, and the interest calculator is plain arithmetic in
        the page. Nothing you open or enter is uploaded, and nothing survives closing the tab.{' '}
        <Link href="/about">How that works</Link>.
      </Text>
    </Page>
  )
}
