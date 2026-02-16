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
				name: 'ManaCore',
				shortName: 'ManaCore',
				description: 'ManaCore App Ecosystem',
				themeColor: '#6366f1',
			})
		),
	],
	server: {
		port: 5173,
		strictPort: true,
	},
	preview: {
		port: 4173,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES],
	},
});
