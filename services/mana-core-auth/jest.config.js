module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: [
		'**/*.(t|j)s',
		'!**/*.module.ts',
		'!**/*.interface.ts',
		'!**/main.ts',
		'!**/*.dto.ts',
		'!**/*.schema.ts',
		'!**/index.ts',
		'!**/migrate.ts',
		'!**/connection.ts',
	],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	// Handle ESM modules (nanoid, better-auth)
	transformIgnorePatterns: [
		'node_modules/(?!(nanoid|better-auth)/)',
	],
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/$1',
		'^nanoid$': '<rootDir>/../test/__mocks__/nanoid.ts',
		'^better-auth$': '<rootDir>/../test/__mocks__/better-auth.ts',
		'^better-auth/types$': '<rootDir>/../test/__mocks__/better-auth.ts',
		'^better-auth/plugins$': '<rootDir>/../test/__mocks__/better-auth-plugins.ts',
		'^better-auth/plugins/(.*)$': '<rootDir>/../test/__mocks__/better-auth-plugins.ts',
		'^better-auth/adapters/(.*)$': '<rootDir>/../test/__mocks__/better-auth-adapters.ts',
	},
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
		// Critical paths require 100% coverage
		'./auth/auth.service.ts': {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		'./credits/credits.service.ts': {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
		'./common/guards/jwt-auth.guard.ts': {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
	setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
	testTimeout: 10000,
};
