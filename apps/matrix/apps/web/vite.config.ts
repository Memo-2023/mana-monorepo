import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5180,
		strictPort: true,
	},
	define: {
		global: 'globalThis',
	},
	optimizeDeps: {
		include: ['buffer', 'events'],
		esbuildOptions: {
			define: {
				global: 'globalThis',
			},
		},
	},
	ssr: {
		noExternal: ['@manacore/shared-*', '@matrix/shared'],
	},
});
