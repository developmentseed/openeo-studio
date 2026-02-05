import {
  Accordion,
  Alert,
  Box,
  IconButton,
  Span,
  Text
} from '@chakra-ui/react';

interface ExecutionErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export function ExecutionErrorAlert({
  message,
  onDismiss
}: ExecutionErrorAlertProps) {
  const hasDetails = message.trim().length > 0;

  return (
    <Box position='absolute' left={4} right={4} bottom={4} zIndex={10}>
      <Alert.Root status='error' variant='subtle' size='sm' position='relative'>
        <IconButton
          aria-label='Dismiss error'
          size='2xs'
          variant='ghost'
          color='currentColor'
          position='absolute'
          top='2'
          right='1'
          onClick={onDismiss}
        >
          <svg
            version='1.1'
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
          >
            <rect width='16' height='16' id='icon-bound' fill='none' />
            <polygon points='13.707,3.707 12.293,2.293 8,6.586 3.707,2.293 2.293,3.707 6.586,8 2.293,12.293 3.707,13.707 8,9.414  12.293,13.707 13.707,12.293 9.414,8' />
          </svg>
        </IconButton>
        <Alert.Indicator />
        <Alert.Content>
          {hasDetails ? (
            <Accordion.Root collapsible size='sm' variant='plain'>
              <Accordion.Item value='details'>
                <Accordion.ItemTrigger py={0} minHeight='auto'>
                  <Span fontWeight='semibold'>Execution failed</Span>
                  <Accordion.ItemIndicator color='currentColor' />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>
                    <Text fontSize='xs' fontFamily='mono' whiteSpace='pre-wrap'>
                      {message}
                    </Text>
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          ) : (
            <Alert.Title>Execution failed</Alert.Title>
          )}
        </Alert.Content>
      </Alert.Root>
    </Box>
  );
}
