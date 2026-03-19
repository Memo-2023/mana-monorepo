import { NotFoundException } from '@nestjs/common';
import { TagController } from '../tag.controller';

const TEST_USER_ID = 'test-user-123';
const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

function createMockTag(overrides: Record<string, unknown> = {}) {
	return { id: 'tag-1', userId: TEST_USER_ID, name: 'Work', color: '#3B82F6', ...overrides };
}

describe('TagController', () => {
	let controller: TagController;
	let tagService: any;
	let contactService: any;

	beforeEach(() => {
		tagService = {
			findByUserId: jest.fn(),
			findById: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			addTagToContact: jest.fn(),
			removeTagFromContact: jest.fn(),
			getTagsForContact: jest.fn(),
		};
		contactService = { findById: jest.fn() };
		controller = new TagController(tagService, contactService);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return tags', async () => {
			const tags = [createMockTag()];
			tagService.findByUserId.mockResolvedValue(tags);
			const result = await controller.findAll(mockUser as any);
			expect(result).toEqual({ tags });
		});
	});

	describe('create', () => {
		it('should create tag with userId', async () => {
			const tag = createMockTag();
			tagService.create.mockResolvedValue(tag);
			await controller.create(mockUser as any, { name: 'Work' } as any);
			expect(tagService.create).toHaveBeenCalledWith({ name: 'Work', userId: TEST_USER_ID });
		});
	});

	describe('delete', () => {
		it('should delete tag', async () => {
			tagService.delete.mockResolvedValue(undefined);
			const result = await controller.delete(mockUser as any, 'tag-1');
			expect(result).toEqual({ success: true });
		});
	});

	describe('addToContact', () => {
		it('should add tag to contact', async () => {
			tagService.findById.mockResolvedValue(createMockTag());
			contactService.findById.mockResolvedValue({ id: 'c1' });
			const result = await controller.addToContact(mockUser as any, 'tag-1', 'c1');
			expect(result).toEqual({ success: true });
		});

		it('should throw when tag not found', async () => {
			tagService.findById.mockResolvedValue(null);
			await expect(controller.addToContact(mockUser as any, 'bad', 'c1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw when contact not found', async () => {
			tagService.findById.mockResolvedValue(createMockTag());
			contactService.findById.mockResolvedValue(null);
			await expect(controller.addToContact(mockUser as any, 't1', 'bad')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('getTagsForContact', () => {
		it('should return tag IDs', async () => {
			tagService.getTagsForContact.mockResolvedValue(['tag-1']);
			const result = await controller.getTagsForContact(mockUser as any, 'c1');
			expect(result).toEqual({ tagIds: ['tag-1'] });
		});
	});
});
