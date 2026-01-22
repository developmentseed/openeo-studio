import { Button, Flex, Heading, Separator } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router';
import { APP_TITLE } from '$config/constants';
import { UserInfo } from '$components/auth/user-info';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleDocsClick = () => {
    if (location.pathname !== '/docs') {
      navigate('/docs');
    }
  };

  return (
    <Flex
      alignItems='center'
      justifyContent='space-between'
      px={4}
      py={2}
      borderBottomWidth='1px'
      borderColor='gray.200'
    >
      <Heading size='md'>{APP_TITLE}</Heading>
      <Flex ml='auto' alignItems='center' gap={4}>
        <Button variant='ghost' size='sm' onClick={handleDocsClick}>
          Documentation
        </Button>
        <Separator orientation='vertical' height='8' />
        <UserInfo />
      </Flex>
    </Flex>
  );
}
