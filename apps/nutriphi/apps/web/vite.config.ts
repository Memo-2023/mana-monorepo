import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: [
			'@manacore/shared-theme',
			'@manacore/shared-auth-ui',
			'@manacore/shared-branding',
			'@manacore/shared-ui',
			'@manacore/shared-theme-ui',
			'@manacore/shared-i18n',
		],
	},
	optimizeDeps: {
		exclude: [
			'@manacore/shared-theme',
			'@manacore/shared-auth-ui',
			'@manacore/shared-branding',
			'@manacore/shared-ui',
			'@manacore/shared-theme-ui',
			'@manacore/shared-i18n',
		],
	},
});
