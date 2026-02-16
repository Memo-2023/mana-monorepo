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
				name: 'Planta - Pflanzenpflege',
				shortName: 'Planta',
				description: 'Pflanzenpflege und -identifikation',
				themeColor: '#22c55e',
			})
		),
	],
	server: {
		port: 5191,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, '@planta/shared'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, '@planta/shared'],
	},
});
