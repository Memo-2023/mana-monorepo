/**
 * React/React Native ESLint configuration
 *
 * Provides React-specific linting rules for Expo mobile applications.
 * Focuses on hooks rules, accessibility, and React Native best practices.
 */
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

/** @type {import('eslint').Linter.Config[]} */
export const reactConfig = [
	{
		files: ['**/*.tsx', '**/*.jsx'],
		plugins: {
			react: reactPlugin,
			'react-hooks': hooksPlugin,
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			// ============================================
			// ERRORS - React correctness
			// ============================================

			// Hooks rules are critical - wrong usage causes bugs
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'error',

			// Prevent common React mistakes
			'react/jsx-key': ['error', { checkFragmentShorthand: true }],
			'react/jsx-no-duplicate-props': 'error',
			'react/jsx-no-undef': 'error',
			'react/no-children-prop': 'error',
			'react/no-danger-with-children': 'error',
			'react/no-deprecated': 'error',
			'react/no-direct-mutation-state': 'error',
			'react/no-string-refs': 'error',
			'react/no-unescaped-entities': 'error',
			'react/require-render-return': 'error',

			// ============================================
			// WARNINGS - Best practices
			// ============================================

			// Code quality suggestions
			'react/jsx-no-target-blank': 'warn', // Security, but sometimes needed
			'react/no-unknown-property': 'warn',
			'react/self-closing-comp': 'warn',
			'react/jsx-boolean-value': ['warn', 'never'],
			'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
			'react/jsx-fragments': ['warn', 'syntax'],

			// ============================================
			// OFF - TypeScript handles or not applicable
			// ============================================

			// TypeScript handles prop validation
			'react/prop-types': 'off',
			'react/require-default-props': 'off',

			// React 17+ with new JSX transform
			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-react': 'off',

			// Not needed with TypeScript
			'react/display-name': 'off',

			// Too strict for practical use
			'react/jsx-no-bind': 'off',
			'react/no-array-index-key': 'off', // Sometimes index is the only stable key
		},
	},
];

export default reactConfig;
