import { NotFoundException } from '@nestjs/common';
import { EventTagController } from './event-tag.controller';
import { TEST_USER_ID } from '../__tests__/utils/mock-factories';
import { v4 as uuidv4 } from 'uuid';

const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

function createMockTag(overrides: Record<string, unknown> = {}) {
	return { id: uuidv4(), userId: TEST_USER_ID, name: 'Test', color: '#3B82F6', ...overrides };
}

describe('EventTagController', () => {
	let controller: EventTagController;
	let service: any;

	beforeEach(() => {
		service = {
			findByUserId: jest.fn(),
			findById: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};
		controller = new EventTagController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return all tags', async () => {
			const tags = [createMockTag(), createMockTag()];
			service.findByUserId.mockResolvedValue(tags);
			const result = await controller.findAll(mockUser as any);
			expect(result).toEqual({ tags });
		});
	});

	describe('findOne', () => {
		it('should return tag by id', async () => {
			const tag = createMockTag();
			service.findById.mockResolvedValue(tag);
			const result = await controller.findOne(mockUser as any, tag.id);
			expect(result).toEqual({ tag });
		});

		it('should throw NotFoundException when not found', async () => {
			service.findById.mockResolvedValue(null);
			await expect(controller.findOne(mockUser as any, 'bad-id')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create tag with userId', async () => {
			const tag = createMockTag({ name: 'Work' });
			service.create.mockResolvedValue(tag);
			const result = await controller.create(
				mockUser as any,
				{ name: 'Work', color: '#3B82F6' } as any
			);
			expect(result).toEqual({ tag });
			expect(service.create).toHaveBeenCalledWith({
				name: 'Work',
				color: '#3B82F6',
				userId: TEST_USER_ID,
			});
		});
	});

	describe('update', () => {
		it('should update tag', async () => {
			const tag = createMockTag({ name: 'Updated' });
			service.update.mockResolvedValue(tag);
			const result = await controller.update(mockUser as any, tag.id, { name: 'Updated' } as any);
			expect(result).toEqual({ tag });
		});
	});

	describe('delete', () => {
		it('should delete tag', async () => {
			service.delete.mockResolvedValue(undefined);
			const result = await controller.delete(mockUser as any, 'tag-id');
			expect(result).toEqual({ success: true });
		});
	});
});
