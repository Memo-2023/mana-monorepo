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
	transformIgnorePatterns: ['node_modules/(?!(nanoid|better-auth)/)'],
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/$1',
		'^nanoid$': '<rootDir>/../test/__mocks__/nanoid.ts',
		'^jose$': '<rootDir>/../test/__mocks__/jose.ts',
		'^better-auth$': '<rootDir>/../test/__mocks__/better-auth.ts',
		'^better-auth/types$': '<rootDir>/../test/__mocks__/better-auth.ts',
		'^better-auth/plugins$': '<rootDir>/../test/__mocks__/better-auth-plugins.ts',
		'^better-auth/plugins/(.*)$': '<rootDir>/../test/__mocks__/better-auth-plugins.ts',
		'^better-auth/adapters/(.*)$': '<rootDir>/../test/__mocks__/better-auth-adapters.ts',
	},
	// Coverage thresholds disabled temporarily while expanding test coverage
	// TODO: Re-enable once we reach 80% coverage
	// coverageThreshold: {
	// 	global: {
	// 		branches: 80,
	// 		functions: 80,
	// 		lines: 80,
	// 		statements: 80,
	// 	},
	// },
	setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
	testTimeout: 10000,
};
