const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

module.exports = [
	js.configs.recommended,
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2024,
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
				project: './tsconfig.json',
			},
			globals: {
				__dirname: 'readonly',
				__filename: 'readonly',
				Buffer: 'readonly',
				console: 'readonly',
				exports: 'writable',
				global: 'readonly',
				module: 'writable',
				process: 'readonly',
				require: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				setImmediate: 'readonly',
				clearImmediate: 'readonly',
				fetch: 'readonly',
				FormData: 'readonly',
				Headers: 'readonly',
				Request: 'readonly',
				Response: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				WebSocket: 'readonly',
				alert: 'readonly',
				document: 'readonly',
				window: 'readonly',
				navigator: 'readonly',
				React: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			'unused-imports': unusedImportsPlugin,
		},
		rules: {
			// Unused variables detection
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],

			// Unused imports detection and auto-fix
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],

			// React specific
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',

			// TypeScript specific
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-empty-function': 'warn',

			// General code quality
			'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
			'no-debugger': 'error',
			'no-duplicate-imports': 'error',
			'prefer-const': 'warn',
			'no-var': 'error',

			// Allow some patterns common in React Native
			'no-undef': 'off', // TypeScript handles this
			'no-empty': ['warn', { allowEmptyCatch: true }],
			'no-constant-condition': ['error', { checkLoops: false }],
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
	},
	{
		files: ['**/*.js'],
		rules: {
			'@typescript-eslint/no-var-requires': 'off',
		},
	},
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'build/**',
			'.expo/**',
			'android/**',
			'ios/**',
			'coverage/**',
			'*.config.js',
			'babel.config.js',
			'metro.config.js',
			'jest.config.js',
			'.eslintrc.js',
			'scripts/**',
			'web-build/**',
			'worklets-stub/**',
		],
	},
];
