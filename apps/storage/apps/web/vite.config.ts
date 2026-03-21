/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'Storage - Cloud Speicher',
				shortName: 'Storage',
				description: 'Cloud-Dateispeicher mit Offline-Unterstützung',
				themeColor: '#64748b',
				preset: 'full',
				shortcuts: [
					{
						name: 'Meine Dateien',
						short_name: 'Dateien',
						description: 'Dateien und Ordner öffnen',
						url: '/files',
					},
					{
						name: 'Suche',
						short_name: 'Suche',
						description: 'Dateien durchsuchen',
						url: '/search',
					},
					{
						name: 'Favoriten',
						short_name: 'Favoriten',
						description: 'Favorisierte Dateien anzeigen',
						url: '/favorites',
					},
				],
			})
		),
	],
	server: {
		port: 5185,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, 'lucide-svelte'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, 'lucide-svelte'],
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts'],
		globals: true,
	},
	define: {
		...getBuildDefines(),
	},
});
