import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'CityCorners - Konstanz Guide',
				shortName: 'CityCorners',
				description: 'Entdecke Sehenswürdigkeiten, Restaurants, Museen und Läden in Konstanz',
				themeColor: '#2563eb',
				categories: ['travel', 'lifestyle'],
			})
		),
	],
	server: {
		port: 5196,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES],
	},
	define: {
		...getBuildDefines(),
	},
});
