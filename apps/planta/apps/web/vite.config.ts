import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';

const baseConfig = createViteConfig({
	port: 5191,
	additionalPackages: ['@planta/shared'],
});

export default defineConfig(
	mergeViteConfig(baseConfig, {
		plugins: [tailwindcss(), sveltekit()],
	})
);
