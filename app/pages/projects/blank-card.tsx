import SmartLink from '$components/common/smart-link';
import { Box, Text, VStack } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';

export function BlankCard() {
  return (
    <Box
      borderWidth='2px'
      borderStyle='dashed'
      borderColor='border'
      borderRadius='uni'
      p={6}
      transition='all 0.2s'
      _hover={{
        borderColor: 'border.emphasized',
        backgroundColor: 'bg',
        transform: 'translateY(-4px)',
        shadow: 'lg'
      }}
      _active={{
        transform: 'translateY(0)'
      }}
      cursor='pointer'
      height='100%'
      minHeight='200px'
      asChild
    >
      <SmartLink to='/editor' unstyled>
        <VStack gap={2} justify='center' height='100%'>
          <LuPlus size='4rem' />
          <VStack gap={2}>
            <Text fontWeight='semibold' fontSize='lg'>
              Start from Scratch
            </Text>
            <Text fontSize='sm' textAlign='center'>
              Configure your own data source and create a custom analysis
            </Text>
          </VStack>
        </VStack>
      </SmartLink>
    </Box>
  );
}
