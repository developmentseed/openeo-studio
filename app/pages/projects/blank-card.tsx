import { Button, Text, VStack } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';

import { useNewProject } from '$components/catalogue/use-open-entry';

export function BlankCard() {
  const { newProject, dialog } = useNewProject();

  return (
    <>
      <Button
        unstyled
        onClick={newProject}
        textAlign='inherit'
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
      >
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
      </Button>
      {dialog}
    </>
  );
}
