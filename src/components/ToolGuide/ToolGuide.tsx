import type { ReactNode } from 'react'
import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Divider } from '@astryxdesign/core/Divider'

/**
 * The reference that sits under a tool: what the format actually is, when a
 * stream copy is safe versus when a re-encode is the only way through, and the
 * handful of failures people actually hit.
 *
 * The tool is the product and stays the first thing on the page, this is a
 * sibling below it, not a preamble above it. One 68ch column and the theme's
 * heading and body styles, so a guide reads like the privacy and about pages.
 */
export default function ToolGuide({
  heading,
  children,
}: {
  /** Sentence-case heading for the block, e.g. "About this tool". */
  heading: string
  children: ReactNode
}) {
  return (
    <VStack gap={3} maxWidth="68ch">
      <Divider />
      <Heading level={2}>{heading}</Heading>
      {children}
    </VStack>
  )
}
