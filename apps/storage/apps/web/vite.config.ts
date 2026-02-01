import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { MANACORE_SHARED_PACKAGES } from '@manacore/shared-vite-config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5185,
		strictPort: true,
	},
	ssr: {
		noExternal: [...MANACORE_SHARED_PACKAGES, 'lucide-svelte'],
	},
	optimizeDeps: {
		exclude: [...MANACORE_SHARED_PACKAGES, 'lucide-svelte'],
	},
});
