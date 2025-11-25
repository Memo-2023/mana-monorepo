/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Nutriphi Fresh Green Theme
        primary: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
          glow: 'rgba(34, 197, 94, 0.3)'
        },
        background: {
          page: '#052e16',
          card: '#14532d',
          'card-hover': '#166534'
        },
        text: {
          primary: '#f9fafb',
          secondary: '#d1d5db',
          muted: '#6b7280'
        },
        border: {
          DEFAULT: '#166534',
          hover: '#15803d'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
};
