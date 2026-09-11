import { Box, IconButton, Image, Separator, Stack } from '@chakra-ui/react';
import { NavLink } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { LuCircleHelp, LuFolder, LuPlus, LuServer } from 'react-icons/lu';

import { UserInfo } from '$components/auth/user-info';
import SmartLink from '$components/common/smart-link';
import { Tip } from '$components/tooltip';
import { ColorModeButton } from '$contexts/color-mode';

import logoImg from '../../media/openeo_navbar_logo.png';

export function AppHeader() {
  const { isAuthenticated } = useAuth();

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
          <Tip placement='right' content='Projects'>
            <IconButton variant='ghost' size='sm' asChild>
              <NavLink to='/projects'>
                <LuFolder />
              </NavLink>
            </IconButton>
          </Tip>
        )}
        {isAuthenticated && (
          <Tip placement='right' content='Services'>
            <IconButton variant='ghost' size='sm' asChild>
              <NavLink to='/services'>
                <LuServer />
              </NavLink>
            </IconButton>
          </Tip>
        )}
        {isAuthenticated && (
          <>
            <Separator orientation='horizontal' w='4' />

            <Tip placement='right' content='New project'>
              <IconButton variant='outline' size='sm' asChild>
                <SmartLink to='/editor'>
                  <LuPlus />
                </SmartLink>
              </IconButton>
            </Tip>
          </>
        )}
      </Stack>

      <Stack mt='auto'>
        <Tip placement='right' content='Documentation'>
          <IconButton variant='ghost' size='sm' asChild>
            <NavLink to='/docs'>
              <LuCircleHelp />
            </NavLink>
          </IconButton>
        </Tip>
        <Tip placement='right' content='Toggle color mode'>
          <Box>
            <ColorModeButton />
          </Box>
        </Tip>
        <UserInfo variant='outline' compact />
      </Stack>
    </Stack>
  );
}
