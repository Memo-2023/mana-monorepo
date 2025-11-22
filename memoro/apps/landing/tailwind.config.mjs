/** @type {import('tailwindcss').Config} */
import { theme } from './src/theme';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      ...theme,
      fontSize: {
        // Hero and display text sizes
        'hero': ['3.75rem', { lineHeight: '1.1', fontWeight: '700' }], // 60px
        'hero-mobile': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }], // 40px
        'display': ['3rem', { lineHeight: '1.2', fontWeight: '700' }], // 48px
        'display-mobile': ['2rem', { lineHeight: '1.2', fontWeight: '700' }], // 32px
        
        // Heading sizes
        'heading': ['2.25rem', { lineHeight: '1.3', fontWeight: '600' }], // 36px
        'heading-mobile': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }], // 30px
        'subheading': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }], // 24px
        'subheading-mobile': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }], // 20px
        
        // Additional heading sizes
        'title': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }], // 30px
        'title-mobile': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }], // 24px
        'subtitle': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }], // 20px
        'subtitle-mobile': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }], // 18px
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: theme.colors.text.secondary,
            h1: {
              color: theme.colors.text.primary,
              fontWeight: '700',
            },
            h2: {
              color: theme.colors.text.primary,
              fontWeight: '600',
            },
            h3: {
              color: theme.colors.text.primary,
              fontWeight: '600',
            },
            h4: {
              color: theme.colors.text.primary,
              fontWeight: '600',
            },
            h5: {
              color: theme.colors.text.primary,
              fontWeight: '600',
            },
            h6: {
              color: theme.colors.text.primary,
              fontWeight: '600',
            },
            strong: {
              color: theme.colors.text.primary,
              fontWeight: '600',
            },
            em: {
              color: theme.colors.text.secondary,
            },
            a: {
              color: theme.colors.primary.DEFAULT,
              textDecoration: 'none',
              '&:hover': {
                color: theme.colors.primary.hover,
                textDecoration: 'underline',
              },
            },
            p: {
              color: theme.colors.text.secondary,
              lineHeight: '1.75',
            },
            ul: {
              color: theme.colors.text.secondary,
            },
            ol: {
              color: theme.colors.text.secondary,
            },
            li: {
              color: theme.colors.text.secondary,
              '&::marker': {
                color: theme.colors.primary.DEFAULT,
              },
            },
            blockquote: {
              color: theme.colors.text.secondary,
              borderLeftColor: theme.colors.primary.DEFAULT,
              borderLeftWidth: '4px',
              backgroundColor: theme.colors.background.cardHover,
              fontStyle: 'italic',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            },
            code: {
              color: theme.colors.primary.DEFAULT,
              backgroundColor: theme.colors.background.cardHover,
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: theme.colors.background.cardHover,
              borderColor: theme.colors.border.DEFAULT,
              borderWidth: '1px',
              color: theme.colors.text.secondary,
            },
            hr: {
              borderColor: theme.colors.border.DEFAULT,
            },
            table: {
              color: theme.colors.text.secondary,
            },
            thead: {
              borderBottomColor: theme.colors.border.DEFAULT,
            },
            th: {
              color: theme.colors.text.primary,
              fontWeight: '600',
            },
            td: {
              color: theme.colors.text.secondary,
            },
            img: {
              borderRadius: '0.5rem',
              borderWidth: '1px',
              borderColor: theme.colors.border.DEFAULT,
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities, addVariant }) {
      addUtilities({
        '.scrollbar-none': {
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.bg-gradient-radial': {
          'background-image': 'radial-gradient(circle, var(--tw-gradient-stops))',
        },
      });
      // Add group-open variant for details element
      addVariant('group-open', ':merge(.group)[open] &');
    },
  ],
}
