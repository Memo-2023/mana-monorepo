import { SlideController } from '../slide.controller';

const TEST_USER_ID = 'test-user-123';
const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

describe('SlideController', () => {
	let controller: SlideController;
	let service: any;

	beforeEach(() => {
		service = {
			create: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
			reorder: jest.fn(),
		};
		controller = new SlideController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('create', () => {
		it('should create slide for deck', async () => {
			const slide = { id: 'slide-1', deckId: 'deck-1', order: 0 };
			service.create.mockResolvedValue(slide);

			const result = await controller.create(
				'deck-1',
				{ content: { type: 'title' as const, title: 'Hello' } },
				mockUser as any
			);

			expect(result).toEqual(slide);
			expect(service.create).toHaveBeenCalledWith('deck-1', TEST_USER_ID, {
				content: { type: 'title', title: 'Hello' },
			});
		});
	});

	describe('update', () => {
		it('should update slide', async () => {
			const slide = { id: 'slide-1', content: { type: 'content', body: 'Updated' } };
			service.update.mockResolvedValue(slide);

			const result = await controller.update(
				'slide-1',
				{ content: { type: 'content' as const, body: 'Updated' } },
				mockUser as any
			);

			expect(result).toEqual(slide);
			expect(service.update).toHaveBeenCalledWith('slide-1', TEST_USER_ID, {
				content: { type: 'content', body: 'Updated' },
			});
		});
	});

	describe('remove', () => {
		it('should delete slide', async () => {
			service.remove.mockResolvedValue({ success: true });

			const result = await controller.remove('slide-1', mockUser as any);

			expect(result).toEqual({ success: true });
			expect(service.remove).toHaveBeenCalledWith('slide-1', TEST_USER_ID);
		});
	});

	describe('reorder', () => {
		it('should reorder slides', async () => {
			service.reorder.mockResolvedValue({ success: true });

			const dto = {
				slides: [
					{ id: 'slide-1', order: 1 },
					{ id: 'slide-2', order: 0 },
				],
			};
			const result = await controller.reorder(dto as any, mockUser as any);

			expect(result).toEqual({ success: true });
			expect(service.reorder).toHaveBeenCalledWith(TEST_USER_ID, dto);
		});
	});
});
