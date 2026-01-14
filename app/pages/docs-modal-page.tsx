import { Dialog, Portal, Button, VStack, CloseButton } from '@chakra-ui/react';

import { MarkdownRenderer } from '$utils/md-renderer';
import content from './docs-page.md?raw';

export function DocsPageModal() {
  return (
    <Dialog.Root size='xl' placement='center' motionPreset='slide-in-bottom'>
      <Dialog.Trigger asChild>
        <Button variant='ghost' size='sm'>
          Documentation
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner py={4}>
          <Dialog.Content layerStyle='handDrawn'>
            <Dialog.Header>
              <Dialog.Title>Documentation</Dialog.Title>
              <Dialog.CloseTrigger asChild unstyled ml='auto'>
                <CloseButton size='sm' />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align='start' gap={4}>
                <MarkdownRenderer>{content}</MarkdownRenderer>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
