import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';

const baseConfig = createViteConfig({
	port: 5173,
});

export default defineConfig(
	mergeViteConfig(baseConfig, {
		plugins: [tailwindcss(), sveltekit()],
		preview: {
			port: 4173,
			strictPort: true,
		},
	})
);
