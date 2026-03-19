import type { Database } from '../../db/connection';

export function createMockDb(): any {
	const mockChain = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		offset: jest.fn().mockReturnThis(),
		orderBy: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn().mockResolvedValue([]),
		onConflictDoUpdate: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		delete: jest.fn().mockReturnThis(),
		execute: jest.fn().mockResolvedValue([]),
	};

	Object.keys(mockChain).forEach((key) => {
		if (key !== 'returning' && key !== 'execute') {
			(mockChain as any)[key].mockReturnValue(mockChain);
		}
	});

	return mockChain;
}
