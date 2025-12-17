module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['**/*.(t|j)s', '!**/index.ts', '!**/*.interface.ts', '!**/*.d.ts'],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	verbose: true,
	clearMocks: true,
	restoreMocks: true,
	resetMocks: true,
};
