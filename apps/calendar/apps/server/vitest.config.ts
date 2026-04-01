import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.test.ts'],
		setupFiles: ['./src/test-setup.ts'],
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,
	},
});
