import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { LoginButton } from '$components/auth/login-button';

export function LoginDialog({ isOpen }: { isOpen: boolean }) {
  if (!isOpen) {
    return null;
  }

  return (
    <Box
      position='absolute'
      inset={0}
      display='flex'
      alignItems='center'
      justifyContent='center'
      bg='whiteAlpha.400'
      role='dialog'
      aria-labelledby='auth-dialog-title'
      aria-describedby='auth-dialog-description'
    >
      <VStack
        bg='white'
        p={8}
        borderRadius='md'
        shadow='lg'
        maxW='sm'
        textAlign='center'
        gap={4}
      >
        <Heading id='auth-dialog-title' size='md'>
          Authentication Required
        </Heading>
        <Text id='auth-dialog-description' fontSize='sm' color='gray.600'>
          Sign in to your account to analyze satellite data and visualize
          results on the map.
        </Text>
        <LoginButton size='md' />
      </VStack>
    </Box>
  );
}
