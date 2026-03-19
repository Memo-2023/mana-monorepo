import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://mukke.app',
	integrations: [sitemap()],
});
