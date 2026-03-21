/** @type {import('jest').Config} */
module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: { '^.+\\.(t|j)s$': 'ts-jest' },
	collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts', '!**/index.ts', '!main.ts'],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	moduleNameMapper: { '^@storage/shared$': '<rootDir>/../../packages/shared/src' },
	transformIgnorePatterns: ['node_modules/(?!(@storage|@manacore)/)'],
};
