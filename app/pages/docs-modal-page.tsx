import { Dialog, Portal, VStack, CloseButton } from '@chakra-ui/react';

import { MarkdownRenderer } from '$utils/md-renderer';
import content from './docs-page.md?raw';

export function DocsPageModal({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog.Root size='xl' placement='center' motionPreset='slide-in-bottom'>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
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
