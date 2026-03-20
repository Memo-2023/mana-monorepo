import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Mukke - Music Workspace',
				shortName: 'Mukke',
				description: 'Music Workspace - Tracks, Lyrics & Player',
				themeColor: '#f97316',
			})
		),
	],
	server: {
		port: 5180,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, '@mukke/shared'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, '@mukke/shared'],
	},
	define: {
		...getBuildDefines(),
	},
});
