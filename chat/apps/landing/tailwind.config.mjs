/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../../packages/shared-landing-ui/src/**/*.{astro,html,js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // ManaChat Sky Blue Theme
        primary: {
          DEFAULT: '#0ea5e9',
          hover: '#38bdf8',
          glow: 'rgba(14, 165, 233, 0.3)'
        },
        background: {
          page: '#0c1929',
          card: '#142236',
          'card-hover': '#1e3a50'
        },
        text: {
          primary: '#f9fafb',
          secondary: '#d1d5db',
          muted: '#6b7280'
        },
        border: {
          DEFAULT: '#1e3a50',
          hover: '#2d5a73'
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
