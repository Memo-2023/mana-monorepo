// @ts-check
import { baseConfig, typescriptConfig, reactConfig, prettierConfig } from '@manacore/eslint-config';

export default [
	{
		ignores: [
			'dist/**',
			'.expo/**',
			'node_modules/**',
			'android/**',
			'ios/**',
			'metro.config.js',
			'tailwind.config.js',
		],
	},
	...baseConfig,
	...typescriptConfig,
	...reactConfig,
	...prettierConfig,
];
