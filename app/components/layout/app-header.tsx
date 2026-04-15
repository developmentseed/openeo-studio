import { useState } from 'react';
import { Button, Flex, Heading, IconButton, Separator } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { APP_TITLE } from '$config/constants';
import { UserInfo } from '$components/auth/user-info';
import { ServicesPanel } from '$components/layout/services-panel';
import SmartLink from '$utils/smart-link';

function ServicesIcon() {
  return (
    <svg viewBox='0 0 16 16' width='16' height='16' fill='currentColor'>
      <path d='M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z' />
      <path d='M5 4h6v1H5V4zm0 3h6v1H5V7zm0 3h4v1H5v-1z' />
    </svg>
  );
}

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [servicesPanelOpen, setServicesPanelOpen] = useState(false);

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
        aria-label='Home'
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
        {isAuthenticated && (
          <IconButton
            aria-label='Permanent services'
            size='sm'
            variant='ghost'
            onClick={() => setServicesPanelOpen(true)}
          >
            <ServicesIcon />
          </IconButton>
        )}
        <Separator orientation='vertical' height='8' />
        <UserInfo />
      </Flex>
      {isAuthenticated && (
        <ServicesPanel
          open={servicesPanelOpen}
          onClose={() => setServicesPanelOpen(false)}
        />
      )}
    </Flex>
  );
}
