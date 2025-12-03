// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Root ESLint config for the monorepo.
 * Individual projects can override with their own eslint.config.* files.
 */
export default tseslint.config(
	// Global ignores
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/.svelte-kit/**',
			'**/.expo/**',
			'**/.next/**',
			'**/coverage/**',
			'**/apps-archived/**',
			// Ignore projects with their own ESLint configs
			'apps/manadeck/apps/mobile/**',
			'apps/picture/apps/mobile/**',
			'apps/picture/apps/web/**',
			'games/voxel-lava/apps/web/**',
		],
	},
	// Base JavaScript rules
	eslint.configs.recommended,
	// TypeScript rules (without type-checking for speed)
	...tseslint.configs.recommended,
	// Prettier integration
	eslintPluginPrettierRecommended,
	// Global settings
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
				...globals.es2022,
			},
			ecmaVersion: 2022,
			sourceType: 'module',
		},
	},
	// TypeScript-specific rules
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
		},
	},
	// JavaScript-specific rules
	{
		files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
		rules: {
			'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
		},
	}
);
