// @ts-check
import {
	baseConfig,
	typescriptConfig,
	nestjsConfig,
	prettierConfig,
} from '@manacore/eslint-config';

export default [
	{
		ignores: ['dist/**', 'node_modules/**'],
	},
	...baseConfig,
	...typescriptConfig,
	...nestjsConfig,
	...prettierConfig,
];
