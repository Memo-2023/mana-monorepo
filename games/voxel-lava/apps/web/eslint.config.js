// @ts-check
import {
	baseConfig,
	typescriptConfig,
	svelteConfig,
	prettierConfig,
} from '@manacore/eslint-config';

export default [
	{
		ignores: ['dist/**', '.svelte-kit/**', 'node_modules/**'],
	},
	...baseConfig,
	...typescriptConfig,
	...svelteConfig,
	...prettierConfig,
];
