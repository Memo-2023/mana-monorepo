/** @type {import('jest').Config} */
module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts', '!**/index.ts', '!main.ts'],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	moduleNameMapper: {
		'^@calendar/shared$': '<rootDir>/../../packages/shared/src',
	},
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	// Ignore node_modules except for workspace packages
	transformIgnorePatterns: ['node_modules/(?!(@calendar|@manacore)/)'],
};
