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
				name: 'Calc - Taschenrechner',
				shortName: 'Calc',
				description: 'Taschenrechner, Einheiten & Finanzen',
				themeColor: '#ec4899',
				preset: 'minimal',
			})
		),
	],
	server: {
		port: 5198,
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
