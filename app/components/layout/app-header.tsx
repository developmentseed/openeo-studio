import { useState } from 'react';
import { Box, Heading, IconButton, Separator, Stack } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { LuCircleHelp, LuFolder, LuPlus, LuServer } from 'react-icons/lu';

import { APP_TITLE } from '$config/constants';
import { UserInfo } from '$components/auth/user-info';
import { ServicesPanel } from '$components/layout/services-panel';
import SmartLink from '$utils/smart-link';

export function AppHeader() {
  const { isAuthenticated } = useAuth();
  const [servicesPanelOpen, setServicesPanelOpen] = useState(false);

  return (
    <Stack
      p={2}
      borderWidth='1px'
      borderColor='gray.200'
      borderRadius='md'
      position='fixed'
      h='calc(100vh -  1rem)'
      gap={8}
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
        <Heading size='md'>L</Heading>
      </SmartLink>
      <Stack ml='auto' alignItems='center' gap={2}>
        {isAuthenticated && (
          <IconButton variant='ghost' size='sm' rounded='md' asChild>
            <SmartLink to='/'>
              <LuFolder />
            </SmartLink>
          </IconButton>
        )}
        <IconButton variant='ghost' size='sm' rounded='md' asChild>
          <SmartLink to='/docs'>
            <LuCircleHelp />
          </SmartLink>
        </IconButton>
        {isAuthenticated && (
          <>
            <Separator orientation='horizontal' w='4' />
            <IconButton variant='outline' size='sm' rounded='md' asChild>
              <SmartLink to='/docs'>
                <LuPlus />
              </SmartLink>
            </IconButton>
          </>
        )}
        {isAuthenticated && (
          <>
            <IconButton
              variant='ghost'
              size='sm'
              onClick={() => setServicesPanelOpen(true)}
              colorPalette='red'
            >
              <LuServer />
            </IconButton>
            <ServicesPanel
              open={servicesPanelOpen}
              onClose={() => setServicesPanelOpen(false)}
            />
          </>
        )}
      </Stack>

      <Box mt='auto'>
        <UserInfo compact />
      </Box>
    </Stack>
  );
}
