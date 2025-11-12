import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { createColorPalette } from './color-palette';

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        body: { value: '"Gloria Hallelujah", sans-serif' },
        heading: { value: '"Gloria Hallelujah", serif' }
      },
      colors: {
        primary: createColorPalette('#1E7BC6'),
        secondary: createColorPalette('#5FAD56'),
        base: createColorPalette('#2B2D42'),
        danger: createColorPalette('#D65108'),
        warning: createColorPalette('#EFA00B'),
        success: createColorPalette('#5FAD56'),
        info: createColorPalette('#1E7BC6'),
        surface: createColorPalette('#FFF')
      }
    },
    layerStyles: {
      handDrawn: {
        description: 'A hand-drawn style with irregular borders',
        value: {
          borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
        }
      }
    }
  }
});

export default createSystem(defaultConfig, config);
