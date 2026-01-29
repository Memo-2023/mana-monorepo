import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';

const baseConfig = createViteConfig({
	port: 5180,
	additionalPackages: ['@matrix/shared'],
});

export default defineConfig(
	mergeViteConfig(baseConfig, {
		plugins: [tailwindcss(), sveltekit()],
		server: {
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
		worker: {
			format: 'es',
		},
		build: {
			target: 'esnext',
		},
	})
);
