/**
 * Prettier ESLint integration configuration
 *
 * Disables ESLint formatting rules that conflict with Prettier
 * and runs Prettier as an ESLint rule for unified formatting.
 */
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export const prettierConfig = [
	// Disable ESLint formatting rules that conflict with Prettier
	eslintConfigPrettier,
	{
		plugins: {
			prettier: eslintPluginPrettier,
		},
		rules: {
			// Run Prettier as an ESLint rule
			'prettier/prettier': [
				'warn',
				{
					// These should match .prettierrc.json
					useTabs: true,
					singleQuote: true,
					trailingComma: 'es5',
					printWidth: 100,
				},
				{
					usePrettierrc: true, // Also read from .prettierrc if present
				},
			],
		},
	},
];

export default prettierConfig;
