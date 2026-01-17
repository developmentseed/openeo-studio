import { Flex, Text, Code } from '@chakra-ui/react';

/**
 * Display available variables from the loader script.
 * Helps users understand what they can use in their algorithm code.
 */
export function AvailableVariables() {
  return (
    <Flex direction='column' gap={2} px={3} pb={3}>
      <Flex alignItems='baseline' gap={2}>
        <Code fontSize='sm' fontFamily='monospace' colorPalette='blue'>
          datacube
        </Code>
        <Text fontSize='xs' color='gray.500'>
          :
        </Text>
        <Code fontSize='xs' colorPalette='gray'>
          DataCube
        </Code>
        <Text fontSize='xs' color='gray.600' pl={4}>
          Data object from openeo.rest.datacube
        </Text>
      </Flex>

      <Flex alignItems='baseline' gap={2}>
        <Code fontSize='sm' fontFamily='monospace' colorPalette='blue'>
          reduced
        </Code>
        <Text fontSize='xs' color='gray.500'>
          :
        </Text>
        <Code fontSize='xs' colorPalette='gray'>
          DataCube
        </Code>
        <Text fontSize='xs' color='gray.600' pl={4}>
          Datacube with pixel selection applied (first pixel in time)
        </Text>
      </Flex>
    </Flex>
  );
}
