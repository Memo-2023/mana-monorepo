import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@mana/shared-pwa';
import { MANA_SHARED_PACKAGES, getBuildDefines } from '@mana/shared-vite-config';

/** App-specific shared packages used by migrated modules */
const APP_SHARED_PACKAGES = ['@zitare/content', '@calc/shared'];

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Mana',
				shortName: 'Mana',
				description: 'Mana App Ecosystem',
				themeColor: '#6366f1',
				registerType: 'prompt',
				preset: 'full',
				shortcuts: [
					{ name: 'Dashboard', short_name: 'Home', url: '/', description: 'Zum Dashboard' },
					{
						name: 'Neue Aufgabe',
						short_name: 'Aufgabe',
						url: '/todo',
						description: 'Neue Aufgabe erstellen',
					},
					{
						name: 'Kalender',
						short_name: 'Kalender',
						url: '/calendar',
						description: 'Kalender öffnen',
					},
					{ name: 'Chat', short_name: 'Chat', url: '/chat', description: 'Chat öffnen' },
				],
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
		noExternal: [...MANA_SHARED_PACKAGES, ...APP_SHARED_PACKAGES],
		external: ['@mlc-ai/web-llm'],
	},
	optimizeDeps: {
		exclude: [...MANA_SHARED_PACKAGES, ...APP_SHARED_PACKAGES],
	},
	define: {
		...getBuildDefines(),
	},
});
