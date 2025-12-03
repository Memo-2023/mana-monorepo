/**
 * Base ESLint configuration for all JavaScript/TypeScript projects
 *
 * This provides foundational rules that apply to all code:
 * - Core JavaScript best practices
 * - Common error prevention
 * - Code quality fundamentals
 */
import js from '@eslint/js';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2022,
			},
		},
		rules: {
			// ============================================
			// ERRORS - Correctness issues that must be fixed
			// ============================================

			// Prevent actual bugs
			'no-undef': 'error',
			'no-dupe-keys': 'error',
			'no-dupe-args': 'error',
			'no-duplicate-case': 'error',
			'no-unreachable': 'error',
			'no-constant-condition': 'error',
			'no-empty': ['error', { allowEmptyCatch: true }],

			// Prevent common mistakes
			'no-cond-assign': ['error', 'except-parens'],
			'no-irregular-whitespace': 'error',
			'no-unexpected-multiline': 'error',
			'use-isnan': 'error',
			'valid-typeof': 'error',

			// ============================================
			// WARNINGS - Best practices, fix when convenient
			// ============================================

			// Code quality suggestions
			'no-console': 'warn',
			'no-debugger': 'warn',
			'no-alert': 'warn',
			'prefer-const': 'warn',
			'no-var': 'warn',
			eqeqeq: ['warn', 'smart'],

			// ============================================
			// OFF - Handled by TypeScript or Prettier
			// ============================================

			// TypeScript handles these better
			'no-unused-vars': 'off', // @typescript-eslint/no-unused-vars handles this
			'no-redeclare': 'off', // @typescript-eslint/no-redeclare handles this

			// Prettier handles formatting
			indent: 'off',
			semi: 'off',
			quotes: 'off',
			'comma-dangle': 'off',
			'arrow-parens': 'off',
			'max-len': 'off',
		},
	},
];

export default baseConfig;
