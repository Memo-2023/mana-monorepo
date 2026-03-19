import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SlideService } from '../slide.service';
import { DeckService } from '../../deck/deck.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const TEST_USER_ID = 'user-1';
const TEST_DECK_ID = 'deck-1';
const TEST_SLIDE_ID = 'slide-1';

function createMockSlide(overrides: Record<string, unknown> = {}) {
	return {
		id: TEST_SLIDE_ID,
		deckId: TEST_DECK_ID,
		order: 0,
		content: { type: 'title', title: 'Hello World' },
		createdAt: new Date('2025-01-01'),
		deck: { userId: TEST_USER_ID },
		...overrides,
	};
}

describe('SlideService', () => {
	let service: SlideService;
	let mockDb: any;
	let mockDeckService: any;

	beforeEach(async () => {
		mockDb = {
			query: {
				slides: {
					findFirst: jest.fn(),
				},
			},
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		mockDeckService = {
			verifyOwnership: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SlideService,
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

		service = module.get<SlideService>(SlideService);
	});

	describe('create', () => {
		it('should create a slide when user owns deck', async () => {
			const slide = createMockSlide();
			mockDeckService.verifyOwnership.mockResolvedValue(true);
			mockDb.where.mockResolvedValueOnce([{ maxOrder: 2 }]); // max order query
			mockDb.returning.mockResolvedValue([slide]);

			const result = await service.create(TEST_DECK_ID, TEST_USER_ID, {
				content: { type: 'title' as const, title: 'Hello World' },
			});

			expect(result).toEqual(slide);
			expect(mockDeckService.verifyOwnership).toHaveBeenCalledWith(TEST_DECK_ID, TEST_USER_ID);
		});

		it('should auto-increment order when not provided', async () => {
			mockDeckService.verifyOwnership.mockResolvedValue(true);
			mockDb.where.mockResolvedValueOnce([{ maxOrder: 5 }]);
			mockDb.returning.mockResolvedValue([createMockSlide({ order: 6 })]);

			const result = await service.create(TEST_DECK_ID, TEST_USER_ID, {
				content: { type: 'content' as const },
			});

			expect(result.order).toBe(6);
		});

		it('should throw ForbiddenException when user does not own deck', async () => {
			mockDeckService.verifyOwnership.mockResolvedValue(false);

			await expect(
				service.create(TEST_DECK_ID, 'other-user', {
					content: { type: 'title' as const },
				})
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('update', () => {
		it('should update slide when user owns deck', async () => {
			const slide = createMockSlide();
			const updated = createMockSlide({ content: { type: 'content', body: 'Updated' } });
			mockDb.query.slides.findFirst.mockResolvedValue(slide);
			mockDb.returning.mockResolvedValue([updated]);

			const result = await service.update(TEST_SLIDE_ID, TEST_USER_ID, {
				content: { type: 'content' as const, body: 'Updated' },
			});

			expect(result).toEqual(updated);
		});

		it('should throw NotFoundException when slide not found', async () => {
			mockDb.query.slides.findFirst.mockResolvedValue(null);

			await expect(
				service.update('nonexistent', TEST_USER_ID, {
					content: { type: 'title' as const },
				})
			).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException when user does not own slide', async () => {
			mockDb.query.slides.findFirst.mockResolvedValue(
				createMockSlide({ deck: { userId: 'other-user' } })
			);

			await expect(
				service.update(TEST_SLIDE_ID, TEST_USER_ID, {
					content: { type: 'title' as const },
				})
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('remove', () => {
		it('should delete slide and return success', async () => {
			mockDb.query.slides.findFirst.mockResolvedValue(createMockSlide());
			mockDb.where.mockResolvedValue(undefined);

			const result = await service.remove(TEST_SLIDE_ID, TEST_USER_ID);

			expect(result).toEqual({ success: true });
		});

		it('should throw NotFoundException when slide not found', async () => {
			mockDb.query.slides.findFirst.mockResolvedValue(null);

			await expect(service.remove('nonexistent', TEST_USER_ID)).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException when user does not own slide', async () => {
			mockDb.query.slides.findFirst.mockResolvedValue(
				createMockSlide({ deck: { userId: 'other-user' } })
			);

			await expect(service.remove(TEST_SLIDE_ID, TEST_USER_ID)).rejects.toThrow(ForbiddenException);
		});
	});

	describe('reorder', () => {
		it('should reorder slides when user owns all', async () => {
			mockDb.query.slides.findFirst
				.mockResolvedValueOnce(createMockSlide({ id: 'slide-1' }))
				.mockResolvedValueOnce(createMockSlide({ id: 'slide-2' }));
			mockDb.where.mockResolvedValue(undefined);

			const result = await service.reorder(TEST_USER_ID, {
				slides: [
					{ id: 'slide-1', order: 1 },
					{ id: 'slide-2', order: 0 },
				],
			});

			expect(result).toEqual({ success: true });
		});

		it('should throw NotFoundException when slide not found during reorder', async () => {
			mockDb.query.slides.findFirst.mockResolvedValue(null);

			await expect(
				service.reorder(TEST_USER_ID, {
					slides: [{ id: 'nonexistent', order: 0 }],
				})
			).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException when user does not own a slide', async () => {
			mockDb.query.slides.findFirst.mockResolvedValue(
				createMockSlide({ deck: { userId: 'other-user' } })
			);

			await expect(
				service.reorder(TEST_USER_ID, {
					slides: [{ id: 'slide-1', order: 0 }],
				})
			).rejects.toThrow(ForbiddenException);
		});
	});
});
