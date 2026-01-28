/**
 * Mock database utilities for testing
 */

import type { Database } from '../../db/connection';

/**
 * Create a mock database with chainable query methods
 */
export function createMockDb(): jest.Mocked<Database> {
	const mockChain = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn().mockResolvedValue([]),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
		execute: jest.fn().mockResolvedValue([]),
	};

	// Make all methods return the chain
	Object.keys(mockChain).forEach((key) => {
		if (key !== 'returning' && key !== 'execute') {
			(mockChain as any)[key].mockReturnValue(mockChain);
		}
	});

	return mockChain as unknown as jest.Mocked<Database>;
}

/**
 * Setup mock database to return specific data
 */
export function setupMockDbQuery<T>(mockDb: jest.Mocked<Database>, data: T[]): void {
	// For SELECT queries - the final method in the chain resolves to data
	(mockDb as any).where.mockResolvedValueOnce(data);
}

/**
 * Setup mock database for INSERT operations
 */
export function setupMockDbInsert<T>(mockDb: jest.Mocked<Database>, data: T[]): void {
	(mockDb as any).returning.mockResolvedValueOnce(data);
}

/**
 * Setup mock database for UPDATE operations
 */
export function setupMockDbUpdate<T>(mockDb: jest.Mocked<Database>, data: T[]): void {
	(mockDb as any).returning.mockResolvedValueOnce(data);
}

/**
 * Reset all mock calls on the database
 */
export function resetMockDb(mockDb: jest.Mocked<Database>): void {
	Object.values(mockDb).forEach((fn) => {
		if (typeof fn === 'function' && fn.mockClear) {
			fn.mockClear();
		}
	});
}
