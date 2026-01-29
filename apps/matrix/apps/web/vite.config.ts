import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5180,
		strictPort: true,
		headers: {
			// Required for WASM module loading
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
	define: {
		global: 'globalThis',
	},
	optimizeDeps: {
		include: ['buffer', 'events'],
		// WASM modules cannot be pre-bundled
		exclude: ['@matrix-org/matrix-sdk-crypto-wasm'],
		esbuildOptions: {
			define: {
				global: 'globalThis',
			},
		},
	},
	ssr: {
		noExternal: ['@manacore/shared-*', '@matrix/shared'],
	},
	worker: {
		format: 'es',
	},
	build: {
		target: 'esnext',
	},
});
