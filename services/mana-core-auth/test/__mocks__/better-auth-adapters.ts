/**
 * Mock implementation of better-auth adapters for tests
 */

// Mock Drizzle adapter
export const drizzleAdapter = jest.fn((db: unknown, config?: Record<string, unknown>) => ({
	id: 'drizzle',
	name: 'Drizzle Adapter',
	db,
	config,
}));

// Export all adapters
export default {
	drizzleAdapter,
};
