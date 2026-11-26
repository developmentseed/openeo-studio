import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineGlobalStyles,
  defineSlotRecipe
} from '@chakra-ui/react';
import { dialogAnatomy, tabsAnatomy, toastAnatomy } from '@ark-ui/react';

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
          fontWeight: 'semibold',
          colorPalette: 'neutral'
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
      },
      code: {
        base: {
          borderRadius: 'uni'
        }
      }
    },
    slotRecipes: {
      dialog: defineSlotRecipe({
        slots: dialogAnatomy.keys(),
        variants: {
          variant: {
            // A muted frame with the title bar, around a bordered body.
            framed: {
              content: {
                bg: 'bg.muted',
                boxShadow: 'inset 0 0 0 1px {colors.border}'
              },
              header: {
                alignItems: 'center',
                px: 4,
                pt: 4,
                pb: 4
              },
              body: {
                px: 4,
                pt: 4,
                pb: 4,
                bg: 'bg',
                boxShadow: 'inset 0 0 0 1px {colors.border}',
                rounded: 'uni'
              },
              // Sits at the end of the header instead of over the corner.
              closeTrigger: {
                position: 'static',
                ml: 'auto'
              }
            }
          }
        }
      }),
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
                fontWeight: 'semibold',
                color: 'fg',
                transition: 'background-color 160ms ease-in-out',
                _selected: {
                  bg: 'colorPalette.muted'
                },
                _hover: {
                  bg: 'colorPalette.subtle'
                }
              }
            }
          }
        }
      }),
      toaster: defineSlotRecipe({
        slots: toastAnatomy.keys(),
        base: {
          root: {
            '&[data-type=warning]': {
              bg: 'warning.solid',
              color: 'warning.contrast'
            },
            '&[data-type=success]': {
              bg: 'success.solid',
              color: 'success.contrast'
            },
            '&[data-type=error]': {
              bg: 'error.solid',
              color: 'error.contrast'
            }
          }
        }
      })
    }
  }
});

export default createSystem(defaultConfig, config);
