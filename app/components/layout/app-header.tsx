import { useState } from 'react';
import { IconButton, Image, Separator, Stack } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { LuCircleHelp, LuFolder, LuPlus, LuServer } from 'react-icons/lu';

import { UserInfo } from '$components/auth/user-info';
import { ServicesPanel } from '$components/layout/services-panel';
import SmartLink from '$utils/smart-link';
import { ColorModeButton } from '$utils/color-mode';

import logoImg from '../../media/openeo_navbar_logo.png';
import { NavLink } from 'react-router';

export function AppHeader() {
  const { isAuthenticated } = useAuth();
  const [servicesPanelOpen, setServicesPanelOpen] = useState(false);

  return (
    <Stack
      p={2}
      pt={3}
      borderWidth='1px'
      borderColor='border'
      borderRadius='uni'
      position='sticky'
      h='calc(100vh -  1rem)'
      alignItems='center'
      top={2}
      gap={4}
      bg='bg'
    >
      <SmartLink
        to='/'
        height='1.5rem'
        aria-label='Home'
        _hover={{ textDecoration: 'none' }}
        _focus={{ outline: 'none' }}
        _focusVisible={{
          outlineWidth: '2px',
          outlineOffset: '2px',
          outlineStyle: 'solid',
          outlineColor: 'colorPalette.focusRing',
          borderRadius: 'uni'
        }}
      >
        <Image src={logoImg} h='100%' />
      </SmartLink>
      <Stack as='nav' gap={2} alignItems='center'>
        {isAuthenticated && (
          <IconButton variant='ghost' size='sm' asChild>
            <NavLink to='/projects'>
              <LuFolder />
            </NavLink>
          </IconButton>
        )}
        {isAuthenticated && (
          <>
            <Separator orientation='horizontal' w='4' />
            <IconButton variant='outline' size='sm' asChild>
              <SmartLink to='/editor'>
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

      <Stack mt='auto'>
        <IconButton variant='ghost' size='sm' asChild>
          <NavLink to='/docs'>
            <LuCircleHelp />
          </NavLink>
        </IconButton>
        <ColorModeButton />
        <UserInfo variant='outline' compact />
      </Stack>
    </Stack>
  );
}
