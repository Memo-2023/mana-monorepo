import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://cards.app',
	integrations: [tailwind(), sitemap()],
	vite: {
		ssr: {
			noExternal: ['@mana/shared-landing-ui'],
		},
	},
});
