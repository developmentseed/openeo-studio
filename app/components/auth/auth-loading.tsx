import { Heading, Spinner, Stack } from '@chakra-ui/react';

interface AuthLoadingProps {
  /** Optional status copy shown under the spinner (e.g. auth callback). */
  message?: string;
}

/**
 * Shared auth/loading spinner used by RequireAuth and the OIDC callback shell.
 */
export function AuthLoading({ message }: AuthLoadingProps) {
  return (
    <Stack flex={1} alignItems='center' justifyContent='center' gap={2}>
      <Spinner size='lg' />
      {message && <Heading size='xl'>{message}</Heading>}
    </Stack>
  );
}
