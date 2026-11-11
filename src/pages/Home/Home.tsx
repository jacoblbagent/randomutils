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
        {/* The page's one h1. It states what the site is rather than repeating
            the brand the header already carries, the title says the same thing,
            so the tab, the crawler and the reader agree. */}
        <Heading level={1} type="display-2">
          Browser tools that never upload your files
        </Heading>
        <Text type="large" color="secondary">
          A hub for small, single-purpose tools. Each one runs entirely in your browser, with no
          accounts, no uploads, and no server holding your files.
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
        Every tool here is a page, not a service. The work happens on your own machine: the video
        tools on FFmpeg compiled to WebAssembly, the password and UUID generators on your
        browser&rsquo;s own crypto. Nothing you open or generate is uploaded, and nothing is kept
        when you close the tab. Nothing depends on trusting us to leave a setting alone, because
        there is no upload step to disable. <Link href="/about">How that works</Link>, and what the
        site does and does not do, is on the about page.
      </Text>
    </Page>
  )
}
