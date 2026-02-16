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
				name: 'NutriPhi - Ernährungstracker',
				shortName: 'NutriPhi',
				description: 'KI-gestützte Ernährungsverfolgung',
				themeColor: '#22c55e',
			})
		),
	],
	server: {
		port: 5180,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, '@nutriphi/shared'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, '@nutriphi/shared'],
	},
});
