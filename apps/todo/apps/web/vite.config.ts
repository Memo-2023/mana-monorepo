import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Todo - Aufgaben',
				shortName: 'Todo',
				description: 'Aufgaben und Projekte verwalten',
				themeColor: '#10b981',
			})
		),
	],
	server: {
		port: 5188,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, '@todo/shared'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, '@todo/shared'],
	},
});
