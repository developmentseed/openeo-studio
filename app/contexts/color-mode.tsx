'use client';

import {
  ClientOnly,
  IconButton,
  Skeleton,
  Box,
  IconButtonProps,
  BoxProps
} from '@chakra-ui/react';
import { ThemeProvider, useTheme, ThemeProviderProps } from 'next-themes';
import { LuMoon, LuSun } from 'react-icons/lu';

export function ColorModeProvider(props: ThemeProviderProps) {
  return (
    <ThemeProvider
      attribute='class'
      disableTransitionOnChange
      defaultTheme='light'
      {...props}
    />
  );
}

export type ColorMode = 'light' | 'dark';

export interface UseColorModeReturn {
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
}

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  const colorMode = forcedTheme || resolvedTheme;
  const toggleColorMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  return {
    colorMode: colorMode as ColorMode,
    setColorMode: setTheme,
    toggleColorMode
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === 'dark' ? dark : light;
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === 'dark' ? <LuMoon /> : <LuSun />;
}

export function ColorModeButton(props: Omit<IconButtonProps, 'aria-label'>) {
  const { toggleColorMode } = useColorMode();
  return (
    <ClientOnly fallback={<Skeleton boxSize='9' />}>
      <IconButton
        onClick={toggleColorMode}
        variant='ghost'
        aria-label='Toggle color mode'
        size='sm'
        {...props}
      >
        <ColorModeIcon />
      </IconButton>
    </ClientOnly>
  );
}

export function LightMode(props: BoxProps) {
  return (
    <Box
      color='fg'
      display='contents'
      className='chakra-theme light'
      colorPalette='neutral'
      colorScheme='light'
      {...props}
    />
  );
}

export function DarkMode(props: BoxProps) {
  return (
    <Box
      color='fg'
      display='contents'
      className='chakra-theme dark'
      colorPalette='neutral'
      colorScheme='dark'
      {...props}
    />
  );
}
