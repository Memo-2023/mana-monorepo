import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TagGroupsController } from './tag-groups.controller';
import { TagGroupsService } from './tag-groups.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

describe('TagGroupsController', () => {
	let controller: TagGroupsController;
	let tagGroupsService: jest.Mocked<TagGroupsService>;

	const mockUser: CurrentUserData = {
		userId: 'test-user-id',
		email: 'test@example.com',
		role: 'user',
	};

	const mockTagGroup = {
		id: 'group-1',
		userId: 'test-user-id',
		name: 'Kategorien',
		color: '#3B82F6',
		icon: null,
		sortOrder: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockTagGroupsServiceValue = {
		findByUserId: jest.fn(),
		findById: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		reorder: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TagGroupsController],
			providers: [
				{
					provide: TagGroupsService,
					useValue: mockTagGroupsServiceValue,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<TagGroupsController>(TagGroupsController);
		tagGroupsService = module.get(TagGroupsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// ============================================================================
	// GET /tag-groups
	// ============================================================================

	describe('GET /tag-groups', () => {
		it('should return all tag groups for the authenticated user', async () => {
			const groups = [
				mockTagGroup,
				{ ...mockTagGroup, id: 'group-2', name: 'Projekte', sortOrder: 1 },
			];

			tagGroupsService.findByUserId.mockResolvedValue(groups);

			const result = await controller.findAll(mockUser);

			expect(result).toEqual(groups);
			expect(tagGroupsService.findByUserId).toHaveBeenCalledWith('test-user-id');
		});

		it('should return empty array when user has no groups', async () => {
			tagGroupsService.findByUserId.mockResolvedValue([]);

			const result = await controller.findAll(mockUser);

			expect(result).toEqual([]);
		});
	});

	// ============================================================================
	// POST /tag-groups
	// ============================================================================

	describe('POST /tag-groups', () => {
		it('should create a new tag group and return it', async () => {
			const createDto = { name: 'Neues Projekt', color: '#10B981' };
			const createdGroup = { ...mockTagGroup, ...createDto, id: 'group-new' };

			tagGroupsService.create.mockResolvedValue(createdGroup);

			const result = await controller.create(mockUser, createDto);

			expect(result).toEqual(createdGroup);
			expect(tagGroupsService.create).toHaveBeenCalledWith('test-user-id', createDto);
		});

		it('should propagate ConflictException for duplicate group name', async () => {
			const createDto = { name: 'Kategorien' };

			tagGroupsService.create.mockRejectedValue(
				new ConflictException('Tag group "Kategorien" already exists')
			);

			await expect(controller.create(mockUser, createDto)).rejects.toThrow(ConflictException);
		});
	});

	// ============================================================================
	// PUT /tag-groups/reorder
	// ============================================================================

	describe('PUT /tag-groups/reorder', () => {
		it('should reorder tag groups and return updated list', async () => {
			const reorderedGroups = [
				{ ...mockTagGroup, id: 'group-2', sortOrder: 0 },
				{ ...mockTagGroup, id: 'group-1', sortOrder: 1 },
			];

			tagGroupsService.reorder.mockResolvedValue(reorderedGroups);

			const result = await controller.reorder(mockUser, { ids: ['group-2', 'group-1'] });

			expect(result).toEqual(reorderedGroups);
			expect(tagGroupsService.reorder).toHaveBeenCalledWith('test-user-id', ['group-2', 'group-1']);
		});

		it('should propagate NotFoundException when a group ID is invalid', async () => {
			tagGroupsService.reorder.mockRejectedValue(
				new NotFoundException('One or more tag groups not found')
			);

			await expect(
				controller.reorder(mockUser, { ids: ['group-1', 'nonexistent'] })
			).rejects.toThrow(NotFoundException);
		});
	});

	// ============================================================================
	// PUT /tag-groups/:id
	// ============================================================================

	describe('PUT /tag-groups/:id', () => {
		it('should update a tag group and return the updated version', async () => {
			const updateDto = { name: 'Umbenannt', color: '#EF4444' };
			const updatedGroup = { ...mockTagGroup, ...updateDto };

			tagGroupsService.update.mockResolvedValue(updatedGroup);

			const result = await controller.update(mockUser, 'group-1', updateDto);

			expect(result).toEqual(updatedGroup);
			expect(tagGroupsService.update).toHaveBeenCalledWith('group-1', 'test-user-id', updateDto);
		});

		it('should propagate NotFoundException when group does not exist', async () => {
			const updateDto = { name: 'Updated' };

			tagGroupsService.update.mockRejectedValue(new NotFoundException('Tag group not found'));

			await expect(controller.update(mockUser, 'nonexistent', updateDto)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should propagate ConflictException when renaming to an existing name', async () => {
			const updateDto = { name: 'Kategorien' };

			tagGroupsService.update.mockRejectedValue(
				new ConflictException('Tag group "Kategorien" already exists')
			);

			await expect(controller.update(mockUser, 'group-2', updateDto)).rejects.toThrow(
				ConflictException
			);
		});
	});

	// ============================================================================
	// DELETE /tag-groups/:id
	// ============================================================================

	describe('DELETE /tag-groups/:id', () => {
		it('should delete a tag group and return void', async () => {
			tagGroupsService.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser, 'group-1');

			expect(result).toBeUndefined();
			expect(tagGroupsService.delete).toHaveBeenCalledWith('group-1', 'test-user-id');
		});

		it('should propagate NotFoundException when group does not exist', async () => {
			tagGroupsService.delete.mockRejectedValue(new NotFoundException('Tag group not found'));

			await expect(controller.delete(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
		});
	});
});
