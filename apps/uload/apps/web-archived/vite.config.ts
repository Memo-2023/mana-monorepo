import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createPWAConfig } from '@manacore/shared-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA(
			createPWAConfig({
				name: 'uLoad - URL Shortener',
				shortName: 'uLoad',
				description: 'Kürze URLs, tracke Klicks und verwalte deine Links',
				themeColor: '#6366f1',
				devEnabled: false,
				shortcuts: [
					{
						name: 'Neuer Link',
						short_name: 'Neu',
						description: 'Neuen Link erstellen',
						url: '/my/links?action=new',
					},
					{
						name: 'Analytics',
						short_name: 'Analytics',
						description: 'Link-Analytics anzeigen',
						url: '/my/analytics',
					},
				],
			})
		),
	],
});
