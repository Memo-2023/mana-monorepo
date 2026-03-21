import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		tailwindcss() as any,
		sveltekit() as any,
		SvelteKitPWA(
			createPWAConfig({
				name: 'Picture - KI Bildgenerator',
				shortName: 'Picture',
				description: 'KI-gestützte Bildgenerierung',
				themeColor: '#ec4899',
			})
		) as any,
	],
	server: {
		port: 5175,
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
