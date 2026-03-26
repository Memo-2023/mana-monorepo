import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

describe('TagsController', () => {
	let controller: TagsController;
	let tagsService: jest.Mocked<TagsService>;

	const mockUser: CurrentUserData = {
		userId: 'test-user-id',
		email: 'test@example.com',
		role: 'user',
	};

	const mockTag = {
		id: 'tag-1',
		userId: 'test-user-id',
		name: 'Arbeit',
		color: '#3B82F6',
		icon: 'Briefcase',
		groupId: null,
		sortOrder: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockTagsServiceValue = {
		findByUserId: jest.fn(),
		findById: jest.fn(),
		getByIds: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		createDefaultTags: jest.fn(),
		findByGroupId: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TagsController],
			providers: [
				{
					provide: TagsService,
					useValue: mockTagsServiceValue,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<TagsController>(TagsController);
		tagsService = module.get(TagsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ============================================================================
	// GET /tags
	// ============================================================================

	describe('GET /tags', () => {
		it('should return all tags for the authenticated user', async () => {
			const userTags = [
				mockTag,
				{ ...mockTag, id: 'tag-2', name: 'Persönlich', color: '#10B981', icon: 'User' },
			];

			tagsService.findByUserId.mockResolvedValue(userTags);

			const result = await controller.findAll(mockUser);

			expect(result).toEqual(userTags);
			expect(tagsService.findByUserId).toHaveBeenCalledWith('test-user-id');
		});

		it('should return empty array when user has no tags', async () => {
			tagsService.findByUserId.mockResolvedValue([]);

			const result = await controller.findAll(mockUser);

			expect(result).toEqual([]);
		});
	});

	// ============================================================================
	// GET /tags/by-ids
	// ============================================================================

	describe('GET /tags/by-ids', () => {
		it('should resolve tag IDs to full tag objects', async () => {
			const resolvedTags = [mockTag];
			tagsService.getByIds.mockResolvedValue(resolvedTags);

			const result = await controller.getByIds(mockUser, 'tag-1,tag-2');

			expect(result).toEqual(resolvedTags);
			expect(tagsService.getByIds).toHaveBeenCalledWith(['tag-1', 'tag-2'], 'test-user-id');
		});

		it('should return empty array when no ids provided', async () => {
			const result = await controller.getByIds(mockUser, undefined);

			expect(result).toEqual([]);
			expect(tagsService.getByIds).not.toHaveBeenCalled();
		});

		it('should return empty array when ids is empty string', async () => {
			const result = await controller.getByIds(mockUser, '');

			expect(result).toEqual([]);
			expect(tagsService.getByIds).not.toHaveBeenCalled();
		});
	});

	// ============================================================================
	// GET /tags/:id
	// ============================================================================

	describe('GET /tags/:id', () => {
		it('should return a single tag by ID', async () => {
			tagsService.findById.mockResolvedValue(mockTag);

			const result = await controller.findOne(mockUser, 'tag-1');

			expect(result).toEqual(mockTag);
			expect(tagsService.findById).toHaveBeenCalledWith('tag-1', 'test-user-id');
		});

		it('should return null when tag not found', async () => {
			tagsService.findById.mockResolvedValue(null as any);

			const result = await controller.findOne(mockUser, 'nonexistent');

			expect(result).toBeNull();
		});
	});

	// ============================================================================
	// POST /tags
	// ============================================================================

	describe('POST /tags', () => {
		it('should create a new tag and return it', async () => {
			const createDto = { name: 'Neuer Tag', color: '#FF5733', icon: 'Star' };
			const createdTag = { ...mockTag, ...createDto, id: 'tag-new' };

			tagsService.create.mockResolvedValue(createdTag);

			const result = await controller.create(mockUser, createDto);

			expect(result).toEqual(createdTag);
			expect(tagsService.create).toHaveBeenCalledWith('test-user-id', createDto);
		});

		it('should propagate ConflictException for duplicate tag name', async () => {
			const createDto = { name: 'Arbeit' };

			tagsService.create.mockRejectedValue(new ConflictException('Tag "Arbeit" already exists'));

			await expect(controller.create(mockUser, createDto)).rejects.toThrow(ConflictException);
		});
	});

	// ============================================================================
	// POST /tags/defaults
	// ============================================================================

	describe('POST /tags/defaults', () => {
		it('should create default tags for the user', async () => {
			const defaultTags = [
				{ ...mockTag, name: 'Arbeit' },
				{ ...mockTag, id: 'tag-2', name: 'Persönlich' },
				{ ...mockTag, id: 'tag-3', name: 'Familie' },
				{ ...mockTag, id: 'tag-4', name: 'Wichtig' },
			];

			tagsService.createDefaultTags.mockResolvedValue(defaultTags);

			const result = await controller.createDefaults(mockUser);

			expect(result).toEqual(defaultTags);
			expect(tagsService.createDefaultTags).toHaveBeenCalledWith('test-user-id');
		});
	});

	// ============================================================================
	// PUT /tags/:id
	// ============================================================================

	describe('PUT /tags/:id', () => {
		it('should update a tag and return the updated version', async () => {
			const updateDto = { name: 'Aktualisiert', color: '#000000' };
			const updatedTag = { ...mockTag, ...updateDto };

			tagsService.update.mockResolvedValue(updatedTag);

			const result = await controller.update(mockUser, 'tag-1', updateDto);

			expect(result).toEqual(updatedTag);
			expect(tagsService.update).toHaveBeenCalledWith('tag-1', 'test-user-id', updateDto);
		});

		it('should propagate NotFoundException when tag does not exist', async () => {
			const updateDto = { name: 'Updated' };

			tagsService.update.mockRejectedValue(new NotFoundException('Tag not found'));

			await expect(controller.update(mockUser, 'nonexistent', updateDto)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ============================================================================
	// DELETE /tags/:id
	// ============================================================================

	describe('DELETE /tags/:id', () => {
		it('should delete a tag and return void', async () => {
			tagsService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'tag-1');

			expect(result).toBeUndefined();
			expect(tagsService.delete).toHaveBeenCalledWith('tag-1', 'test-user-id');
		});

		it('should propagate NotFoundException when tag does not exist', async () => {
			tagsService.delete.mockRejectedValue(new NotFoundException('Tag not found'));

			await expect(controller.delete(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
		});
	});
});
