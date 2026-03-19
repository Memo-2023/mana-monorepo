import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeckService } from '../deck.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const TEST_USER_ID = 'user-1';
const TEST_DECK_ID = 'deck-1';

function createMockDeck(overrides: Record<string, unknown> = {}) {
	return {
		id: TEST_DECK_ID,
		userId: TEST_USER_ID,
		title: 'Test Deck',
		description: 'A test deck',
		themeId: null,
		isPublic: false,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		theme: null,
		slides: [],
		...overrides,
	};
}

describe('DeckService', () => {
	let service: DeckService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			query: {
				decks: {
					findMany: jest.fn(),
					findFirst: jest.fn(),
				},
			},
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DeckService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<DeckService>(DeckService);
	});

	describe('findByUser', () => {
		it('should return all decks for a user', async () => {
			const decks = [createMockDeck(), createMockDeck({ id: 'deck-2', title: 'Second Deck' })];
			mockDb.query.decks.findMany.mockResolvedValue(decks);

			const result = await service.findByUser(TEST_USER_ID);

			expect(result).toEqual(decks);
			expect(mockDb.query.decks.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					with: { theme: true },
				})
			);
		});

		it('should return empty array when user has no decks', async () => {
			mockDb.query.decks.findMany.mockResolvedValue([]);

			const result = await service.findByUser(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('findOneWithSlides', () => {
		it('should return deck with slides when found', async () => {
			const deck = createMockDeck({
				slides: [{ id: 'slide-1', order: 0, content: { type: 'title' } }],
			});
			mockDb.query.decks.findFirst.mockResolvedValue(deck);

			const result = await service.findOneWithSlides(TEST_DECK_ID, TEST_USER_ID);

			expect(result).toEqual(deck);
			expect(result.slides).toHaveLength(1);
		});

		it('should throw NotFoundException when deck not found', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(null);

			await expect(service.findOneWithSlides('nonexistent', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw NotFoundException when user does not own deck', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(null);

			await expect(service.findOneWithSlides(TEST_DECK_ID, 'other-user')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('findOne', () => {
		it('should return deck without ownership check', async () => {
			const deck = createMockDeck();
			mockDb.query.decks.findFirst.mockResolvedValue(deck);

			const result = await service.findOne(TEST_DECK_ID);

			expect(result).toEqual(deck);
		});

		it('should return undefined when deck not found', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(undefined);

			const result = await service.findOne('nonexistent');

			expect(result).toBeUndefined();
		});
	});

	describe('create', () => {
		it('should create and return a new deck', async () => {
			const newDeck = createMockDeck();
			mockDb.returning.mockResolvedValue([newDeck]);

			const result = await service.create(TEST_USER_ID, {
				title: 'Test Deck',
				description: 'A test deck',
			});

			expect(result).toEqual(newDeck);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: TEST_USER_ID,
					title: 'Test Deck',
					description: 'A test deck',
				})
			);
		});

		it('should create deck with themeId', async () => {
			const deck = createMockDeck({ themeId: 'theme-1' });
			mockDb.returning.mockResolvedValue([deck]);

			const result = await service.create(TEST_USER_ID, {
				title: 'Themed Deck',
				themeId: 'theme-1',
			});

			expect(result.themeId).toBe('theme-1');
		});
	});

	describe('update', () => {
		it('should update and return the deck', async () => {
			const existing = createMockDeck();
			const updated = createMockDeck({ title: 'Updated Title' });
			mockDb.query.decks.findFirst.mockResolvedValue(existing);
			mockDb.returning.mockResolvedValue([updated]);

			const result = await service.update(TEST_DECK_ID, TEST_USER_ID, { title: 'Updated Title' });

			expect(result).toEqual(updated);
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should throw NotFoundException when deck not found', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(null);

			await expect(
				service.update('nonexistent', TEST_USER_ID, { title: 'Updated' })
			).rejects.toThrow(NotFoundException);
		});

		it('should throw NotFoundException when user does not own deck', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(null);

			await expect(
				service.update(TEST_DECK_ID, 'other-user', { title: 'Updated' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('should delete deck and return success', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(createMockDeck());
			mockDb.where.mockResolvedValue(undefined);

			const result = await service.remove(TEST_DECK_ID, TEST_USER_ID);

			expect(result).toEqual({ success: true });
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException when deck not found', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(null);

			await expect(service.remove('nonexistent', TEST_USER_ID)).rejects.toThrow(NotFoundException);
		});
	});

	describe('verifyOwnership', () => {
		it('should return true when user owns deck', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(createMockDeck());

			const result = await service.verifyOwnership(TEST_DECK_ID, TEST_USER_ID);

			expect(result).toBe(true);
		});

		it('should return false when user does not own deck', async () => {
			mockDb.query.decks.findFirst.mockResolvedValue(null);

			const result = await service.verifyOwnership(TEST_DECK_ID, 'other-user');

			expect(result).toBe(false);
		});
	});
});
