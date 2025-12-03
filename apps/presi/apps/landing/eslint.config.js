// @ts-check
import { baseConfig, typescriptConfig, prettierConfig } from '@manacore/eslint-config';

export default [
	{
		ignores: ['dist/**', '.astro/**', 'node_modules/**'],
	},
	...baseConfig,
	...typescriptConfig,
	...prettierConfig,
];
