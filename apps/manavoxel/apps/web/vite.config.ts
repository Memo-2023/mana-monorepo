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
				name: 'ManaVoxel - Pixel Worlds',
				shortName: 'ManaVoxel',
				description: 'Create and program detailed pixel worlds in your browser',
				themeColor: '#10b981',
				devEnabled: false,
				shortcuts: [
					{
						name: 'My Worlds',
						short_name: 'Worlds',
						description: 'Open your worlds',
						url: '/worlds',
					},
					{
						name: 'Discover',
						short_name: 'Discover',
						description: 'Discover community worlds',
						url: '/worlds?tab=discover',
					},
				],
			})
		),
	],
	server: {
		port: 5028,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, '@manavoxel/shared'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, '@manavoxel/shared'],
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
