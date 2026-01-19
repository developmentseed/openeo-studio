import { Button, Flex, Heading, Separator } from '@chakra-ui/react';
import { APP_TITLE } from '$config/constants';
import { UserInfo } from '$components/auth/user-info';
import { DocsPageModal } from '$pages/docs-modal-page';

export function AppHeader() {
  return (
    <Flex alignItems='center' justifyContent='space-between' p={8}>
      <Heading size='2xl'>{APP_TITLE}</Heading>
      <Flex ml='auto' alignItems='center' gap={4}>
        <DocsPageModal
          trigger={
            <Button variant='ghost' size='sm'>
              Documentation
            </Button>
          }
        />
        <Separator orientation='vertical' height='8' />
        <UserInfo />
      </Flex>
    </Flex>
  );
}
