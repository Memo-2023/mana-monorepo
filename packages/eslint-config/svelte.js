/**
 * Svelte/SvelteKit ESLint configuration
 *
 * Provides Svelte-specific linting rules for SvelteKit web applications.
 * Includes support for Svelte 5 runes syntax.
 */
import sveltePlugin from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export const svelteConfig = [
	...sveltePlugin.configs['flat/recommended'],
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: sveltePlugin.parser,
			parserOptions: {
				parser: tseslint.parser,
				projectService: true,
				extraFileExtensions: ['.svelte'],
			},
		},
		rules: {
			// ============================================
			// ERRORS - Svelte-specific correctness
			// ============================================

			// Compilation errors
			'svelte/valid-compile': 'error',

			// Prevent common Svelte mistakes
			'svelte/no-dom-manipulating': 'error',
			'svelte/no-dupe-else-if-blocks': 'error',
			'svelte/no-dupe-on-directives': 'error',
			'svelte/no-dupe-style-properties': 'error',
			'svelte/no-dupe-use-directives': 'error',
			'svelte/no-dynamic-slot-name': 'error',
			'svelte/no-not-function-handler': 'error',
			'svelte/no-object-in-text-mustaches': 'error',
			'svelte/no-shorthand-style-property-overrides': 'error',
			'svelte/no-unknown-style-directive-property': 'error',
			'svelte/require-store-callbacks-use-set-param': 'error',

			// ============================================
			// WARNINGS - Best practices
			// ============================================

			// Code quality
			'svelte/no-at-html-tags': 'warn', // XSS risk, but sometimes needed
			'svelte/no-reactive-functions': 'warn',
			'svelte/no-reactive-literals': 'warn',
			'svelte/no-unused-svelte-ignore': 'warn',
			'svelte/prefer-class-directive': 'warn',
			'svelte/prefer-style-directive': 'warn',
			'svelte/require-each-key': 'warn',

			// Svelte 5 runes
			'svelte/valid-each-key': 'warn',

			// ============================================
			// OFF - Too strict or not applicable
			// ============================================

			// Allow inline handlers for simple cases
			'svelte/no-inline-styles': 'off',

			// TypeScript handles these in .svelte files
			'no-undef': 'off', // $state, $derived, etc. are globals in Svelte 5

			// Allow self-closing for components
			'svelte/html-self-closing': 'off',
		},
	},
	{
		// Special rules for SvelteKit files
		files: [
			'**/+page.ts',
			'**/+page.server.ts',
			'**/+layout.ts',
			'**/+layout.server.ts',
			'**/+server.ts',
		],
		rules: {
			// SvelteKit load functions often have specific signatures
			'@typescript-eslint/explicit-function-return-type': 'off',
		},
	},
];

export default svelteConfig;
