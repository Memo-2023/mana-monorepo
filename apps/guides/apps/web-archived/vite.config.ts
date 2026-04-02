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
				name: 'Guides - Schritt-für-Schritt Anleitungen',
				shortName: 'Guides',
				description: 'Erstelle und führe Schritt-für-Schritt Anleitungen, Playbooks und Lernpfade aus',
				themeColor: '#0d9488',
				devEnabled: false,
				shortcuts: [
					{
						name: 'Neue Anleitung',
						short_name: 'Neu',
						description: 'Neue Anleitung erstellen',
						url: '/?action=new',
					},
				],
			})
		),
	],
	server: {
		port: 5200,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES],
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
