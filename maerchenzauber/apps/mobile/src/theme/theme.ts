export const theme = {
  colors: {
    yellow: {
      dark: '#6D5B00',
      light: '#F8D62B',
    },
    background: {
      primary: '#181818',
      secondary: '#333333',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#666666',
    },
    gray: {
      dark: '#333333',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
} as const;

export type Theme = typeof theme;
