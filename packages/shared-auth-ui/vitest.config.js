import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		environment: 'node',
		globals: true,
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,
	},
});
