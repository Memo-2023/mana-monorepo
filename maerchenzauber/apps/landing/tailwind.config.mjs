/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary colors from mobile app
        'yellow': {
          'dark': '#6D5B00',
          'light': '#F8D62B',
        },
        // Background colors
        'bg': {
          'primary': '#181818',
          'secondary': '#333333',
          'card': '#2C2C2C',
          'input': '#333333',
          'dark': '#121212',
          'darker': '#1a1a1a',
        },
        // Text colors
        'text': {
          'primary': '#FFFFFF',
          'secondary': '#999999',
          'muted': '#666666',
          'light': '#CCCCCC',
        },
        // UI elements
        'border': '#444444',
      },
      fontFamily: {
        'grandstander': ['Grandstander', 'cursive', 'system-ui'],
        'sans': ['Grandstander', 'cursive', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'card': '0 4px 8px rgba(0, 0, 0, 0.3)',
        'button': 'inset 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 -2px 0 rgba(0, 0, 0, 0.24)',
      },
      backgroundImage: {
        'gradient-overlay': 'linear-gradient(135deg, rgba(109,91,0,0.2), rgba(248,214,43,0.1))',
        'gradient-card': 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.8))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(248, 214, 43, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(248, 214, 43, 0.8)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}