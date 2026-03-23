import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'node',
	},
	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
			'$app/environment': resolve('./src/test/mocks/app-environment.ts'),
		},
	},
});
