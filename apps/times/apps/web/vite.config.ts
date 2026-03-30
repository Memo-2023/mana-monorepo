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
				name: 'Times',
				short_name: 'Times',
				description: 'Zeiterfassung & Timetracking',
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
						name: 'Timer starten',
						short_name: 'Timer',
						url: '/?action=start',
						icons: [{ src: 'icons/icon.svg', sizes: '96x96' }],
					},
					{
						name: 'Neuer Eintrag',
						short_name: 'Eintrag',
						url: '/entries?action=new',
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
		port: 5197,
		strictPort: true,
	},
	preview: {
		port: 5197,
	},
	define: getBuildDefines(),
});
