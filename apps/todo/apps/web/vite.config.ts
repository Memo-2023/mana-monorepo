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
				name: 'Todo - Aufgabenverwaltung',
				shortName: 'Todo',
				description: 'Aufgaben und Projekte verwalten mit Kanban-Board, Subtasks und mehr',
				themeColor: '#8b5cf6',
				shortcuts: [
					{
						name: 'Neue Aufgabe',
						short_name: 'Neu',
						description: 'Neue Aufgabe erstellen',
						url: '/?action=new',
					},
					{
						name: 'Kanban Board',
						short_name: 'Kanban',
						description: 'Kanban-Ansicht öffnen',
						url: '/kanban',
					},
					{
						name: 'Einstellungen',
						short_name: 'Settings',
						description: 'App-Einstellungen öffnen',
						url: '/settings',
					},
				],
			})
		),
	],
	server: {
		port: 5188,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, '@todo/shared'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, '@todo/shared'],
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
