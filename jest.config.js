/** @type {import('jest').Config} */
module.exports = {
	// Use multiple projects for different types of tests
	projects: [
		{
			displayName: 'backend',
			testMatch: ['<rootDir>/apps/*/apps/backend/**/*.spec.ts', '<rootDir>/services/**/*.spec.ts'],
			preset: 'ts-jest',
			testEnvironment: 'node',
			moduleNameMapper: {
				'^@/(.*)$': '<rootDir>/src/$1',
				'^@manacore/(.*)$': '<rootDir>/packages/$1',
			},
			coverageDirectory: '<rootDir>/coverage/backend',
			collectCoverageFrom: [
				'apps/*/apps/backend/src/**/*.ts',
				'services/**/src/**/*.ts',
				'!**/*.spec.ts',
				'!**/*.d.ts',
				'!**/node_modules/**',
				'!**/dist/**',
			],
		},
		{
			displayName: 'mobile',
			testMatch: ['<rootDir>/apps/*/apps/mobile/**/*.test.{ts,tsx}'],
			preset: 'jest-expo',
			transformIgnorePatterns: [
				'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
			],
			moduleNameMapper: {
				'^@/(.*)$': '<rootDir>/src/$1',
				'^@manacore/(.*)$': '<rootDir>/packages/$1',
			},
			coverageDirectory: '<rootDir>/coverage/mobile',
			collectCoverageFrom: [
				'apps/*/apps/mobile/src/**/*.{ts,tsx}',
				'apps/*/apps/mobile/app/**/*.{ts,tsx}',
				'!**/*.test.{ts,tsx}',
				'!**/*.d.ts',
				'!**/node_modules/**',
			],
		},
		{
			displayName: 'shared',
			testMatch: ['<rootDir>/packages/**/*.{test,spec}.ts'],
			preset: 'ts-jest',
			testEnvironment: 'node',
			moduleNameMapper: {
				'^@manacore/(.*)$': '<rootDir>/packages/$1',
			},
			coverageDirectory: '<rootDir>/coverage/shared',
			collectCoverageFrom: [
				'packages/**/src/**/*.ts',
				'!**/*.test.ts',
				'!**/*.spec.ts',
				'!**/*.d.ts',
				'!**/node_modules/**',
			],
		},
	],
	coverageThresholds: {
		global: {
			lines: 50,
			functions: 50,
			branches: 50,
			statements: 50,
		},
	},
	maxWorkers: '50%',
	verbose: true,
};
