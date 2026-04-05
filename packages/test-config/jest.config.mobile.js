/**
 * Shared Jest configuration for React Native (Expo) mobile projects
 *
 * Usage in mobile package.json:
 * {
 *   "jest": {
 *     "preset": "@mana/test-config/jest-mobile"
 *   }
 * }
 */

module.exports = {
	// Use jest-expo preset
	preset: 'jest-expo',

	// Setup files to run after environment is set up
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

	// Test file patterns
	testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

	// Paths to ignore
	testPathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/utils/',
		'/__tests__/fixtures/',
		'/__tests__/mocks/',
	],

	// Transform ignore patterns for React Native modules
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@mana/.*)',
	],

	// Collect coverage from these files
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'app/**/*.{ts,tsx}',
		'!**/*.d.ts',
		'!**/node_modules/**',
		'!**/__tests__/**',
		'!**/coverage/**',
		'!**/*.styles.ts', // Exclude style files
		'!**/*.types.ts', // Exclude type-only files
	],

	// Coverage directory
	coverageDirectory: 'coverage',

	// Coverage thresholds
	coverageThresholds: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},

	// Module name mapper
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@components/(.*)$': '<rootDir>/src/components/$1',
		'^@services/(.*)$': '<rootDir>/src/services/$1',
		'^@utils/(.*)$': '<rootDir>/src/utils/$1',
		'^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
		'^@stores/(.*)$': '<rootDir>/src/stores/$1',
		'^@assets/(.*)$': '<rootDir>/assets/$1',
	},

	// Test environment
	testEnvironment: 'node',

	// Maximum time for tests
	testTimeout: 10000,

	// Clear mocks between tests
	clearMocks: true,

	// Restore mocks between tests
	restoreMocks: true,

	// Reset mocks between tests
	resetMocks: true,

	// Verbose output in CI
	verbose: process.env.CI === 'true',

	// Coverage reporters
	coverageReporters: ['text', 'lcov', 'html', 'json'],

	// Error on deprecated APIs
	errorOnDeprecated: true,

	// Detect open handles
	detectOpenHandles: true,

	// Force exit after tests complete
	forceExit: false,

	// Globals
	globals: {
		'ts-jest': {
			tsconfig: {
				jsx: 'react',
			},
		},
	},
};
