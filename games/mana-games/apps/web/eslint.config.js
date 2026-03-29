// @ts-check
import {
	baseConfig,
	typescriptConfig,
	svelteConfig,
	prettierConfig,
} from '@manacore/eslint-config';

export default [
	{
		ignores: [
			'dist/**',
			'.svelte-kit/**',
			'.astro/**',
			'node_modules/**',
			'**/stats-integration-template.js',
		],
	},
	...baseConfig,
	...typescriptConfig,
	...svelteConfig,
	...prettierConfig,
];
