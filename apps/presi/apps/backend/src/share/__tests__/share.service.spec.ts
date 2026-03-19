import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ShareService } from '../share.service';
import { DeckService } from '../../deck/deck.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const TEST_USER_ID = 'user-1';
const TEST_DECK_ID = 'deck-1';
const TEST_SHARE_ID = 'share-1';
const TEST_SHARE_CODE = 'abc123def456';

function createMockShare(overrides: Record<string, unknown> = {}) {
	return {
		id: TEST_SHARE_ID,
		deckId: TEST_DECK_ID,
		shareCode: TEST_SHARE_CODE,
		expiresAt: null,
		createdAt: new Date('2025-01-01'),
		...overrides,
	};
}

describe('ShareService', () => {
	let service: ShareService;
	let mockDb: any;
	let mockDeckService: any;

	beforeEach(async () => {
		mockDb = {
			query: {
				sharedDecks: {
					findFirst: jest.fn(),
					findMany: jest.fn(),
				},
			},
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			delete: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
		};

		mockDeckService = {
			verifyOwnership: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ShareService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: DeckService,
					useValue: mockDeckService,
				},
			],
		}).compile();

		service = module.get<ShareService>(ShareService);
	});

	describe('createShare', () => {
		it('should create a new share link when user owns deck', async () => {
			const share = createMockShare();
			mockDeckService.verifyOwnership.mockResolvedValue(true);
			mockDb.query.sharedDecks.findFirst.mockResolvedValue(null); // no existing share
			mockDb.returning.mockResolvedValue([share]);

			const result = await service.createShare(TEST_DECK_ID, TEST_USER_ID);

			expect(result).toEqual(share);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should return existing valid share instead of creating new one', async () => {
			const existingShare = createMockShare();
			mockDeckService.verifyOwnership.mockResolvedValue(true);
			mockDb.query.sharedDecks.findFirst.mockResolvedValue(existingShare);

			const result = await service.createShare(TEST_DECK_ID, TEST_USER_ID);

			expect(result).toEqual(existingShare);
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it('should throw ForbiddenException when user does not own deck', async () => {
			mockDeckService.verifyOwnership.mockResolvedValue(false);

			await expect(service.createShare(TEST_DECK_ID, 'other-user')).rejects.toThrow(
				ForbiddenException
			);
		});

		it('should create share with expiration date', async () => {
			const expiresAt = new Date('2026-12-31');
			const share = createMockShare({ expiresAt });
			mockDeckService.verifyOwnership.mockResolvedValue(true);
			mockDb.query.sharedDecks.findFirst.mockResolvedValue(null);
			mockDb.returning.mockResolvedValue([share]);

			const result = await service.createShare(TEST_DECK_ID, TEST_USER_ID, expiresAt);

			expect(result.expiresAt).toEqual(expiresAt);
		});
	});

	describe('findByShareCode', () => {
		it('should return deck when share code is valid', async () => {
			const deck = {
				id: TEST_DECK_ID,
				title: 'Shared Deck',
				slides: [],
				theme: null,
			};
			mockDb.query.sharedDecks.findFirst.mockResolvedValue({
				...createMockShare(),
				deck,
			});

			const result = await service.findByShareCode(TEST_SHARE_CODE);

			expect(result).toEqual(deck);
		});

		it('should throw NotFoundException when share code not found', async () => {
			mockDb.query.sharedDecks.findFirst.mockResolvedValue(null);

			await expect(service.findByShareCode('invalid-code')).rejects.toThrow(NotFoundException);
		});

		it('should throw NotFoundException when share has expired', async () => {
			mockDb.query.sharedDecks.findFirst.mockResolvedValue(null); // expired shares are filtered in query

			await expect(service.findByShareCode(TEST_SHARE_CODE)).rejects.toThrow(NotFoundException);
		});
	});

	describe('getSharesForDeck', () => {
		it('should return shares when user owns deck', async () => {
			const shares = [createMockShare(), createMockShare({ id: 'share-2', shareCode: 'xyz789' })];
			mockDeckService.verifyOwnership.mockResolvedValue(true);
			mockDb.query.sharedDecks.findMany.mockResolvedValue(shares);

			const result = await service.getSharesForDeck(TEST_DECK_ID, TEST_USER_ID);

			expect(result).toEqual(shares);
			expect(result).toHaveLength(2);
		});

		it('should throw ForbiddenException when user does not own deck', async () => {
			mockDeckService.verifyOwnership.mockResolvedValue(false);

			await expect(service.getSharesForDeck(TEST_DECK_ID, 'other-user')).rejects.toThrow(
				ForbiddenException
			);
		});
	});

	describe('deleteShare', () => {
		it('should delete share when user owns deck', async () => {
			mockDb.query.sharedDecks.findFirst.mockResolvedValue({
				...createMockShare(),
				deck: { userId: TEST_USER_ID },
			});
			mockDb.where.mockResolvedValue(undefined);

			const result = await service.deleteShare(TEST_SHARE_ID, TEST_USER_ID);

			expect(result).toEqual({ success: true });
		});

		it('should throw NotFoundException when share not found', async () => {
			mockDb.query.sharedDecks.findFirst.mockResolvedValue(null);

			await expect(service.deleteShare('nonexistent', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when user does not own deck', async () => {
			mockDb.query.sharedDecks.findFirst.mockResolvedValue({
				...createMockShare(),
				deck: { userId: 'other-user' },
			});

			await expect(service.deleteShare(TEST_SHARE_ID, TEST_USER_ID)).rejects.toThrow(
				ForbiddenException
			);
		});
	});
});
