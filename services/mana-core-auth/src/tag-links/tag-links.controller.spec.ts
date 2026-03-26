import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TagLinksController } from './tag-links.controller';
import { TagLinksService } from './tag-links.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

describe('TagLinksController', () => {
	let controller: TagLinksController;
	let tagLinksService: jest.Mocked<TagLinksService>;

	const mockUser: CurrentUserData = {
		userId: 'test-user-id',
		email: 'test@example.com',
		role: 'user',
	};

	const mockTagLink = {
		id: 'link-1',
		tagId: 'tag-1',
		appId: 'todo',
		entityId: 'task-1',
		entityType: 'task',
		userId: 'test-user-id',
		createdAt: new Date(),
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

	const mockTagLinksServiceValue = {
		create: jest.fn(),
		bulkCreate: jest.fn(),
		delete: jest.fn(),
		query: jest.fn(),
		getTagsForEntity: jest.fn(),
		sync: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TagLinksController],
			providers: [
				{
					provide: TagLinksService,
					useValue: mockTagLinksServiceValue,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<TagLinksController>(TagLinksController);
		tagLinksService = module.get(TagLinksService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ============================================================================
	// POST /tag-links
	// ============================================================================

	describe('POST /tag-links', () => {
		it('should create a tag link and return it', async () => {
			const createDto = {
				tagId: 'tag-1',
				appId: 'todo',
				entityId: 'task-1',
				entityType: 'task',
			};

			tagLinksService.create.mockResolvedValue(mockTagLink);

			const result = await controller.create(mockUser, createDto);

			expect(result).toEqual(mockTagLink);
			expect(tagLinksService.create).toHaveBeenCalledWith('test-user-id', createDto);
		});

		it('should propagate NotFoundException when tag does not exist', async () => {
			const createDto = {
				tagId: 'nonexistent',
				appId: 'todo',
				entityId: 'task-1',
				entityType: 'task',
			};

			tagLinksService.create.mockRejectedValue(new NotFoundException('Tag not found'));

			await expect(controller.create(mockUser, createDto)).rejects.toThrow(NotFoundException);
		});
	});

	// ============================================================================
	// POST /tag-links/bulk
	// ============================================================================

	describe('POST /tag-links/bulk', () => {
		it('should bulk create tag links and return them', async () => {
			const links = [
				{ tagId: 'tag-1', appId: 'todo', entityId: 'task-1', entityType: 'task' },
				{ tagId: 'tag-2', appId: 'todo', entityId: 'task-1', entityType: 'task' },
			];
			const createdLinks = [mockTagLink, { ...mockTagLink, id: 'link-2', tagId: 'tag-2' }];

			tagLinksService.bulkCreate.mockResolvedValue(createdLinks);

			const result = await controller.bulkCreate(mockUser, { links });

			expect(result).toEqual(createdLinks);
			expect(tagLinksService.bulkCreate).toHaveBeenCalledWith('test-user-id', links);
		});

		it('should propagate NotFoundException when one or more tags not found', async () => {
			const links = [
				{ tagId: 'tag-1', appId: 'todo', entityId: 'task-1', entityType: 'task' },
				{ tagId: 'nonexistent', appId: 'todo', entityId: 'task-1', entityType: 'task' },
			];

			tagLinksService.bulkCreate.mockRejectedValue(
				new NotFoundException('One or more tags not found')
			);

			await expect(controller.bulkCreate(mockUser, { links })).rejects.toThrow(NotFoundException);
		});
	});

	// ============================================================================
	// PUT /tag-links/sync
	// ============================================================================

	describe('PUT /tag-links/sync', () => {
		it('should sync entity tags and return updated tag list', async () => {
			const syncDto = {
				appId: 'todo',
				entityId: 'task-1',
				entityType: 'task',
				tagIds: ['tag-1', 'tag-3'],
			};
			const updatedTags = [mockTag, { ...mockTag, id: 'tag-3', name: 'Familie' }];

			tagLinksService.sync.mockResolvedValue(updatedTags);

			const result = await controller.sync(mockUser, syncDto);

			expect(result).toEqual(updatedTags);
			expect(tagLinksService.sync).toHaveBeenCalledWith('test-user-id', 'todo', 'task-1', 'task', [
				'tag-1',
				'tag-3',
			]);
		});

		it('should propagate NotFoundException when tags do not belong to user', async () => {
			const syncDto = {
				appId: 'todo',
				entityId: 'task-1',
				entityType: 'task',
				tagIds: ['nonexistent'],
			};

			tagLinksService.sync.mockRejectedValue(new NotFoundException('One or more tags not found'));

			await expect(controller.sync(mockUser, syncDto)).rejects.toThrow(NotFoundException);
		});
	});

	// ============================================================================
	// GET /tag-links/tags-for-entity
	// ============================================================================

	describe('GET /tag-links/tags-for-entity', () => {
		it('should return full tag objects for an entity', async () => {
			const entityTags = [mockTag];

			tagLinksService.getTagsForEntity.mockResolvedValue(entityTags);

			const result = await controller.getTagsForEntity(mockUser, {
				appId: 'todo',
				entityId: 'task-1',
			});

			expect(result).toEqual(entityTags);
			expect(tagLinksService.getTagsForEntity).toHaveBeenCalledWith(
				'test-user-id',
				'todo',
				'task-1'
			);
		});

		it('should return empty array when entity has no tags', async () => {
			tagLinksService.getTagsForEntity.mockResolvedValue([]);

			const result = await controller.getTagsForEntity(mockUser, {
				appId: 'todo',
				entityId: 'task-99',
			});

			expect(result).toEqual([]);
		});
	});

	// ============================================================================
	// GET /tag-links
	// ============================================================================

	describe('GET /tag-links', () => {
		it('should query tag links with filters', async () => {
			const links = [mockTagLink];
			tagLinksService.query.mockResolvedValue(links);

			const queryDto = { appId: 'todo', entityType: 'task' };

			const result = await controller.query(mockUser, queryDto);

			expect(result).toEqual(links);
			expect(tagLinksService.query).toHaveBeenCalledWith('test-user-id', queryDto);
		});

		it('should return all links when no filters provided', async () => {
			const links = [mockTagLink, { ...mockTagLink, id: 'link-2', appId: 'calendar' }];
			tagLinksService.query.mockResolvedValue(links);

			const result = await controller.query(mockUser, {});

			expect(result).toEqual(links);
			expect(tagLinksService.query).toHaveBeenCalledWith('test-user-id', {});
		});
	});

	// ============================================================================
	// DELETE /tag-links/:id
	// ============================================================================

	describe('DELETE /tag-links/:id', () => {
		it('should delete a tag link and return void', async () => {
			tagLinksService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'link-1');

			expect(result).toBeUndefined();
			expect(tagLinksService.delete).toHaveBeenCalledWith('link-1', 'test-user-id');
		});

		it('should propagate NotFoundException when link does not exist', async () => {
			tagLinksService.delete.mockRejectedValue(new NotFoundException('Tag link not found'));

			await expect(controller.delete(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
		});
	});
});
