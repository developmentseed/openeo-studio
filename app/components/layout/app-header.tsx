import { Flex, Heading } from '@chakra-ui/react';
import { UserInfo } from '$components/auth/user-info';
import { APP_TITLE } from '$config/constants';

export function AppHeader() {
  return (
    <Flex alignItems='center' justifyContent='space-between' p={8}>
      <Heading size='2xl'>{APP_TITLE}</Heading>
      <Flex ml='auto' alignItems='center'>
        <UserInfo />
      </Flex>
    </Flex>
  );
}
