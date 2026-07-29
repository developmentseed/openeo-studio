import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineGlobalStyles,
  defineSlotRecipe
} from '@chakra-ui/react';
import { tabsAnatomy } from '@ark-ui/react';

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
        },
        variants: {
          // React router adds an active class to the links but buttons do not
          // have default styles for an active state. They do have styles for
          // the expanded state which is pretty much the same.
          // Here we map those styles to the active class.
          variant: {
            solid: {
              '&.active':
                defaultConfig.theme?.recipes?.button.variants?.variant.solid
                  ._expanded
            },
            subtle: {
              '&.active':
                defaultConfig.theme?.recipes?.button.variants?.variant.subtle
                  ._expanded
            },
            surface: {
              '&.active':
                defaultConfig.theme?.recipes?.button.variants?.variant.surface
                  ._expanded
            },
            outline: {
              '&.active':
                defaultConfig.theme?.recipes?.button.variants?.variant.outline
                  ._expanded
            },
            ghost: {
              '&.active':
                defaultConfig.theme?.recipes?.button.variants?.variant.ghost
                  ._expanded
            }
          }
        }
      },
      heading: {
        base: {
          fontWeight: 'bold'
        }
      }
    },
    slotRecipes: {
      tabs: defineSlotRecipe({
        slots: tabsAnatomy.keys(),
        base: {
          root: {
            '--tabs-trigger-radius': 'radii.uni'
          }
        },
        variants: {
          variant: {
            subtle: {
              trigger: {
                fontWeight: 'semibold'
              }
            }
          }
        }
      })
    }
  }
});

export default createSystem(defaultConfig, config);
