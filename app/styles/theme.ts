import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineGlobalStyles
} from '@chakra-ui/react';

import { colors, semanticColors } from './colors';

export const config = defineConfig({
  globalCss: defineGlobalStyles({
    html: {
      colorPalette: 'neutral',
      color: 'fg'
    }
  }),
  theme: {
    tokens: {
      /* ---------------------------------- */
      /* Colors                             */
      /* ---------------------------------- */
      colors,

      /* ---------------------------------- */
      /* Sizes                              */
      /* ---------------------------------- */
      sizes: {
        '7xl': { value: '1280px' },
        '8xl': { value: '1440px' },
        '9xl': { value: '1536px' },
        '10xl': { value: '1920px' }
      },

      /* ---------------------------------- */
      /* Borders                            */
      /* ---------------------------------- */
      borderWidths: {
        global: { value: '1px' }
      },

      /* ---------------------------------- */
      /* Typography                         */
      /* ---------------------------------- */
      fonts: {
        heading: { value: 'Inter' },
        body: { value: 'Inter' },
        mono: { value: 'Roboto Mono' }
      }
    },
    semanticTokens: {
      colors: semanticColors,
      radii: {
        uni: { value: '{radii.lg}' }
      }
    },
    recipes: {
      button: {
        base: {
          borderRadius: 'uni',
          fontWeight: 'semibold'
        }
      },
      heading: {
        base: {
          fontWeight: 'bold'
        }
      }
    }
  }
});

export default createSystem(defaultConfig, config);
