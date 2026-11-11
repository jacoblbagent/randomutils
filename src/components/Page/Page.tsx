import type { ReactNode } from 'react'
import { Layout, LayoutContent } from '@astryxdesign/core/Layout'
import { VStack } from '@astryxdesign/core/Stack'

/**
 * The frame every route sits in: one centered 960px column with the theme's
 * page inset, and a single vertical rhythm between the page's blocks.
 *
 * Astryx's Layout owns the centering (contentWidth) and the padding step, so a
 * page never sets its own margins or widths. height="auto" lets the column grow
 * with the document instead of scrolling inside the shell.
 */
export default function Page({
  children,
  gap = 6,
  width = 960,
}: {
  children: ReactNode
  gap?: 2 | 3 | 4 | 5 | 6 | 8
  width?: number
}) {
  return (
    <Layout
      height="auto"
      contentWidth={width}
      padding={4}
      content={
        <LayoutContent>
          <VStack gap={gap}>{children}</VStack>
        </LayoutContent>
      }
    />
  )
}
