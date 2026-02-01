import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { MANACORE_SHARED_PACKAGES } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5187,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES],
	},
});
