import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@mana/shared-pwa';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@mana/shared-vite-config';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Arcade - Browser-Spiele',
				shortName: 'Arcade',
				description: 'AI-powered Browser-Games Plattform',
				themeColor: '#00ff88',
				preset: 'minimal',
			})
		),
	],
	server: {
		port: 5210,
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
