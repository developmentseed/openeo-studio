import { Heading, Text, VStack } from '@chakra-ui/react';
import { APP_TITLE } from '$config/constants';

export default function UhOh404() {
  return (
    <VStack as='main' h='100%' gap={0} py={20} w='100%'>
      <title>{APP_TITLE} - Page not found</title>

      <Heading size='7xl'>404</Heading>
      <Text fontSize='2xl' mt={4}>
        UhOh! The page you are looking for is missing
      </Text>
    </VStack>
  );
}
