import { Box, Heading, VStack } from '@chakra-ui/react';
import { MarkdownRenderer } from '$utils/md-renderer';
import content from './docs-content.md?raw';

export function DocsPage() {
  return (
    <Box flex={1} overflowY='auto' px={8} py={8}>
      <VStack maxWidth='6xl' mx='auto' gap={4} align='stretch'>
        <Heading as='h1' size='2xl'>
          Documentation
        </Heading>
        <MarkdownRenderer>{content}</MarkdownRenderer>
      </VStack>
    </Box>
  );
}
