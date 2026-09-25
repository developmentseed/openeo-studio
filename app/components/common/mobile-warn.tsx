import { Outlet } from 'react-router';
import { Box, Flex, Text, useMediaQuery, VStack } from '@chakra-ui/react';
import { LuMonitor } from 'react-icons/lu';

export function MobileWarn() {
  const [isMobile] = useMediaQuery(['(max-width: 1000px)'], { ssr: false });

  if (!isMobile) {
    return <Outlet />;
  }

  return (
    <Flex alignItems='center' justifyContent='center' flex={1}>
      <Box p={6} boxSize='100%'>
        <VStack gap={2} justify='center' height='100%'>
          <LuMonitor size={48} />
          <Text fontWeight='semibold' fontSize='lg'>
            Your screen is too small
          </Text>
          <Text fontSize='sm' textAlign='center'>
            We&apos;re sorry, but there is no way to fit all the nice features
            on this screen.
          </Text>
          <Text fontSize='sm' textAlign='center'>
            Please switch to a larger screen to continue.
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
