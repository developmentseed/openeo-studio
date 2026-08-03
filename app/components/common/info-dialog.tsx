import { Button, Dialog, Flex, Heading } from '@chakra-ui/react';

interface InfoDialogProps extends Dialog.RootProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  okLabel?: string;
  onClose: () => void;
}

export function InfoDialog({
  open,
  title,
  children,
  okLabel = 'OK',
  onClose,
  ...rest
}: InfoDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
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
            <Flex justify='flex-end' mt={4}>
              <Button variant='outline' size='sm' onClick={onClose}>
                {okLabel}
              </Button>
            </Flex>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
