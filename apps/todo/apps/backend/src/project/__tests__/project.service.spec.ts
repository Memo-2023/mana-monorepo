import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectService } from '../project.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const mockDb = {
	query: {
		projects: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
		},
	},
	insert: jest.fn().mockReturnThis(),
	update: jest.fn().mockReturnThis(),
	delete: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	set: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	returning: jest.fn(),
};

describe('ProjectService', () => {
	let service: ProjectService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<ProjectService>(ProjectService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAll', () => {
		it('should return all projects for a user', async () => {
			const userId = 'user-123';
			const mockProjects = [
				{ id: 'proj-1', name: 'Work', userId, order: 0 },
				{ id: 'proj-2', name: 'Personal', userId, order: 1 },
			];

			mockDb.query.projects.findMany.mockResolvedValue(mockProjects);

			const result = await service.findAll(userId);

			expect(result).toHaveLength(2);
			expect(mockDb.query.projects.findMany).toHaveBeenCalled();
		});

		it('should return empty array when no projects', async () => {
			mockDb.query.projects.findMany.mockResolvedValue([]);

			const result = await service.findAll('user-123');

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return a project when found', async () => {
			const userId = 'user-123';
			const projectId = 'proj-1';
			const mockProject = { id: projectId, name: 'Work', userId };

			mockDb.query.projects.findFirst.mockResolvedValue(mockProject);

			const result = await service.findById(projectId, userId);

			expect(result).toBeDefined();
			expect(result?.id).toBe(projectId);
		});

		it('should return null when project not found', async () => {
			mockDb.query.projects.findFirst.mockResolvedValue(undefined);

			const result = await service.findById('non-existent', 'user-123');

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return a project when found', async () => {
			const userId = 'user-123';
			const projectId = 'proj-1';
			const mockProject = { id: projectId, name: 'Work', userId };

			mockDb.query.projects.findFirst.mockResolvedValue(mockProject);

			const result = await service.findByIdOrThrow(projectId, userId);

			expect(result.id).toBe(projectId);
		});

		it('should throw NotFoundException when project not found', async () => {
			mockDb.query.projects.findFirst.mockResolvedValue(undefined);

			await expect(service.findByIdOrThrow('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a project with correct order', async () => {
			const userId = 'user-123';
			const dto = { name: 'New Project', color: '#ff0000', icon: 'star' };
			const existingProjects = [
				{ id: 'proj-1', name: 'Work', userId, order: 0 },
				{ id: 'proj-2', name: 'Personal', userId, order: 1 },
			];
			const createdProject = { id: 'proj-new', ...dto, userId, order: 2 };

			mockDb.query.projects.findMany.mockResolvedValue(existingProjects);
			mockDb.returning.mockResolvedValue([createdProject]);

			const result = await service.create(userId, dto);

			expect(result.order).toBe(2);
			expect(result.name).toBe('New Project');
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should set order to 0 when no existing projects', async () => {
			const userId = 'user-123';
			const dto = { name: 'First Project' };
			const createdProject = {
				id: 'proj-first',
				name: 'First Project',
				userId,
				order: 0,
				isDefault: true,
			};

			mockDb.query.projects.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([createdProject]);

			const result = await service.create(userId, dto);

			expect(result.order).toBe(0);
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update a project', async () => {
			const userId = 'user-123';
			const projectId = 'proj-1';
			const dto = { name: 'Updated Name' };
			const existingProject = { id: projectId, name: 'Original', userId };
			const updatedProject = { id: projectId, name: 'Updated Name', userId };

			mockDb.query.projects.findFirst.mockResolvedValue(existingProject);
			mockDb.returning.mockResolvedValue([updatedProject]);

			const result = await service.update(projectId, userId, dto);

			expect(result.name).toBe('Updated Name');
		});

		it('should throw when project does not exist', async () => {
			mockDb.query.projects.findFirst.mockResolvedValue(undefined);

			await expect(service.update('non-existent', 'user-123', { name: 'Test' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete a project', async () => {
			const userId = 'user-123';
			const projectId = 'proj-1';
			const existingProject = { id: projectId, userId, isDefault: false };

			mockDb.query.projects.findFirst.mockResolvedValue(existingProject);

			await service.delete(projectId, userId);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw when project does not exist', async () => {
			mockDb.query.projects.findFirst.mockResolvedValue(undefined);

			await expect(service.delete('non-existent', 'user-123')).rejects.toThrow(NotFoundException);
		});

		it('should throw when trying to delete the default project', async () => {
			const userId = 'user-123';
			const projectId = 'proj-default';
			const defaultProject = { id: projectId, userId, isDefault: true };

			mockDb.query.projects.findFirst.mockResolvedValue(defaultProject);

			await expect(service.delete(projectId, userId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('archive', () => {
		it('should archive a project', async () => {
			const userId = 'user-123';
			const projectId = 'proj-1';
			const existingProject = { id: projectId, userId, isArchived: false };
			const archivedProject = { ...existingProject, isArchived: true };

			mockDb.query.projects.findFirst.mockResolvedValue(existingProject);
			mockDb.returning.mockResolvedValue([archivedProject]);

			const result = await service.archive(projectId, userId);

			expect(result.isArchived).toBe(true);
		});
	});

	describe('reorder', () => {
		it('should update order for each project and return all', async () => {
			const userId = 'user-123';
			const projectIds = ['proj-2', 'proj-1', 'proj-3'];
			const reorderedProjects = [
				{ id: 'proj-2', order: 0 },
				{ id: 'proj-1', order: 1 },
				{ id: 'proj-3', order: 2 },
			];

			// Mock for the final findAll call
			mockDb.query.projects.findMany.mockResolvedValue(reorderedProjects);

			const result = await service.reorder(userId, projectIds);

			expect(mockDb.update).toHaveBeenCalledTimes(3);
			expect(result).toEqual(reorderedProjects);
		});
	});
});
