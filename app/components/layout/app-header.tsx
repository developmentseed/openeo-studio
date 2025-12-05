import { Flex, Heading } from '@chakra-ui/react';
import { UserInfo } from '$components/auth/user-info';

export function AppHeader() {
  return (
    <Flex alignItems='center' justifyContent='space-between' p={8}>
      <Heading size='2xl'>EOPF Code Editor</Heading>
      <Flex ml='auto' alignItems='center'>
        <UserInfo />
      </Flex>
    </Flex>
  );
}
