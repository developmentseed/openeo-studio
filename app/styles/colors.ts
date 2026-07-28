export const colors = {
  neutral: {
    '50': { value: '#fafbfc' },
    '100': { value: '#f5f6f8' },
    '200': { value: '#e2e5eb' },
    '300': { value: '#cfd4de' },
    '400': { value: '#9ba4ba' },
    '500': { value: '#667496' },
    '600': { value: '#45567f' },
    '700': { value: '#2d406f' },
    '800': { value: '#10265b' },
    '900': { value: '#0b1a3e' },
    '950': { value: '#071128' },
    base: { value: '#10265b' }
  },
  primary: {
    '50': { value: '#f7fafc' },
    '100': { value: '#f0f4f9' },
    '200': { value: '#e0eaf3' },
    '300': { value: '#c2d5e7' },
    '400': { value: '#85abcf' },
    '500': { value: '#407bb4' },
    '600': { value: '#366797' },
    '700': { value: '#2c547a' },
    '800': { value: '#21405e' },
    '900': { value: '#172c41' },
    '950': { value: '#0d1924' },
    base: { value: '#407bb4' }
  },
  secondary: {
    '50': { value: '#f9f7f6' },
    '100': { value: '#f2f0ee' },
    '200': { value: '#e6e1dc' },
    '300': { value: '#ccc3b9' },
    '400': { value: '#998773' },
    '500': { value: '#604325' },
    '600': { value: '#51381f' },
    '700': { value: '#412e19' },
    '800': { value: '#322313' },
    '900': { value: '#23180d' },
    '950': { value: '#130d07' },
    base: { value: '#604325' }
  },
  tertiary: {
    '50': { value: '#fdf2f8' },
    '100': { value: '#fce7f3' },
    '200': { value: '#fbcfe8' },
    '300': { value: '#f9a8d4' },
    '400': { value: '#f472b6' },
    '500': { value: '#ec4899' },
    '600': { value: '#db2777' },
    '700': { value: '#a41752' },
    '800': { value: '#6d0e34' },
    '900': { value: '#45061f' },
    '950': { value: '#2c0514' },
    base: { value: '#ec4899' }
  },
  quaternary: {
    '50': { value: '#fefce8' },
    '100': { value: '#fef9c3' },
    '200': { value: '#fef08a' },
    '300': { value: '#fde047' },
    '400': { value: '#facc15' },
    '500': { value: '#eab308' },
    '600': { value: '#ca8a04' },
    '700': { value: '#845209' },
    '800': { value: '#713f12' },
    '900': { value: '#422006' },
    '950': { value: '#281304' },
    base: { value: '#eab308' }
  },
  info: {
    '50': { value: '#eff6ff' },
    '100': { value: '#dbeafe' },
    '200': { value: '#bfdbfe' },
    '300': { value: '#a3cfff' },
    '400': { value: '#60a5fa' },
    '500': { value: '#3b82f6' },
    '600': { value: '#2563eb' },
    '700': { value: '#173da6' },
    '800': { value: '#1a3478' },
    '900': { value: '#14204a' },
    '950': { value: '#0c142e' },
    base: { value: '#3b82f6' }
  },
  success: {
    '50': { value: '#f0fdf4' },
    '100': { value: '#dcfce7' },
    '200': { value: '#bbf7d0' },
    '300': { value: '#86efac' },
    '400': { value: '#4ade80' },
    '500': { value: '#22c55e' },
    '600': { value: '#16a34a' },
    '700': { value: '#116932' },
    '800': { value: '#124a28' },
    '900': { value: '#042713' },
    '950': { value: '#03190c' },
    base: { value: '#22c55e' }
  },
  warning: {
    '50': { value: '#fff7ed' },
    '100': { value: '#ffedd5' },
    '200': { value: '#fed7aa' },
    '300': { value: '#fdba74' },
    '400': { value: '#fb923c' },
    '500': { value: '#f97316' },
    '600': { value: '#ea580c' },
    '700': { value: '#92310a' },
    '800': { value: '#6c2710' },
    '900': { value: '#3b1106' },
    '950': { value: '#220a04' },
    base: { value: '#f97316' }
  },
  error: {
    '50': { value: '#fef2f2' },
    '100': { value: '#fee2e2' },
    '200': { value: '#fecaca' },
    '300': { value: '#fca5a5' },
    '400': { value: '#f87171' },
    '500': { value: '#ef4444' },
    '600': { value: '#dc2626' },
    '700': { value: '#991919' },
    '800': { value: '#511111' },
    '900': { value: '#300c0c' },
    '950': { value: '#1f0808' },
    base: { value: '#ef4444' }
  },
  attention: {
    '50': { value: '#faf5ff' },
    '100': { value: '#f3e8ff' },
    '200': { value: '#e9d5ff' },
    '300': { value: '#d8b4fe' },
    '400': { value: '#c084fc' },
    '500': { value: '#a855f7' },
    '600': { value: '#9333ea' },
    '700': { value: '#641ba3' },
    '800': { value: '#4a1772' },
    '900': { value: '#2f0553' },
    '950': { value: '#1a032e' },
    base: { value: '#a855f7' }
  }
};

export const semanticColors = {
  bg: {
    DEFAULT: {
      value: { _light: 'white', _dark: '{colors.neutral.950}' }
    },
    subtle: {
      value: { _light: '{colors.neutral.50}', _dark: '{colors.neutral.900}' }
    },
    muted: {
      value: { _light: '{colors.neutral.100}', _dark: '{colors.neutral.800}' }
    },
    emphasized: {
      value: { _light: '{colors.neutral.200}', _dark: '{colors.neutral.700}' }
    },
    inverted: {
      value: { _light: '{colors.neutral.950}', _dark: 'white' }
    },
    panel: {
      value: { _light: 'white', _dark: '{colors.neutral.950}' }
    },
    error: {
      value: { _light: '{colors.error.50}', _dark: '{colors.error.900}' }
    },
    warning: {
      value: { _light: '{colors.warning.50}', _dark: '{colors.warning.900}' }
    },
    success: {
      value: { _light: '{colors.success.50}', _dark: '{colors.success.900}' }
    },
    info: { value: { _light: '{colors.info.50}', _dark: '{colors.info.900}' } }
  },
  fg: {
    DEFAULT: {
      value: { _light: '{colors.neutral.800}', _dark: 'white' }
    },
    muted: {
      value: { _light: '{colors.neutral.600}', _dark: '{colors.neutral.400}' }
    },
    subtle: {
      value: { _light: '{colors.neutral.400}', _dark: '{colors.neutral.500}' }
    },
    inverted: {
      value: { _light: '{colors.neutral.50}', _dark: '{colors.neutral.800}' }
    },
    error: {
      value: { _light: '{colors.error.500}', _dark: '{colors.error.400}' }
    },
    warning: {
      value: { _light: '{colors.warning.400}', _dark: '{colors.warning.300}' }
    },
    success: {
      value: { _light: '{colors.success.600}', _dark: '{colors.success.300}' }
    },
    info: {
      value: { _light: '{colors.info.600}', _dark: '{colors.info.300}' }
    }
  },
  border: {
    DEFAULT: {
      value: { _light: '{colors.neutral.200}', _dark: '{colors.neutral.700}' }
    },
    subtle: {
      value: { _light: '{colors.neutral.50}', _dark: '{colors.neutral.900}' }
    },
    muted: {
      value: { _light: '{colors.neutral.100}', _dark: '{colors.neutral.800}' }
    },
    emphasized: {
      value: { _light: '{colors.neutral.300}', _dark: '{colors.neutral.600}' }
    },
    inverted: {
      value: { _light: '{colors.neutral.800}', _dark: '{colors.neutral.200}' }
    },
    error: {
      value: { _light: '{colors.error.500}', _dark: '{colors.error.400}' }
    },
    warning: {
      value: { _light: '{colors.warning.500}', _dark: '{colors.warning.400}' }
    },
    success: {
      value: { _light: '{colors.success.500}', _dark: '{colors.success.400}' }
    },
    info: { value: { _light: '{colors.info.500}', _dark: '{colors.info.400}' } }
  },
  neutral: {
    contrast: {
      value: { _light: 'white', _dark: '{colors.neutral.800}' }
    },
    fg: {
      value: { _light: '{colors.neutral.700}', _dark: '{colors.neutral.200}' }
    },
    subtle: {
      value: { _light: '{colors.neutral.100}', _dark: '{colors.neutral.900}' }
    },
    muted: {
      value: { _light: '{colors.neutral.200}', _dark: '{colors.neutral.800}' }
    },
    emphasized: {
      value: { _light: '{colors.neutral.300}', _dark: '{colors.neutral.700}' }
    },
    solid: {
      value: { _light: '{colors.neutral.800}', _dark: 'white' }
    },
    focusRing: {
      value: { _light: '{colors.neutral.400}', _dark: '{colors.neutral.400}' }
    }
  },
  primary: {
    contrast: {
      value: { _light: 'white', _dark: 'white' }
    },
    fg: {
      value: { _light: '{colors.primary.700}', _dark: '{colors.primary.300}' }
    },
    subtle: {
      value: { _light: '{colors.primary.100}', _dark: '{colors.primary.900}' }
    },
    muted: {
      value: { _light: '{colors.primary.200}', _dark: '{colors.primary.800}' }
    },
    emphasized: {
      value: { _light: '{colors.primary.300}', _dark: '{colors.primary.700}' }
    },
    solid: {
      value: { _light: '{colors.primary.600}', _dark: '{colors.primary.600}' }
    },
    focusRing: {
      value: { _light: '{colors.primary.400}', _dark: '{colors.primary.400}' }
    }
  },
  secondary: {
    contrast: {
      value: { _light: 'white', _dark: 'white' }
    },
    fg: {
      value: {
        _light: '{colors.secondary.700}',
        _dark: '{colors.secondary.300}'
      }
    },
    subtle: {
      value: {
        _light: '{colors.secondary.100}',
        _dark: '{colors.secondary.900}'
      }
    },
    muted: {
      value: {
        _light: '{colors.secondary.200}',
        _dark: '{colors.secondary.800}'
      }
    },
    emphasized: {
      value: {
        _light: '{colors.secondary.300}',
        _dark: '{colors.secondary.700}'
      }
    },
    solid: {
      value: {
        _light: '{colors.secondary.600}',
        _dark: '{colors.secondary.600}'
      }
    },
    focusRing: {
      value: {
        _light: '{colors.secondary.400}',
        _dark: '{colors.secondary.400}'
      }
    }
  },
  tertiary: {
    contrast: {
      value: { _light: 'white', _dark: 'white' }
    },
    fg: {
      value: { _light: '{colors.tertiary.700}', _dark: '{colors.tertiary.300}' }
    },
    subtle: {
      value: { _light: '{colors.tertiary.100}', _dark: '{colors.tertiary.900}' }
    },
    muted: {
      value: { _light: '{colors.tertiary.200}', _dark: '{colors.tertiary.800}' }
    },
    emphasized: {
      value: { _light: '{colors.tertiary.300}', _dark: '{colors.tertiary.700}' }
    },
    solid: {
      value: { _light: '{colors.tertiary.600}', _dark: '{colors.tertiary.600}' }
    },
    focusRing: {
      value: { _light: '{colors.tertiary.400}', _dark: '{colors.tertiary.400}' }
    }
  },
  quaternary: {
    contrast: {
      value: { _light: 'black', _dark: 'black' }
    },
    fg: {
      value: {
        _light: '{colors.quaternary.800}',
        _dark: '{colors.quaternary.300}'
      }
    },
    subtle: {
      value: {
        _light: '{colors.quaternary.100}',
        _dark: '{colors.quaternary.900}'
      }
    },
    muted: {
      value: {
        _light: '{colors.quaternary.200}',
        _dark: '{colors.quaternary.800}'
      }
    },
    emphasized: {
      value: {
        _light: '{colors.quaternary.300}',
        _dark: '{colors.quaternary.700}'
      }
    },
    solid: {
      value: {
        _light: '{colors.quaternary.300}',
        _dark: '{colors.quaternary.300}'
      }
    },
    focusRing: {
      value: {
        _light: '{colors.quaternary.400}',
        _dark: '{colors.quaternary.400}'
      }
    }
  },
  info: {
    contrast: {
      value: { _light: 'white', _dark: 'white' }
    },
    fg: { value: { _light: '{colors.info.700}', _dark: '{colors.info.300}' } },
    subtle: {
      value: { _light: '{colors.info.100}', _dark: '{colors.info.900}' }
    },
    muted: {
      value: { _light: '{colors.info.200}', _dark: '{colors.info.800}' }
    },
    emphasized: {
      value: { _light: '{colors.info.300}', _dark: '{colors.info.700}' }
    },
    solid: {
      value: { _light: '{colors.info.600}', _dark: '{colors.info.600}' }
    },
    focusRing: {
      value: { _light: '{colors.info.400}', _dark: '{colors.info.400}' }
    }
  },
  success: {
    contrast: {
      value: { _light: 'white', _dark: 'white' }
    },
    fg: {
      value: { _light: '{colors.success.700}', _dark: '{colors.success.300}' }
    },
    subtle: {
      value: { _light: '{colors.success.100}', _dark: '{colors.success.900}' }
    },
    muted: {
      value: { _light: '{colors.success.200}', _dark: '{colors.success.800}' }
    },
    emphasized: {
      value: { _light: '{colors.success.300}', _dark: '{colors.success.700}' }
    },
    solid: {
      value: { _light: '{colors.success.600}', _dark: '{colors.success.600}' }
    },
    focusRing: {
      value: { _light: '{colors.success.400}', _dark: '{colors.success.400}' }
    }
  },
  warning: {
    contrast: {
      value: { _light: 'white', _dark: 'black' }
    },
    fg: {
      value: { _light: '{colors.warning.700}', _dark: '{colors.warning.300}' }
    },
    subtle: {
      value: { _light: '{colors.warning.100}', _dark: '{colors.warning.900}' }
    },
    muted: {
      value: { _light: '{colors.warning.200}', _dark: '{colors.warning.800}' }
    },
    emphasized: {
      value: { _light: '{colors.warning.300}', _dark: '{colors.warning.700}' }
    },
    solid: {
      value: { _light: '{colors.warning.600}', _dark: '{colors.warning.500}' }
    },
    focusRing: {
      value: { _light: '{colors.warning.400}', _dark: '{colors.warning.400}' }
    }
  },
  error: {
    contrast: {
      value: { _light: 'white', _dark: 'white' }
    },
    fg: {
      value: { _light: '{colors.error.700}', _dark: '{colors.error.300}' }
    },
    subtle: {
      value: { _light: '{colors.error.100}', _dark: '{colors.error.900}' }
    },
    muted: {
      value: { _light: '{colors.error.200}', _dark: '{colors.error.800}' }
    },
    emphasized: {
      value: { _light: '{colors.error.300}', _dark: '{colors.error.700}' }
    },
    solid: {
      value: { _light: '{colors.error.600}', _dark: '{colors.error.600}' }
    },
    focusRing: {
      value: { _light: '{colors.error.400}', _dark: '{colors.error.400}' }
    }
  },
  attention: {
    contrast: {
      value: { _light: 'white', _dark: 'white' }
    },
    fg: {
      value: {
        _light: '{colors.attention.700}',
        _dark: '{colors.attention.300}'
      }
    },
    subtle: {
      value: {
        _light: '{colors.attention.100}',
        _dark: '{colors.attention.900}'
      }
    },
    muted: {
      value: {
        _light: '{colors.attention.200}',
        _dark: '{colors.attention.800}'
      }
    },
    emphasized: {
      value: {
        _light: '{colors.attention.300}',
        _dark: '{colors.attention.700}'
      }
    },
    solid: {
      value: {
        _light: '{colors.attention.600}',
        _dark: '{colors.attention.600}'
      }
    },
    focusRing: {
      value: {
        _light: '{colors.attention.400}',
        _dark: '{colors.attention.400}'
      }
    }
  }
};
