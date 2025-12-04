/**
 * Global test setup for unit tests
 */

// Increase timeout for slower machines
jest.setTimeout(10000);

// Suppress console logs during tests (optional - remove if you want to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Global test utilities
global.testUtils = {
	/**
	 * Wait for a condition to be true
	 */
	waitFor: async (condition: () => boolean, timeout = 5000, interval = 100): Promise<void> => {
		const startTime = Date.now();
		while (!condition()) {
			if (Date.now() - startTime > timeout) {
				throw new Error('Timeout waiting for condition');
			}
			await new Promise((resolve) => setTimeout(resolve, interval));
		}
	},

	/**
	 * Sleep for a specified duration
	 */
	sleep: (ms: number): Promise<void> => {
		return new Promise((resolve) => setTimeout(resolve, ms));
	},

	/**
	 * Mock console methods and restore them
	 */
	mockConsole: () => {
		const originalLog = console.log;
		const originalError = console.error;
		const originalWarn = console.warn;

		const logs: string[] = [];
		const errors: string[] = [];
		const warns: string[] = [];

		console.log = jest.fn((...args) => logs.push(args.join(' ')));
		console.error = jest.fn((...args) => errors.push(args.join(' ')));
		console.warn = jest.fn((...args) => warns.push(args.join(' ')));

		return {
			logs,
			errors,
			warns,
			restore: () => {
				console.log = originalLog;
				console.error = originalError;
				console.warn = originalWarn;
			},
		};
	},
};

// Type augmentation for global test utils
declare global {
	var testUtils: {
		waitFor: (condition: () => boolean, timeout?: number, interval?: number) => Promise<void>;
		sleep: (ms: number) => Promise<void>;
		mockConsole: () => {
			logs: string[];
			errors: string[];
			warns: string[];
			restore: () => void;
		};
	};
}

export {};
