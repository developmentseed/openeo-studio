import { Dialog, Flex, Heading } from '@chakra-ui/react';

interface ActionDialogProps extends Dialog.RootProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  onClose: () => void;
  /** Called after the close animation finishes (keep mounted until then). */
  onExitComplete?: () => void;
}

export function ActionDialog({
  open,
  title,
  children,
  actions,
  onClose,
  onExitComplete,
  ...rest
}: ActionDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      onExitComplete={onExitComplete}
      placement='center'
      {...rest}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW='md' p={8}>
          <Dialog.CloseTrigger />
          <Dialog.Header p={0} mb={4}>
            <Heading size='md'>{title}</Heading>
          </Dialog.Header>
          <Dialog.Body p={0}>
            {children}
            <Flex justify='flex-end' mt={4} gap={2}>
              {actions}
            </Flex>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
