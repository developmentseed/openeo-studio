import React from 'react';
import { useAuth } from 'react-oidc-context';
import { Button, Heading, Text, VStack } from '@chakra-ui/react';

export function RequireAuth(
  props: {
    Component: React.ElementType;
  } & Record<string, any>
) {
  const { Component, ...rest } = props;

  const { isAuthenticated, signinRedirect } = useAuth();

  if (import.meta.env.VITE_AUTH_DISABLED) {
    return <Component {...rest} />;
  }

  if (isAuthenticated) {
    return <Component {...rest} />;
  }

  return (
    <VStack as='main' h='100%' gap={0} p={20}>
      <title>Authentication Required</title>

      <Heading size='7xl'>403</Heading>
      <Text fontSize='2xl' mt={4}>
        Authentication Required
      </Text>
      <Text>You need to login to access this content.</Text>
      <Button
        mt={8}
        variant='solid'
        colorPalette='primary'
        onClick={() => {
          signinRedirect({
            state: window.location.href.replace(window.location.origin, '')
          });
        }}
      >
        Login
      </Button>
    </VStack>
  );
}
