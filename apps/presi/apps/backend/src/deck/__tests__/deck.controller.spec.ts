import { DeckController } from '../deck.controller';

const TEST_USER_ID = 'test-user-123';
const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

function createMockDeck(overrides: Record<string, unknown> = {}) {
	return {
		id: 'deck-1',
		userId: TEST_USER_ID,
		title: 'Test Deck',
		description: 'A test deck',
		themeId: null,
		isPublic: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe('DeckController', () => {
	let controller: DeckController;
	let service: any;

	beforeEach(() => {
		service = {
			findByUser: jest.fn(),
			findOneWithSlides: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
		};
		controller = new DeckController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return user decks', async () => {
			const decks = [createMockDeck()];
			service.findByUser.mockResolvedValue(decks);

			const result = await controller.findAll(mockUser as any);

			expect(result).toEqual(decks);
			expect(service.findByUser).toHaveBeenCalledWith(TEST_USER_ID);
		});
	});

	describe('findOne', () => {
		it('should return deck with slides', async () => {
			const deck = createMockDeck({ slides: [] });
			service.findOneWithSlides.mockResolvedValue(deck);

			const result = await controller.findOne('deck-1', mockUser as any);

			expect(result).toEqual(deck);
			expect(service.findOneWithSlides).toHaveBeenCalledWith('deck-1', TEST_USER_ID);
		});
	});

	describe('create', () => {
		it('should create and return deck', async () => {
			const deck = createMockDeck();
			service.create.mockResolvedValue(deck);

			const result = await controller.create({ title: 'Test Deck' } as any, mockUser as any);

			expect(result).toEqual(deck);
			expect(service.create).toHaveBeenCalledWith(TEST_USER_ID, { title: 'Test Deck' });
		});
	});

	describe('update', () => {
		it('should update and return deck', async () => {
			const deck = createMockDeck({ title: 'Updated' });
			service.update.mockResolvedValue(deck);

			const result = await controller.update(
				'deck-1',
				{ title: 'Updated' } as any,
				mockUser as any
			);

			expect(result).toEqual(deck);
			expect(service.update).toHaveBeenCalledWith('deck-1', TEST_USER_ID, { title: 'Updated' });
		});
	});

	describe('remove', () => {
		it('should delete and return success', async () => {
			service.remove.mockResolvedValue({ success: true });

			const result = await controller.remove('deck-1', mockUser as any);

			expect(result).toEqual({ success: true });
			expect(service.remove).toHaveBeenCalledWith('deck-1', TEST_USER_ID);
		});
	});
});
