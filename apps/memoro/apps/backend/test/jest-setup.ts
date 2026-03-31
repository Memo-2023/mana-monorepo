// Global test setup
// Add any global test configuration here

// Increase timeout for longer running tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
	...console,
	log: jest.fn(),
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};
