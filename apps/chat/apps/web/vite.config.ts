import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		port: 5174,
		strictPort: true,
	},
	ssr: {
		noExternal: [
			'marked',
			'@manacore/shared-theme',
			'@manacore/shared-auth-ui',
			'@manacore/shared-branding',
			'@manacore/shared-ui',
			'@manacore/shared-theme-ui',
			'@manacore/shared-feedback-types',
			'@manacore/shared-feedback-service',
			'@manacore/shared-feedback-ui',
		],
	},
	optimizeDeps: {
		exclude: [
			'@manacore/shared-theme',
			'@manacore/shared-auth-ui',
			'@manacore/shared-branding',
			'@manacore/shared-ui',
			'@manacore/shared-theme-ui',
			'@manacore/shared-feedback-types',
			'@manacore/shared-feedback-service',
			'@manacore/shared-feedback-ui',
		],
	},
});
