/**
 * NestJS Backend ESLint configuration
 *
 * Provides TypeScript linting for NestJS backend applications.
 * Backends should have higher code quality standards since they handle
 * business logic, database operations, and API security.
 */
import tseslint from 'typescript-eslint';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export const nestjsConfig = [
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
			},
			globals: {
				...globals.node,
				...globals.jest,
			},
		},
		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},
		rules: {
			// ============================================
			// ERRORS - Backend-specific strictness
			// ============================================

			// Stricter unused vars for cleaner code
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],

			// ============================================
			// WARNINGS - Best practices for backends
			// ============================================

			// Allow any but flag it - APIs should be typed
			'@typescript-eslint/no-explicit-any': 'warn',

			// Type safety recommendations
			'@typescript-eslint/no-non-null-assertion': 'warn',

			// Encourage explicit return types for public APIs
			'@typescript-eslint/explicit-function-return-type': [
				'warn',
				{
					allowExpressions: true,
					allowTypedFunctionExpressions: true,
					allowHigherOrderFunctions: true,
					allowDirectConstAssertionInArrowFunctions: true,
				},
			],

			// Encourage explicit module boundaries
			'@typescript-eslint/explicit-module-boundary-types': [
				'warn',
				{
					allowArgumentsExplicitlyTypedAsAny: true,
					allowDirectConstAssertionInArrowFunctions: true,
					allowHigherOrderFunctions: true,
					allowTypedFunctionExpressions: true,
				},
			],

			// Consistent type imports
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{
					prefer: 'type-imports',
					fixStyle: 'inline-type-imports',
				},
			],

			// No console in production code (use logger)
			'no-console': 'warn',

			// ============================================
			// OFF - NestJS-specific exceptions
			// ============================================

			// NestJS uses decorators and DI patterns
			'@typescript-eslint/no-empty-function': 'off', // Empty lifecycle hooks are common

			// Class methods may not use 'this' in NestJS (pure service methods)
			'class-methods-use-this': 'off',

			// NestJS interface names sometimes have 'I' prefix by convention
			'@typescript-eslint/interface-name-prefix': 'off',

			// Base rule off (TS version handles)
			'no-unused-vars': 'off',

			// Allow require for dynamic imports in NestJS
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		// Test files have relaxed rules
		files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'no-console': 'off',
		},
	},
];

export default nestjsConfig;
