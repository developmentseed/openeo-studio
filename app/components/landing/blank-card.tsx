import { Box, Text, VStack, Icon } from '@chakra-ui/react';

interface BlankCardProps {
  onSelect: () => void;
}

const PlusIcon = () => (
  <svg
    version='1.1'
    xmlns='http://www.w3.org/2000/svg'
    width='48'
    height='48'
    viewBox='0 0 16 16'
  >
    <rect width='16' height='16' id='icon-bound' fill='none' />
    <polygon points='15,7 9,7 9,1 7,1 7,7 1,7 1,9 7,9 7,15 9,15 9,9 15,9' />
  </svg>
);

export function BlankCard({ onSelect }: BlankCardProps) {
  return (
    <Box
      as='button'
      onClick={onSelect}
      borderWidth='2px'
      borderStyle='dashed'
      borderColor='gray.300'
      borderRadius='lg'
      p={6}
      transition='all 0.2s'
      _hover={{
        borderColor: 'blue.400',
        backgroundColor: 'gray.50',
        transform: 'translateY(-2px)',
        shadow: 'md'
      }}
      _active={{
        transform: 'translateY(0)'
      }}
      cursor='pointer'
      height='100%'
      minHeight='200px'
    >
      <VStack gap={4} justify='center' height='100%'>
        <Icon as={PlusIcon} boxSize={12} color='gray.400' />
        <VStack gap={1}>
          <Text fontWeight='semibold' fontSize='lg' color='gray.700'>
            Start from Scratch
          </Text>
          <Text fontSize='sm' color='gray.500' textAlign='center'>
            Configure your own data source and create a custom analysis
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
