import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
import { getBuildDefines } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Inventar',
				short_name: 'Inventar',
				description: 'Konfigurierbare Inventarverwaltung',
				theme_color: '#f59e0b',
				background_color: '#0f172a',
				display: 'standalone',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
				shortcuts: [
					{
						name: 'Neues Item',
						short_name: 'Neues Item',
						url: '/items?action=new',
						icons: [{ src: 'icons/icon.svg', sizes: '96x96' }],
					},
					{
						name: 'Sammlungen',
						short_name: 'Sammlungen',
						url: '/collections',
						icons: [{ src: 'icons/icon.svg', sizes: '96x96' }],
					},
				],
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
			},
		}),
	],
	server: {
		port: 5190,
		strictPort: true,
	},
	preview: {
		port: 5190,
	},
	define: getBuildDefines(),
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
	},
});
