import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Zitare - Zitate',
				shortName: 'Zitare',
				description: 'Tägliche Inspiration und Zitate',
				themeColor: '#f59e0b',
			})
		),
	],
	server: {
		port: 5107,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, '@zitare/content'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, '@zitare/content'],
	},
	define: {
		...getBuildDefines(),
	},
});
