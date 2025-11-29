import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			$tests: path.resolve('./src/tests'),
		},
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Vendor chunk für große Bibliotheken
					if (id.includes('node_modules')) {
						if (id.includes('pocketbase')) return 'pocketbase';
						if (id.includes('stripe')) return 'stripe';
						if (id.includes('lucide-svelte')) return 'icons';
						if (id.includes('svelte-sonner')) return 'ui';
						return 'vendor';
					}
					// Component chunks für große Komponenten
					if (id.includes('src/lib/components/cards')) return 'cards';
					if (id.includes('src/lib/components/links')) return 'links';
					if (id.includes('src/paraglide')) return 'i18n';
				},
			},
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/**',
				'src/tests/**',
				'**/*.d.ts',
				'build/**',
				'.svelte-kit/**',
				'src/paraglide/**',
				'src/app.html',
			],
			thresholds: {
				global: {
					branches: 70,
					functions: 70,
					lines: 70,
					statements: 70,
				},
			},
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }],
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts', './src/tests/setup.ts'],
				},
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['./src/tests/setup.ts'],
				},
			},
		],
	},
});
