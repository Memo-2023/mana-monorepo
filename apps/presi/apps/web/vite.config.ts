import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		port: 5178,
		strictPort: true,
		fs: {
			allow: [
				// Allow serving files from the monorepo root node_modules
				path.resolve(__dirname, '../../../../node_modules'),
				// Default allowed paths
				path.resolve(__dirname, 'src'),
				path.resolve(__dirname, '.svelte-kit'),
				path.resolve(__dirname, 'node_modules'),
				path.resolve(__dirname, '../../node_modules'),
			],
		},
	},
	ssr: {
		noExternal: [
			'@manacore/shared-icons',
			'@manacore/shared-ui',
			'@manacore/shared-theme',
			'@manacore/shared-theme-ui',
			'@manacore/shared-auth-ui',
			'@manacore/shared-branding',
		],
	},
	optimizeDeps: {
		exclude: [
			'@manacore/shared-icons',
			'@manacore/shared-ui',
			'@manacore/shared-theme',
			'@manacore/shared-theme-ui',
			'@manacore/shared-auth-ui',
			'@manacore/shared-branding',
		],
	},
});
