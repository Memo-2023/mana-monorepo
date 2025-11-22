import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://manacore.ai',
  integrations: [
    react(), 
    tailwind(),
    icon()
  ],
  output: 'static',
  build: {
    inlineStylesheets: 'auto'
  },
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en', 'it'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});