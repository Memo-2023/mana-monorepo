import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Presi - Präsentationen',
				shortName: 'Presi',
				description: 'Präsentationen erstellen und halten',
				themeColor: '#a855f7',
				preset: 'full',
			})
		),
	],
	server: {
		port: 5178,
		strictPort: true,
		fs: {
			allow: [
				path.resolve(__dirname, '../../../../node_modules'),
				path.resolve(__dirname, 'src'),
				path.resolve(__dirname, '.svelte-kit'),
				path.resolve(__dirname, 'node_modules'),
				path.resolve(__dirname, '../../node_modules'),
			],
		},
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES],
	},
});
