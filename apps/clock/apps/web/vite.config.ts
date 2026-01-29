import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';

const baseConfig = createViteConfig({
	port: 5187,
});

export default defineConfig(
	mergeViteConfig(baseConfig, {
		plugins: [sveltekit()],
	})
);
