/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Hier kannst du deine eigene Farbpalette definieren
      colors: {
        'primary': '#3b82f6',
        'secondary': '#10b981',
      },
    },
  },
  plugins: [],
}