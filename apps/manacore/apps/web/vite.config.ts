import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@manacore/shared-vite-config';

/** App-specific shared packages used by migrated modules */
const APP_SHARED_PACKAGES = ['@clock/shared', '@zitare/content', '@calc/shared'];

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
		noExternal: [...MANACORE_SHARED_PACKAGES, ...APP_SHARED_PACKAGES],
		external: ['@mlc-ai/web-llm'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, ...APP_SHARED_PACKAGES],
	},
	define: {
		...getBuildDefines(),
	},
});
