import { Dialog } from '@chakra-ui/react';
import { DataConfigForm } from './data-config-form';

interface DataConfigDialogProps {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  collectionId: string;
  temporalRange: [string, string];
  cloudCover?: number;
  isLoading?: boolean;
  onApply: (config: {
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  }) => void;
}

export function DataConfigDialog({
  open,
  onOpenChange,
  collectionId,
  temporalRange,
  cloudCover = 100,
  isLoading = false,
  onApply
}: DataConfigDialogProps) {
  const handleApply = (config: {
    collectionId: string;
    temporalRange: [string, string];
    cloudCover: number;
  }) => {
    onApply(config);
    if (!isLoading) {
      onOpenChange({ open: false });
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange({ open: false });
    }
  };

  const handleOpenChange = (details: { open: boolean }) => {
    if (!isLoading) {
      onOpenChange(details);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} size='lg'>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              Configuration
              {isLoading && ' - Loading...'}
            </Dialog.Title>
            <Dialog.CloseTrigger disabled={isLoading} />
          </Dialog.Header>
          <Dialog.Body>
            <DataConfigForm
              collectionId={collectionId}
              temporalRange={temporalRange}
              cloudCover={cloudCover}
              onApply={handleApply}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
