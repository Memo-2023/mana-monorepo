import { ShareController } from '../share.controller';

const TEST_USER_ID = 'test-user-123';
const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

describe('ShareController', () => {
	let controller: ShareController;
	let service: any;

	beforeEach(() => {
		service = {
			findByShareCode: jest.fn(),
			createShare: jest.fn(),
			getSharesForDeck: jest.fn(),
			deleteShare: jest.fn(),
		};
		controller = new ShareController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('getSharedDeck', () => {
		it('should return shared deck by code', async () => {
			const deck = { id: 'deck-1', title: 'Shared', slides: [] };
			service.findByShareCode.mockResolvedValue(deck);

			const result = await controller.getSharedDeck('abc123');

			expect(result).toEqual(deck);
			expect(service.findByShareCode).toHaveBeenCalledWith('abc123');
		});
	});

	describe('createShare', () => {
		it('should create share link', async () => {
			const share = { id: 'share-1', shareCode: 'abc123', deckId: 'deck-1' };
			service.createShare.mockResolvedValue(share);

			const result = await controller.createShare('deck-1', {} as any, mockUser as any);

			expect(result).toEqual(share);
			expect(service.createShare).toHaveBeenCalledWith('deck-1', TEST_USER_ID, undefined);
		});

		it('should create share link with expiration', async () => {
			const share = { id: 'share-1', shareCode: 'abc123', expiresAt: '2026-12-31' };
			service.createShare.mockResolvedValue(share);

			const result = await controller.createShare(
				'deck-1',
				{ expiresAt: '2026-12-31T00:00:00.000Z' } as any,
				mockUser as any
			);

			expect(result).toEqual(share);
		});
	});

	describe('getSharesForDeck', () => {
		it('should return shares for deck', async () => {
			const shares = [{ id: 'share-1', shareCode: 'abc123' }];
			service.getSharesForDeck.mockResolvedValue(shares);

			const result = await controller.getSharesForDeck('deck-1', mockUser as any);

			expect(result).toEqual(shares);
			expect(service.getSharesForDeck).toHaveBeenCalledWith('deck-1', TEST_USER_ID);
		});
	});

	describe('deleteShare', () => {
		it('should delete share and return success', async () => {
			service.deleteShare.mockResolvedValue({ success: true });

			const result = await controller.deleteShare('share-1', mockUser as any);

			expect(result).toEqual({ success: true });
			expect(service.deleteShare).toHaveBeenCalledWith('share-1', TEST_USER_ID);
		});
	});
});
