import { Heading, Text, VStack } from '@chakra-ui/react';

export default function UhOh404() {
  return (
    <VStack as='main' h='100%' gap={0} p={20}>
      <title>OpenEO Studio - Page not found</title>

      <Heading size='7xl'>404</Heading>
      <Text fontSize='2xl' mt={4}>
        UhOh! The page you are looking for is missing
      </Text>
    </VStack>
  );
}
