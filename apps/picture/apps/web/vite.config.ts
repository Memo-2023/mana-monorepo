import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5175,
		strictPort: true,
	},
	ssr: {
		// Process @manacore packages that contain .svelte.ts files with runes
		noExternal: ['@manacore/shared-theme', '@manacore/shared-auth'],
	},
});
