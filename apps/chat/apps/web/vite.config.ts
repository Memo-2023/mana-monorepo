import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@manacore/shared-vite-config';
import { createPWAConfig } from '@manacore/shared-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Chat - KI Assistent',
				shortName: 'Chat',
				description: 'KI-Chat mit verschiedenen Modellen',
				themeColor: '#8b5cf6',
				preset: 'standard',
			})
		),
	],
	server: {
		port: 5174,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, 'marked'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, 'marked'],
	},
	define: {
		...getBuildDefines(),
	},
});
