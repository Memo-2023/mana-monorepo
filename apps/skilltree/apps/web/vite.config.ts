import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5195,
		strictPort: true,
	},
	ssr: {
		noExternal: ['@manacore/shared-tailwind', '@manacore/shared-theme'],
	},
	optimizeDeps: {
		exclude: ['@manacore/shared-tailwind', '@manacore/shared-theme'],
	},
});
