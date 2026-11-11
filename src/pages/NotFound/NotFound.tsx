import { VStack } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import Page from '../../components/Page/Page'

export default function NotFound() {
  return (
    <Page>
      <VStack gap={3} maxWidth="68ch">
        <Heading level={1}>Nothing here</Heading>
        <Text as="p" color="secondary">
          That link doesn’t match a tool. Pick one from the list instead.
        </Text>
        <Button label="Back to all tools" variant="secondary" href="/" width={180} />
      </VStack>
    </Page>
  )
}
