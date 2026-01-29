import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';
import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';

const baseConfig = createViteConfig({
	port: 5178,
});

export default defineConfig(
	mergeViteConfig(baseConfig, {
		plugins: [tailwindcss(), sveltekit()],
		server: {
			fs: {
				allow: [
					path.resolve(__dirname, '../../../../node_modules'),
					path.resolve(__dirname, 'src'),
					path.resolve(__dirname, '.svelte-kit'),
					path.resolve(__dirname, 'node_modules'),
					path.resolve(__dirname, '../../node_modules'),
				],
			},
		},
	})
);
