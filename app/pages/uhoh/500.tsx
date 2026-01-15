import SmartLink from '$components/common/smart-link';
import { Heading, Text, VStack } from '@chakra-ui/react';

export default function UhOh500() {
  return (
    <VStack as='main' h='100%' gap={0} p={20}>
      <title>{import.meta.env.VITE_APP_TITLE} - Critical Error</title>

      <Heading size='7xl'>500</Heading>
      <Text fontSize='2xl' mt={4}>
        Oh Snap! Something went wrong on our end.
      </Text>
      <Text fontSize='lg' mt={2}>
        Try to reload the page or go back to the{' '}
        <SmartLink to='/' variant='underline' colorPalette='primary'>
          homepage
        </SmartLink>
        ?
      </Text>
    </VStack>
  );
}
