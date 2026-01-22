import { Button, Flex, Heading, Separator } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router';
import { APP_TITLE } from '$config/constants';
import { UserInfo } from '$components/auth/user-info';
import SmartLink from '$utils/smart-link';

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
      <SmartLink
        to='/'
        paddingInline='3.5'
        height='9'
        _hover={{ textDecoration: 'none' }}
        _focus={{ outline: 'none' }}
        _focusVisible={{
          outlineWidth: '2px',
          outlineOffset: '2px',
          outlineStyle: 'solid',
          outlineColor: 'colorPalette.focusRing',
          borderRadius: 'l2'
        }}
      >
        <Heading size='md'>{APP_TITLE}</Heading>
      </SmartLink>
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
