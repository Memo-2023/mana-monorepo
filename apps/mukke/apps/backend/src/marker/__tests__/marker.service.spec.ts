import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MarkerService } from '../marker.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import {
	createMockMarker,
	createMockBeat,
	createMockProject,
	TEST_USER_ID,
} from '../../__tests__/utils/mock-factories';

describe('MarkerService', () => {
	let service: MarkerService;
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
				MarkerService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<MarkerService>(MarkerService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('verifyBeatOwnership', () => {
		it('should not throw when beat and project belong to user', async () => {
			const beat = createMockBeat();
			const project = createMockProject({ id: beat.projectId });

			// find beat
			mockDb.where.mockResolvedValueOnce([beat]);
			// find project
			mockDb.where.mockResolvedValueOnce([project]);

			await expect(service.verifyBeatOwnership(beat.id, TEST_USER_ID)).resolves.not.toThrow();
		});

		it('should throw NotFoundException when beat not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.verifyBeatOwnership('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw NotFoundException when project not found for user', async () => {
			const beat = createMockBeat();

			// find beat
			mockDb.where.mockResolvedValueOnce([beat]);
			// find project (not found for user)
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.verifyBeatOwnership(beat.id, TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('findByBeatId', () => {
		it('should return markers ordered by start time', async () => {
			const beatId = 'beat-1';
			const markerList = [
				createMockMarker({ beatId, startTime: 0.0, label: 'Intro' }),
				createMockMarker({ beatId, startTime: 30.0, label: 'Verse 1' }),
				createMockMarker({ beatId, startTime: 60.0, label: 'Chorus' }),
			];
			mockDb.orderBy.mockResolvedValueOnce(markerList);

			const result = await service.findByBeatId(beatId);

			expect(result).toEqual(markerList);
			expect(result).toHaveLength(3);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
		});

		it('should return empty array when no markers', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.findByBeatId('beat-with-no-markers');

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return marker when found', async () => {
			const marker = createMockMarker();
			mockDb.where.mockResolvedValueOnce([marker]);

			const result = await service.findById(marker.id);

			expect(result).toEqual(marker);
		});

		it('should return null when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id');

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return marker when found', async () => {
			const marker = createMockMarker();
			mockDb.where.mockResolvedValueOnce([marker]);

			const result = await service.findByIdOrThrow(marker.id);

			expect(result).toEqual(marker);
		});

		it('should throw NotFoundException when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByIdOrThrow('non-existent-id')).rejects.toThrow(NotFoundException);
		});
	});

	describe('create', () => {
		it('should create a new marker', async () => {
			const marker = createMockMarker();
			mockDb.returning.mockResolvedValueOnce([marker]);

			const result = await service.create({
				beatId: marker.beatId,
				type: 'section',
				label: 'Verse 1',
				startTime: 0.0,
				endTime: 30.0,
				color: '#FF0000',
			});

			expect(result).toEqual(marker);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
			expect(mockDb.returning).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update marker fields', async () => {
			const marker = createMockMarker();
			const beat = createMockBeat({ id: marker.beatId });
			const project = createMockProject({ id: beat.projectId });
			const updatedMarker = createMockMarker({
				...marker,
				label: 'Updated Label',
				startTime: 15.0,
			});

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([marker]);
			// verifyBeatOwnership -> find beat
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyBeatOwnership -> find project
			mockDb.where.mockResolvedValueOnce([project]);
			// update returning
			mockDb.returning.mockResolvedValueOnce([updatedMarker]);

			const result = await service.update(marker.id, TEST_USER_ID, {
				label: 'Updated Label',
				startTime: 15.0,
			});

			expect(result).toEqual(updatedMarker);
			expect(result.label).toBe('Updated Label');
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent marker', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { label: 'New Label' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		it('should delete marker', async () => {
			const marker = createMockMarker();
			const beat = createMockBeat({ id: marker.beatId });
			const project = createMockProject({ id: beat.projectId });

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([marker]);
			// verifyBeatOwnership -> find beat
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyBeatOwnership -> find project
			mockDb.where.mockResolvedValueOnce([project]);
			// db.delete().where()
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.delete(marker.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent marker', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('deleteAllForBeat', () => {
		it('should delete all markers for a beat', async () => {
			const beat = createMockBeat();
			const project = createMockProject({ id: beat.projectId });

			// verifyBeatOwnership -> find beat
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyBeatOwnership -> find project
			mockDb.where.mockResolvedValueOnce([project]);
			// db.delete().where()
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.deleteAllForBeat(beat.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException if beat not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.deleteAllForBeat('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('bulkCreate', () => {
		it('should create multiple markers for a beat', async () => {
			const beatId = 'beat-1';
			const beat = createMockBeat({ id: beatId });
			const project = createMockProject({ id: beat.projectId });
			const createdMarkers = [
				createMockMarker({ beatId, label: 'Intro', startTime: 0.0 }),
				createMockMarker({ beatId, label: 'Verse', startTime: 30.0 }),
			];

			// verifyBeatOwnership -> find beat
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyBeatOwnership -> find project
			mockDb.where.mockResolvedValueOnce([project]);
			// insert returning
			mockDb.returning.mockResolvedValueOnce(createdMarkers);

			const result = await service.bulkCreate(beatId, TEST_USER_ID, [
				{ type: 'section', label: 'Intro', startTime: 0.0 },
				{ type: 'section', label: 'Verse', startTime: 30.0 },
			]);

			expect(result).toEqual(createdMarkers);
			expect(result).toHaveLength(2);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should return empty array for empty items list', async () => {
			const beatId = 'beat-1';
			const beat = createMockBeat({ id: beatId });
			const project = createMockProject({ id: beat.projectId });

			// verifyBeatOwnership -> find beat
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyBeatOwnership -> find project
			mockDb.where.mockResolvedValueOnce([project]);

			const result = await service.bulkCreate(beatId, TEST_USER_ID, []);

			expect(result).toEqual([]);
			expect(mockDb.insert).not.toHaveBeenCalled();
		});
	});

	describe('bulkUpdate', () => {
		it('should update multiple markers in a transaction', async () => {
			const beatId = 'beat-1';
			const marker1 = createMockMarker({ id: 'marker-1', beatId, startTime: 0.0 });
			const marker2 = createMockMarker({ id: 'marker-2', beatId, startTime: 30.0 });
			const beat = createMockBeat({ id: beatId });
			const project = createMockProject({ id: beat.projectId });

			const updatedMarker1 = { ...marker1, startTime: 5.0 };
			const updatedMarker2 = { ...marker2, startTime: 35.0 };

			// Mock the transaction callback
			const mockTx = {
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				returning: jest.fn(),
			};

			mockDb.transaction.mockImplementation(async (callback: any) => {
				// First marker: findByIdOrThrow -> findById
				mockDb.where.mockResolvedValueOnce([marker1]);
				// First marker: verifyBeatOwnership -> find beat
				mockDb.where.mockResolvedValueOnce([beat]);
				// First marker: verifyBeatOwnership -> find project
				mockDb.where.mockResolvedValueOnce([project]);
				// First marker: tx.update returning
				mockTx.returning.mockResolvedValueOnce([updatedMarker1]);

				// Second marker: findByIdOrThrow -> findById
				mockDb.where.mockResolvedValueOnce([marker2]);
				// Second marker: verifyBeatOwnership -> find beat
				mockDb.where.mockResolvedValueOnce([beat]);
				// Second marker: verifyBeatOwnership -> find project
				mockDb.where.mockResolvedValueOnce([project]);
				// Second marker: tx.update returning
				mockTx.returning.mockResolvedValueOnce([updatedMarker2]);

				return callback(mockTx);
			});

			const result = await service.bulkUpdate(TEST_USER_ID, [
				{ id: 'marker-1', data: { startTime: 5.0 } },
				{ id: 'marker-2', data: { startTime: 35.0 } },
			]);

			expect(result).toEqual([updatedMarker1, updatedMarker2]);
			expect(result).toHaveLength(2);
			expect(mockDb.transaction).toHaveBeenCalled();
			expect(mockTx.update).toHaveBeenCalledTimes(2);
		});

		it('should throw NotFoundException if a marker is not found during bulk update', async () => {
			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: jest.fn().mockReturnThis(),
					set: jest.fn().mockReturnThis(),
					where: jest.fn().mockReturnThis(),
					returning: jest.fn(),
				};

				// findByIdOrThrow -> findById (not found)
				mockDb.where.mockResolvedValueOnce([]);

				return callback(mockTx);
			});

			await expect(
				service.bulkUpdate(TEST_USER_ID, [{ id: 'non-existent-id', data: { startTime: 5.0 } }])
			).rejects.toThrow(NotFoundException);
		});
	});
});
