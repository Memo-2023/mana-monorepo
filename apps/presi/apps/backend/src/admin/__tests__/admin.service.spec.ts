import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const TEST_USER_ID = 'user-1';

describe('AdminService', () => {
	let service: AdminService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			limit: jest.fn(),
			delete: jest.fn().mockReturnThis(),
			returning: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AdminService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<AdminService>(AdminService);
	});

	describe('getUserData', () => {
		it('should return user data summary with counts', async () => {
			// Count decks
			mockDb.where.mockResolvedValueOnce([{ count: 3 }]);
			// Get user decks
			mockDb.where.mockResolvedValueOnce([{ id: 'deck-1' }, { id: 'deck-2' }, { id: 'deck-3' }]);
			// Count slides
			mockDb.where.mockResolvedValueOnce([{ count: 10 }]);
			// Count shared decks
			mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
			// Last activity
			mockDb.limit.mockResolvedValue([{ updatedAt: new Date('2025-06-01') }]);

			const result = await service.getUserData(TEST_USER_ID);

			expect(result.totalCount).toBe(15);
			expect(result.entities).toHaveLength(3);
			expect(result.entities[0]).toEqual({ entity: 'decks', count: 3, label: 'Decks' });
			expect(result.entities[1]).toEqual({ entity: 'slides', count: 10, label: 'Slides' });
			expect(result.entities[2]).toEqual({
				entity: 'shared_decks',
				count: 2,
				label: 'Shared Links',
			});
			expect(result.lastActivityAt).toBe('2025-06-01T00:00:00.000Z');
		});

		it('should return zeros when user has no data', async () => {
			// Count decks
			mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
			// Get user decks (empty)
			mockDb.where.mockResolvedValueOnce([]);
			// Last activity (none)
			mockDb.limit.mockResolvedValue([]);

			const result = await service.getUserData(TEST_USER_ID);

			expect(result.totalCount).toBe(0);
			expect(result.lastActivityAt).toBeUndefined();
		});
	});

	describe('deleteUserData', () => {
		it('should delete all user data and return counts', async () => {
			// Get user decks
			mockDb.where.mockResolvedValueOnce([{ id: 'deck-1' }]);
			// Delete shared decks
			mockDb.returning.mockResolvedValueOnce([{ id: 'share-1' }]);
			// Delete slides
			mockDb.returning.mockResolvedValueOnce([{ id: 'slide-1' }, { id: 'slide-2' }]);
			// Delete decks
			mockDb.returning.mockResolvedValueOnce([{ id: 'deck-1' }]);

			const result = await service.deleteUserData(TEST_USER_ID);

			expect(result.success).toBe(true);
			expect(result.totalDeleted).toBe(4);
			expect(result.deletedCounts).toHaveLength(3);
		});

		it('should handle user with no data gracefully', async () => {
			// Get user decks (empty)
			mockDb.where.mockResolvedValueOnce([]);
			// Delete decks (none)
			mockDb.returning.mockResolvedValueOnce([]);

			const result = await service.deleteUserData(TEST_USER_ID);

			expect(result.success).toBe(true);
			expect(result.totalDeleted).toBe(0);
		});
	});
});
