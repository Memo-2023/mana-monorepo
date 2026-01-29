import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5111,
		strictPort: true,
	},
	ssr: {
		noExternal: [
			'@manacore/shared-icons',
			'@manacore/shared-ui',
			'@manacore/shared-tailwind',
			'@manacore/shared-theme',
			'@manacore/shared-theme-ui',
			'@manacore/shared-auth',
			'@manacore/shared-auth-ui',
			'@manacore/shared-branding',
		],
	},
	optimizeDeps: {
		exclude: [
			'@manacore/shared-icons',
			'@manacore/shared-ui',
			'@manacore/shared-tailwind',
			'@manacore/shared-theme',
			'@manacore/shared-theme-ui',
			'@manacore/shared-auth',
			'@manacore/shared-auth-ui',
			'@manacore/shared-branding',
		],
	},
});
