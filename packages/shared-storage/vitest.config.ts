import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		environment: 'node',
		globals: true,
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'json-summary'],
			reportsDirectory: './coverage',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.{test,spec}.ts', 'src/**/*.d.ts', 'src/**/index.ts'],
		},
	},
});
