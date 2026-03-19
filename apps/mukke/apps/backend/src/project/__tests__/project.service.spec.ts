import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectService } from '../project.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import {
	createMockProject,
	createMockSong,
	createMockBeat,
	TEST_USER_ID,
} from '../../__tests__/utils/mock-factories';

describe('ProjectService', () => {
	let service: ProjectService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			transaction: jest.fn(),
		};

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
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByUserId', () => {
		it('should return all projects for a user ordered by updatedAt', async () => {
			const projectList = [
				createMockProject({ title: 'Project 1', updatedAt: new Date('2025-02-01') }),
				createMockProject({ title: 'Project 2', updatedAt: new Date('2025-01-01') }),
			];
			mockDb.orderBy.mockResolvedValueOnce(projectList);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual(projectList);
			expect(result).toHaveLength(2);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
		});

		it('should return empty array when no projects', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return project when found', async () => {
			const project = createMockProject();
			mockDb.where.mockResolvedValueOnce([project]);

			const result = await service.findById(project.id, TEST_USER_ID);

			expect(result).toEqual(project);
		});

		it('should return null when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return project when found', async () => {
			const project = createMockProject();
			mockDb.where.mockResolvedValueOnce([project]);

			const result = await service.findByIdOrThrow(project.id, TEST_USER_ID);

			expect(result).toEqual(project);
		});

		it('should throw NotFoundException when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByIdOrThrow('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a new project', async () => {
			const project = createMockProject({ title: 'New Project' });
			mockDb.returning.mockResolvedValueOnce([project]);

			const result = await service.create({
				userId: TEST_USER_ID,
				title: 'New Project',
				description: 'A new project',
			});

			expect(result).toEqual(project);
			expect(result.title).toBe('New Project');
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
			expect(mockDb.returning).toHaveBeenCalled();
		});

		it('should create a project without description', async () => {
			const project = createMockProject({ title: 'Minimal Project', description: null });
			mockDb.returning.mockResolvedValueOnce([project]);

			const result = await service.create({
				userId: TEST_USER_ID,
				title: 'Minimal Project',
			});

			expect(result).toEqual(project);
			expect(result.description).toBeNull();
		});
	});

	describe('update', () => {
		it('should update project title', async () => {
			const project = createMockProject();
			const updatedProject = createMockProject({ ...project, title: 'Updated Title' });

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([project]);
			// update returning
			mockDb.returning.mockResolvedValueOnce([updatedProject]);

			const result = await service.update(project.id, TEST_USER_ID, {
				title: 'Updated Title',
			});

			expect(result.title).toBe('Updated Title');
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should update project description', async () => {
			const project = createMockProject();
			const updatedProject = createMockProject({
				...project,
				description: 'Updated description',
			});

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([project]);
			// update returning
			mockDb.returning.mockResolvedValueOnce([updatedProject]);

			const result = await service.update(project.id, TEST_USER_ID, {
				description: 'Updated description',
			});

			expect(result.description).toBe('Updated description');
		});

		it('should throw NotFoundException for non-existent project', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { title: 'New Title' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		it('should delete project', async () => {
			const project = createMockProject();

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([project]);
			// db.delete().where()
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.delete(project.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent project', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('createFromSong', () => {
		it('should create project from song with artist in title', async () => {
			const song = createMockSong({ title: 'My Song', artist: 'My Artist' });
			const project = createMockProject({
				title: 'My Song - My Artist',
				songId: song.id,
			});

			// find song
			mockDb.where.mockResolvedValueOnce([song]);

			// mock transaction
			const mockTx = {
				insert: jest.fn().mockReturnThis(),
				values: jest.fn().mockReturnThis(),
				returning: jest.fn(),
			};

			mockDb.transaction.mockImplementation(async (callback: any) => {
				// insert project returning
				mockTx.returning.mockResolvedValueOnce([project]);
				// insert beat (no returning needed since result isn't used)
				mockTx.returning.mockResolvedValueOnce([createMockBeat()]);

				return callback(mockTx);
			});

			const result = await service.createFromSong(song.id, TEST_USER_ID);

			expect(result).toEqual(project);
			expect(result.title).toBe('My Song - My Artist');
			expect(mockDb.transaction).toHaveBeenCalled();
			expect(mockTx.insert).toHaveBeenCalledTimes(2); // project + beat
		});

		it('should create project from song without artist', async () => {
			const song = createMockSong({ title: 'Solo Song', artist: null });
			const project = createMockProject({
				title: 'Solo Song',
				songId: song.id,
			});

			// find song
			mockDb.where.mockResolvedValueOnce([song]);

			const mockTx = {
				insert: jest.fn().mockReturnThis(),
				values: jest.fn().mockReturnThis(),
				returning: jest.fn(),
			};

			mockDb.transaction.mockImplementation(async (callback: any) => {
				mockTx.returning.mockResolvedValueOnce([project]);
				mockTx.returning.mockResolvedValueOnce([createMockBeat()]);
				return callback(mockTx);
			});

			const result = await service.createFromSong(song.id, TEST_USER_ID);

			expect(result.title).toBe('Solo Song');
		});

		it('should throw NotFoundException when song not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.createFromSong('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('getProjectWithRelations', () => {
		it('should return project with beat and lyrics', async () => {
			const project = createMockProject();
			const beat = createMockBeat({ projectId: project.id });
			const projectLyrics = { id: 'lyrics-1', projectId: project.id, content: 'Hello world' };

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([project]);
			// find beat
			mockDb.where.mockResolvedValueOnce([beat]);
			// find lyrics
			mockDb.where.mockResolvedValueOnce([projectLyrics]);

			const result = await service.getProjectWithRelations(project.id, TEST_USER_ID);

			expect(result.id).toBe(project.id);
			expect(result.beat).toEqual(beat);
			expect(result.lyrics).toEqual(projectLyrics);
		});

		it('should return project with null beat and lyrics when none exist', async () => {
			const project = createMockProject();

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([project]);
			// find beat (none)
			mockDb.where.mockResolvedValueOnce([]);
			// find lyrics (none)
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getProjectWithRelations(project.id, TEST_USER_ID);

			expect(result.id).toBe(project.id);
			expect(result.beat).toBeNull();
			expect(result.lyrics).toBeNull();
		});

		it('should throw NotFoundException for non-existent project', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.getProjectWithRelations('non-existent-id', TEST_USER_ID)
			).rejects.toThrow(NotFoundException);
		});
	});
});
