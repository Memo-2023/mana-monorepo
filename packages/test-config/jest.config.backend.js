/**
 * Shared Jest configuration for NestJS backend projects
 *
 * Usage in backend package.json:
 * {
 *   "jest": {
 *     "preset": "@manacore/test-config/jest-backend"
 *   }
 * }
 *
 * Or extend in jest.config.js:
 * const baseConfig = require('@manacore/test-config/jest-backend');
 * module.exports = {
 *   ...baseConfig,
 *   // Your overrides
 * };
 */

module.exports = {
	// File extensions Jest should look for
	moduleFileExtensions: ['js', 'json', 'ts'],

	// Root directory for tests (relative to project root)
	rootDir: 'src',

	// Test file pattern
	testRegex: '.*\\.spec\\.ts$',

	// Transform TypeScript files
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},

	// Collect coverage from these files
	collectCoverageFrom: [
		'**/*.(t|j)s',
		'!**/*.module.ts', // Exclude NestJS modules
		'!**/*.interface.ts', // Exclude interfaces
		'!**/*.dto.ts', // Exclude DTOs
		'!**/*.entity.ts', // Exclude entities
		'!**/main.ts', // Exclude entry point
		'!**/*.d.ts', // Exclude type definitions
		'!**/node_modules/**',
		'!**/__tests__/**', // Exclude test files
		'!**/test/**',
	],

	// Coverage output directory
	coverageDirectory: '../coverage',

	// Test environment
	testEnvironment: 'node',

	// Coverage thresholds (fail if below these values)
	coverageThresholds: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},

	// Module name mapper for path aliases
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
		'^@core/(.*)$': '<rootDir>/core/$1',
		'^@modules/(.*)$': '<rootDir>/modules/$1',
	},

	// Setup files
	setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],

	// Maximum time for tests
	testTimeout: 10000,

	// Clear mocks between tests
	clearMocks: true,

	// Restore mocks between tests
	restoreMocks: true,

	// Reset mocks between tests
	resetMocks: true,

	// Verbose output
	verbose: true,

	// Error on deprecated APIs
	errorOnDeprecated: true,

	// Paths to ignore
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/__tests__/utils/', '/__tests__/fixtures/'],
};
