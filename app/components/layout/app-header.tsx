import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FlexProps,
  Heading,
  IconButton,
  Image,
  Stack,
  Text
} from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from 'react-oidc-context';
import {
  LuCircleHelp,
  LuFolder,
  LuHouse,
  LuLogIn,
  LuLogOut,
  LuMoon,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuPlus,
  LuServer,
  LuSun
} from 'react-icons/lu';

import { useEmailHash } from '$components/auth/user-info';
import SmartLink from '$components/common/smart-link';
import { Tip } from '$components/tooltip';
import { useColorMode } from '$contexts/color-mode';

import logoImg from '../../media/openeo_navbar_logo.png';

const PARTNER_LOGO_URL = import.meta.env.VITE_PARTNER_LOGO_URL;
const PARTNER_NAME = import.meta.env.VITE_PARTNER_NAME;

export function AppHeader() {
  const { isAuthenticated } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  const [barOpen, setBarOpen] = useState(false);

  const BtnCmp = barOpen ? Button : IconButton;

  return (
    <Stack
      as='header'
      borderWidth='1px'
      borderColor='border'
      borderRadius='uni'
      position='sticky'
      h='calc(100vh -  1rem)'
      alignItems='start'
      top={2}
      gap={0}
      bg='subtle'
      boxShadow='lg'
      w={barOpen ? '16rem' : undefined}
    >
      <Flex
        data-open={barOpen}
        h='4.5rem'
        w='100%'
        gap={2}
        px={2}
        justifyContent='center'
        alignItems='center'
        _hover={{
          '&:not([data-open="true"])': {
            '& .panel-expand': { display: 'flex' },
            '& .logo-comp': { display: 'none' }
          }
        }}
      >
        <LogoComposition />
        {barOpen && <NameComposition />}

        <IconButton
          className='panel-expand'
          display='none'
          variant='ghost'
          size='sm'
          height='3rem'
          onClick={() => setBarOpen(true)}
        >
          <LuPanelLeftOpen />
        </IconButton>

        {barOpen && (
          <IconButton
            variant='ghost'
            size='sm'
            ml='auto'
            onClick={() => setBarOpen(false)}
          >
            <LuPanelLeftClose />
          </IconButton>
        )}
      </Flex>

      <Stack
        bg='bg'
        borderRadius='uni'
        h='100%'
        w='100%'
        boxShadow='0 0 0 1px {colors.border}'
        gap={0}
        css={
          barOpen && {
            '& a, & button': {
              justifyContent: 'start'
            }
          }
        }
      >
        <Stack
          as='nav'
          gap={2}
          w='100%'
          p={2}
          borderBottomWidth='1px'
          borderBottomColor='border'
        >
          <Tip placement='right' content='Welcome' disabled={barOpen}>
            <BtnCmp variant='ghost' size='sm' asChild>
              <NavLink to='/'>
                <LuHouse /> {barOpen && 'Welcome'}
              </NavLink>
            </BtnCmp>
          </Tip>
          <Tip
            placement='right'
            content={isAuthenticated ? 'Projects' : 'Login to see projects'}
            disabled={barOpen && isAuthenticated}
          >
            <BtnCmp
              variant='ghost'
              size='sm'
              disabled={!isAuthenticated}
              asChild
            >
              <NavLink to='/projects'>
                <LuFolder />
                {barOpen && 'Projects'}
              </NavLink>
            </BtnCmp>
          </Tip>
          <Tip
            placement='right'
            content={isAuthenticated ? 'Services' : 'Login to see services'}
            disabled={barOpen && isAuthenticated}
          >
            <BtnCmp
              variant='ghost'
              size='sm'
              disabled={!isAuthenticated}
              asChild
            >
              <NavLink to='/services'>
                <LuServer /> {barOpen && 'Services'}
              </NavLink>
            </BtnCmp>
          </Tip>
        </Stack>

        <Stack
          as='nav'
          gap={2}
          w='100%'
          h='100%'
          p={2}
          borderBottomWidth='1px'
          borderBottomColor='border'
        >
          <Tip
            placement='right'
            content={
              isAuthenticated ? 'New project' : 'Login to create projects'
            }
            disabled={barOpen && isAuthenticated}
          >
            <BtnCmp
              variant='ghost'
              size='sm'
              disabled={!isAuthenticated}
              asChild
            >
              <SmartLink to='/editor'>
                <LuPlus />
                {barOpen && 'New project'}
              </SmartLink>
            </BtnCmp>
          </Tip>
        </Stack>

        <Stack p={2} borderBottomWidth='1px' borderBottomColor='border'>
          <Tip placement='right' content='Documentation' disabled={barOpen}>
            <BtnCmp variant='ghost' size='sm' asChild>
              <NavLink to='/docs'>
                <LuCircleHelp /> {barOpen && 'Documentation'}
              </NavLink>
            </BtnCmp>
          </Tip>
          <Tip placement='right' content='Toggle color mode' disabled={barOpen}>
            <BtnCmp variant='ghost' size='sm' onClick={toggleColorMode}>
              {colorMode === 'dark' ? <LuSun /> : <LuMoon />}{' '}
              {barOpen && colorMode === 'dark'
                ? 'Light mode'
                : barOpen && 'Dark mode'}
            </BtnCmp>
          </Tip>
        </Stack>

        <Stack p={2} borderBottomWidth='1px' borderBottomColor='border'>
          <UserInfo compact={!barOpen} />
        </Stack>
      </Stack>
    </Stack>
  );
}

function Logo(props: FlexProps & { src: string }) {
  const { src, ...rest } = props;

  return (
    <Flex
      boxSize='2rem'
      borderWidth='1px'
      borderColor='border'
      borderRadius='uni'
      justifyContent='center'
      bg='bg'
      p={0.5}
      overflow='hidden'
      position='relative'
      zIndex={1}
      {...rest}
    >
      <Image src={src} h='100%' />
    </Flex>
  );
}

function LogoComposition() {
  const hasPartner = !!PARTNER_LOGO_URL && !!PARTNER_NAME;

  return (
    <Box className='logo-comp'>
      <Logo src={logoImg} />
      {hasPartner && <Logo mt={-4} src={PARTNER_LOGO_URL} />}
    </Box>
  );
}

function NameComposition() {
  const hasPartner = !!PARTNER_LOGO_URL && !!PARTNER_NAME;

  if (!hasPartner) {
    return <Heading size='sm'>OpenEo Studio</Heading>;
  }

  return (
    <Heading size='sm'>
      <Text as='span' fontSize='2xs' lineHeight='0.875rem' color='fg.muted'>
        OpenEo Studio{' '}
        <Text as='span' fontWeight='normal'>
          for
        </Text>
      </Text>
      <Text>{PARTNER_NAME}</Text>
    </Heading>
  );
}

function UserInfo(props: { compact?: boolean }) {
  const { compact } = props;
  const { signinRedirect, isLoading, isAuthenticated, user, removeUser } =
    useAuth();
  const location = useLocation();

  const profile = user?.profile;

  const userEmailHash = useEmailHash(profile?.email);

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    signinRedirect({
      state: { returnTo: location.pathname }
    });
  };

  if (isAuthenticated) {
    return (
      <Tip placement='right' content='Logout' disabled={!compact}>
        <IconButton
          variant='ghost'
          size='sm'
          onClick={(e) => {
            e.preventDefault();
            removeUser();
          }}
          overflow='hidden'
          pr={!compact ? 2 : undefined}
        >
          <Image
            borderRadius='uni'
            boxSize='2rem'
            src={`https://www.gravatar.com/avatar/${userEmailHash}?d=initials`}
            alt='User image'
          />

          {!compact && (
            <>
              Logout{' '}
              <Box ml='auto'>
                <LuLogOut />
              </Box>
            </>
          )}
        </IconButton>
      </Tip>
    );
  }

  const BtnCmp = compact ? IconButton : Button;

  return (
    <Tip placement='right' content='Login' disabled={!compact}>
      <BtnCmp variant='ghost' size='sm' onClick={handleLogin}>
        <LuLogIn /> {!compact && 'Login'}
      </BtnCmp>
    </Tip>
  );
}
