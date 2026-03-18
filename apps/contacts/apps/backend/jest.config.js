/** @type {import('jest').Config} */
module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	moduleNameMapper: {
		'^@contacts/shared$': '<rootDir>/../../packages/shared/src',
		'^@manacore/shared-nestjs-auth$': '<rootDir>/../../../../../packages/shared-nestjs-auth/src',
	},
};
