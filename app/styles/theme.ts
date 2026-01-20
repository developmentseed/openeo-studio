import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

export const config = defineConfig({
  theme: {
    tokens: {
      /* ---------------------------------- */
      /* Colors                              */
      /* ---------------------------------- */
      colors: {
        foreground: {
          50: { value: '#f5f7f8' },
          100: { value: '#ebeef0' },
          200: { value: '#d6dee2' },
          300: { value: '#adbdc4' },
          400: { value: '#5c7b89' },
          500: { value: '#182555' },
          600: { value: '#00283c' },
          700: { value: '#002130' },
          800: { value: '#001925' },
          900: { value: '#00111a' },

          '50A': { value: '#1825550a' },
          '100A': { value: '#18255514' },
          '200A': { value: '#18255528' },
          '300A': { value: '#18255551' },
          '400A': { value: '#182555a3' }
        },

        background: {
          500: { value: '#ffffff' },
          '50A': { value: '#ffffff0a' },
          '100A': { value: '#ffffff14' },
          '200A': { value: '#ffffff28' },
          '300A': { value: '#ffffff51' },
          '400A': { value: '#ffffffa3' }
        },

        primary: {
          50: { value: '#f7fafc' },
          100: { value: '#f0f4f9' },
          200: { value: '#e0eaf3' },
          300: { value: '#c2d5e7' },
          400: { value: '#85abcf' },
          500: { value: '#407bb4' },
          600: { value: '#366797' },
          700: { value: '#2c547a' },
          800: { value: '#21405e' },
          900: { value: '#172c41' },

          '50A': { value: '#407bb40a' },
          '100A': { value: '#407bb414' },
          '200A': { value: '#407bb428' },
          '300A': { value: '#407bb451' },
          '400A': { value: '#407bb4a3' }
        },

        secondary: {
          50: { value: '#f9f7f6' },
          100: { value: '#f2f0ee' },
          200: { value: '#e6e1dc' },
          300: { value: '#ccc3b9' },
          400: { value: '#998773' },
          500: { value: '#604325' },
          600: { value: '#51381f' },
          700: { value: '#412e19' },
          800: { value: '#322313' },
          900: { value: '#23180d' },

          '50A': { value: '#6043250a' },
          '100A': { value: '#60432514' },
          '200A': { value: '#60432528' },
          '300A': { value: '#60432551' },
          '400A': { value: '#604325a3' }
        },

        state: {
          danger: { 500: { value: '#ff331f' } },
          warning: { 500: { value: '#ffa400' } },
          success: { 500: { value: '#32936f' } },
          info: { 500: { value: '#407bb4' } }
        }
      },

      /* ---------------------------------- */
      /* Spacing                             */
      /* ---------------------------------- */
      spacing: {
        none: { value: '0px' },
        xxs: { value: '2px' },
        xs: { value: '4px' },
        sm: { value: '8px' },
        md: { value: '12px' },
        lg: { value: '16px' },
        xl: { value: '24px' },
        '2xl': { value: '32px' },
        '3xl': { value: '48px' },
        '4xl': { value: '64px' },
        '5xl': { value: '96px' }
      },

      /* ---------------------------------- */
      /* Radii                               */
      /* ---------------------------------- */
      radii: {
        none: { value: '0px' },
        xs: { value: '2px' },
        sm: { value: '4px' },
        md: { value: '8px' },
        lg: { value: '16px' },
        xl: { value: '32px' },
        full: { value: '9999px' }
      },

      /* ---------------------------------- */
      /* Sizes                               */
      /* ---------------------------------- */
      sizes: {
        '7xl': { value: '1280px' },
        '8xl': { value: '1440px' },
        '9xl': { value: '1536px' },
        '10xl': { value: '1920px' }
      },

      /* ---------------------------------- */
      /* Borders                             */
      /* ---------------------------------- */
      borderWidths: {
        global: { value: '1px' } // globalBorderpos
      },

      /* ---------------------------------- */
      /* Typography                          */
      /* ---------------------------------- */
      fonts: {
        heading: { value: 'Inter' },
        body: { value: 'Inter' },
        mono: { value: 'Roboto Mono' }
      }
    }
  }
});

export default createSystem(defaultConfig, config);
