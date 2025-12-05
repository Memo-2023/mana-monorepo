// @ts-check
import { baseConfig, typescriptConfig, reactConfig, prettierConfig } from '@manacore/eslint-config';

export default [
	{
		ignores: ['dist/**', '.expo/**', 'node_modules/**', 'android/**', 'ios/**'],
	},
	...baseConfig,
	...typescriptConfig,
	...reactConfig,
	...prettierConfig,
];
