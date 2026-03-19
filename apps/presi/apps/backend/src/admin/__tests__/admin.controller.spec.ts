import { AdminController } from '../admin.controller';

describe('AdminController', () => {
	let controller: AdminController;
	let service: any;

	beforeEach(() => {
		service = {
			getUserData: jest.fn(),
			deleteUserData: jest.fn(),
		};
		controller = new AdminController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('getUserData', () => {
		it('should return user data summary', async () => {
			const userData = {
				entities: [
					{ entity: 'decks', count: 5, label: 'Decks' },
					{ entity: 'slides', count: 20, label: 'Slides' },
					{ entity: 'shared_decks', count: 3, label: 'Shared Links' },
				],
				totalCount: 28,
				lastActivityAt: '2025-06-01T00:00:00.000Z',
			};
			service.getUserData.mockResolvedValue(userData);

			const result = await controller.getUserData('user-1');

			expect(result).toEqual(userData);
			expect(service.getUserData).toHaveBeenCalledWith('user-1');
		});

		it('should return empty data for unknown user', async () => {
			const emptyData = { entities: [], totalCount: 0, lastActivityAt: undefined };
			service.getUserData.mockResolvedValue(emptyData);

			const result = await controller.getUserData('unknown');

			expect(result.totalCount).toBe(0);
		});
	});

	describe('deleteUserData', () => {
		it('should delete all user data and return counts', async () => {
			const deleteResult = {
				success: true,
				deletedCounts: [
					{ entity: 'shared_decks', count: 2, label: 'Shared Links' },
					{ entity: 'slides', count: 10, label: 'Slides' },
					{ entity: 'decks', count: 3, label: 'Decks' },
				],
				totalDeleted: 15,
			};
			service.deleteUserData.mockResolvedValue(deleteResult);

			const result = await controller.deleteUserData('user-1');

			expect(result.success).toBe(true);
			expect(result.totalDeleted).toBe(15);
			expect(service.deleteUserData).toHaveBeenCalledWith('user-1');
		});
	});
});
