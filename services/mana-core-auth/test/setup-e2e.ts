/**
 * Global E2E test setup
 */

// Use crypto for generating random IDs instead of nanoid to avoid ESM issues
const crypto = require('crypto');

// Increase timeout for E2E tests
jest.setTimeout(30000);

/**
 * Generate random ID using crypto
 */
const generateRandomId = (length: number = 10): string => {
	return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * Global test utilities for E2E tests
 */
global.e2eTestUtils = {
	/**
	 * Generate unique test email
	 */
	generateTestEmail: (): string => {
		return `test-${generateRandomId(10)}@example.com`;
	},

	/**
	 * Generate test user data
	 */
	generateTestUser: () => ({
		email: `test-${generateRandomId(10)}@example.com`,
		password: 'TestPassword123!',
		name: 'Test User',
	}),

	/**
	 * Wait for server to be ready
	 */
	waitForServer: async (url: string, maxAttempts: number = 30): Promise<void> => {
		for (let i = 0; i < maxAttempts; i++) {
			try {
				const response = await fetch(`${url}/health/live`);
				if (response.ok) {
					return;
				}
			} catch (error) {
				// Server not ready yet
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		throw new Error('Server did not become ready in time');
	},

	/**
	 * Clean up test data
	 */
	cleanupTestData: async (testIds: string[]) => {
		// Implement cleanup logic here
		// This should connect to the test database and delete test data
	},
};

// Type augmentation for E2E test utils
declare global {
	var e2eTestUtils: {
		generateTestEmail: () => string;
		generateTestUser: () => { email: string; password: string; name: string };
		waitForServer: (url: string, maxAttempts?: number) => Promise<void>;
		cleanupTestData: (testIds: string[]) => Promise<void>;
	};
}

export {};
