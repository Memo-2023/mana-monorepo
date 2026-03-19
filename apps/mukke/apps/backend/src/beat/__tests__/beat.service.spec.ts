import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BeatService } from '../beat.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import { SttService } from '../../stt/stt.service';
import { LyricsService } from '../../lyrics/lyrics.service';
import {
	createMockBeat,
	createMockProject,
	createMockLibraryBeat,
	TEST_USER_ID,
} from '../../__tests__/utils/mock-factories';

// Mock the storage module
jest.mock('@manacore/shared-storage', () => ({
	createMukkeStorage: jest.fn(() => ({
		getUploadUrl: jest.fn().mockResolvedValue('https://s3.example.com/upload'),
		getDownloadUrl: jest.fn().mockResolvedValue('https://s3.example.com/download'),
		delete: jest.fn().mockResolvedValue(undefined),
		download: jest.fn().mockResolvedValue(Buffer.from('fake-audio-data')),
	})),
	generateUserFileKey: jest.fn((userId: string, filename: string) => `users/${userId}/${filename}`),
	getContentType: jest.fn((filename: string) => {
		if (filename.endsWith('.mp3')) return 'audio/mpeg';
		if (filename.endsWith('.wav')) return 'audio/wav';
		if (filename.endsWith('.txt')) return 'text/plain';
		return 'application/octet-stream';
	}),
}));

describe('BeatService', () => {
	let service: BeatService;
	let mockDb: any;
	let mockSttService: any;
	let mockLyricsService: any;

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

		mockSttService = {
			isAvailable: jest.fn(),
			transcribe: jest.fn(),
		};

		mockLyricsService = {
			createOrUpdate: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BeatService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: SttService,
					useValue: mockSttService,
				},
				{
					provide: LyricsService,
					useValue: mockLyricsService,
				},
			],
		}).compile();

		service = module.get<BeatService>(BeatService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByProjectId', () => {
		it('should return beat when found', async () => {
			const beat = createMockBeat();
			mockDb.where.mockResolvedValueOnce([beat]);

			const result = await service.findByProjectId(beat.projectId);

			expect(result).toEqual(beat);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return null when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findByProjectId('non-existent-id');

			expect(result).toBeNull();
		});
	});

	describe('findById', () => {
		it('should return beat when found', async () => {
			const beat = createMockBeat();
			mockDb.where.mockResolvedValueOnce([beat]);

			const result = await service.findById(beat.id);

			expect(result).toEqual(beat);
		});

		it('should return null when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id');

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return beat when found', async () => {
			const beat = createMockBeat();
			mockDb.where.mockResolvedValueOnce([beat]);

			const result = await service.findByIdOrThrow(beat.id);

			expect(result).toEqual(beat);
		});

		it('should throw NotFoundException when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByIdOrThrow('non-existent-id')).rejects.toThrow(NotFoundException);
		});
	});

	describe('verifyProjectOwnership', () => {
		it('should not throw when project belongs to user', async () => {
			const project = createMockProject();
			mockDb.where.mockResolvedValueOnce([project]);

			await expect(service.verifyProjectOwnership(project.id, TEST_USER_ID)).resolves.not.toThrow();
		});

		it('should throw NotFoundException when project not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.verifyProjectOwnership('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('createUploadUrl', () => {
		it('should create beat record and return upload URL', async () => {
			const project = createMockProject();
			const beat = createMockBeat({ projectId: project.id });

			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// findByProjectId (no existing beat)
			mockDb.where.mockResolvedValueOnce([]);
			// insert returning
			mockDb.returning.mockResolvedValueOnce([beat]);

			const result = await service.createUploadUrl(project.id, TEST_USER_ID, 'test.mp3');

			expect(result.beat).toEqual(beat);
			expect(result.uploadUrl).toBe('https://s3.example.com/upload');
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should reject non-audio files', async () => {
			const project = createMockProject();

			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// findByProjectId (no existing beat)
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.createUploadUrl(project.id, TEST_USER_ID, 'test.txt')).rejects.toThrow(
				BadRequestException
			);
		});

		it('should reject if beat already exists for project', async () => {
			const project = createMockProject();
			const existingBeat = createMockBeat({ projectId: project.id });

			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// findByProjectId (existing beat found)
			mockDb.where.mockResolvedValueOnce([existingBeat]);

			await expect(service.createUploadUrl(project.id, TEST_USER_ID, 'test.mp3')).rejects.toThrow(
				BadRequestException
			);
		});

		it('should throw NotFoundException if project not owned by user', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.createUploadUrl('non-existent-project', TEST_USER_ID, 'test.mp3')
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('updateBeatMetadata', () => {
		it('should update beat metadata', async () => {
			const beat = createMockBeat();
			const project = createMockProject({ id: beat.projectId });
			const updatedBeat = createMockBeat({
				...beat,
				bpm: 140.0,
				duration: 200.0,
			});

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// update returning
			mockDb.returning.mockResolvedValueOnce([updatedBeat]);

			const result = await service.updateBeatMetadata(beat.id, TEST_USER_ID, {
				bpm: 140.0,
				duration: 200.0,
			});

			expect(result).toEqual(updatedBeat);
			expect(result.bpm).toBe(140.0);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent beat', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.updateBeatMetadata('non-existent-id', TEST_USER_ID, { bpm: 120 })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('getDownloadUrl', () => {
		it('should return presigned download URL', async () => {
			const beat = createMockBeat();
			const project = createMockProject({ id: beat.projectId });

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);

			const result = await service.getDownloadUrl(beat.id, TEST_USER_ID);

			expect(result).toBe('https://s3.example.com/download');
		});

		it('should throw NotFoundException for non-existent beat', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.getDownloadUrl('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete beat from storage and database', async () => {
			const beat = createMockBeat();
			const project = createMockProject({ id: beat.projectId });

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// db.delete().where()
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.delete(beat.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should still delete from DB if storage delete fails', async () => {
			const { createMukkeStorage } = require('@manacore/shared-storage');
			const mockStorage = {
				getUploadUrl: jest.fn().mockResolvedValue('https://s3.example.com/upload'),
				getDownloadUrl: jest.fn().mockResolvedValue('https://s3.example.com/download'),
				delete: jest.fn().mockRejectedValue(new Error('Storage error')),
				download: jest.fn().mockResolvedValue(Buffer.from('fake-audio-data')),
			};
			createMukkeStorage.mockReturnValue(mockStorage);

			// Re-create the service to pick up the new mock
			const module: TestingModule = await Test.createTestingModule({
				providers: [
					BeatService,
					{ provide: DATABASE_CONNECTION, useValue: mockDb },
					{ provide: SttService, useValue: mockSttService },
					{ provide: LyricsService, useValue: mockLyricsService },
				],
			}).compile();
			const serviceWithFailingStorage = module.get<BeatService>(BeatService);

			const beat = createMockBeat();
			const project = createMockProject({ id: beat.projectId });

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// db.delete().where()
			mockDb.where.mockResolvedValueOnce(undefined);

			await serviceWithFailingStorage.delete(beat.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent beat', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('getMarkersForBeat', () => {
		it('should return markers for a beat', async () => {
			const markers = [
				{ id: '1', beatId: 'beat-1', type: 'section', startTime: 0 },
				{ id: '2', beatId: 'beat-1', type: 'section', startTime: 30 },
			];
			mockDb.where.mockResolvedValueOnce(markers);

			const result = await service.getMarkersForBeat('beat-1');

			expect(result).toEqual(markers);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return empty array when no markers', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getMarkersForBeat('beat-1');

			expect(result).toEqual([]);
		});
	});

	describe('getLibraryBeats', () => {
		it('should return active library beats ordered by title', async () => {
			const libraryBeats = [
				createMockLibraryBeat({ title: 'A Beat' }),
				createMockLibraryBeat({ title: 'B Beat' }),
			];
			mockDb.orderBy.mockResolvedValueOnce(libraryBeats);

			const result = await service.getLibraryBeats();

			expect(result).toEqual(libraryBeats);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});
	});

	describe('getLibraryBeatById', () => {
		it('should return library beat when found', async () => {
			const libraryBeat = createMockLibraryBeat();
			mockDb.where.mockResolvedValueOnce([libraryBeat]);

			const result = await service.getLibraryBeatById(libraryBeat.id);

			expect(result).toEqual(libraryBeat);
		});

		it('should return null when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.getLibraryBeatById('non-existent-id');

			expect(result).toBeNull();
		});
	});

	describe('getLibraryBeatDownloadUrl', () => {
		it('should return download URL for library beat', async () => {
			const libraryBeat = createMockLibraryBeat();
			mockDb.where.mockResolvedValueOnce([libraryBeat]);

			const result = await service.getLibraryBeatDownloadUrl(libraryBeat.id);

			expect(result).toBe('https://s3.example.com/download');
		});

		it('should throw NotFoundException when library beat not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.getLibraryBeatDownloadUrl('non-existent-id')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('useLibraryBeat', () => {
		it('should create beat from library beat', async () => {
			const project = createMockProject();
			const libraryBeat = createMockLibraryBeat();
			const newBeat = createMockBeat({
				projectId: project.id,
				storagePath: libraryBeat.storagePath,
			});

			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// findByProjectId (no existing beat)
			mockDb.where.mockResolvedValueOnce([]);
			// getLibraryBeatById
			mockDb.where.mockResolvedValueOnce([libraryBeat]);
			// insert returning
			mockDb.returning.mockResolvedValueOnce([newBeat]);

			const result = await service.useLibraryBeat(libraryBeat.id, project.id, TEST_USER_ID);

			expect(result).toEqual(newBeat);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should throw if beat already exists for project', async () => {
			const project = createMockProject();
			const existingBeat = createMockBeat({ projectId: project.id });

			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// findByProjectId (existing beat found)
			mockDb.where.mockResolvedValueOnce([existingBeat]);

			await expect(service.useLibraryBeat('lib-beat-id', project.id, TEST_USER_ID)).rejects.toThrow(
				BadRequestException
			);
		});

		it('should throw NotFoundException when library beat not found', async () => {
			const project = createMockProject();

			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// findByProjectId (no existing beat)
			mockDb.where.mockResolvedValueOnce([]);
			// getLibraryBeatById (not found)
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.useLibraryBeat('non-existent-id', project.id, TEST_USER_ID)
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('isSttAvailable', () => {
		it('should return true when STT service is available', async () => {
			mockSttService.isAvailable.mockResolvedValueOnce(true);

			const result = await service.isSttAvailable();

			expect(result).toBe(true);
			expect(mockSttService.isAvailable).toHaveBeenCalled();
		});

		it('should return false when STT service is not available', async () => {
			mockSttService.isAvailable.mockResolvedValueOnce(false);

			const result = await service.isSttAvailable();

			expect(result).toBe(false);
		});
	});

	describe('transcribeBeat', () => {
		it('should transcribe beat audio and save lyrics', async () => {
			const beat = createMockBeat({ projectId: 'proj-1' });
			const project = createMockProject({ id: 'proj-1' });
			const updatedBeat = createMockBeat({
				...beat,
				transcriptionStatus: 'completed',
				transcribedAt: new Date(),
			});

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// update set status to pending
			mockDb.where.mockResolvedValueOnce(undefined);

			mockSttService.transcribe.mockResolvedValueOnce({
				text: 'Hello world lyrics',
				language: 'en',
				model: 'whisper',
				latencyMs: 1000,
				durationSeconds: 180,
			});

			mockLyricsService.createOrUpdate.mockResolvedValueOnce({
				id: 'lyrics-1',
				projectId: 'proj-1',
				content: 'Hello world lyrics',
			});

			// update beat status to completed
			mockDb.returning.mockResolvedValueOnce([updatedBeat]);

			const result = await service.transcribeBeat(beat.id, TEST_USER_ID);

			expect(result.beat).toEqual(updatedBeat);
			expect(result.lyrics).toBe('Hello world lyrics');
			expect(mockSttService.transcribe).toHaveBeenCalled();
			expect(mockLyricsService.createOrUpdate).toHaveBeenCalledWith(
				'proj-1',
				TEST_USER_ID,
				'Hello world lyrics'
			);
		});

		it('should set status to failed when transcription fails', async () => {
			const beat = createMockBeat({ projectId: 'proj-1' });
			const project = createMockProject({ id: 'proj-1' });

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([beat]);
			// verifyProjectOwnership
			mockDb.where.mockResolvedValueOnce([project]);
			// update set status to pending
			mockDb.where.mockResolvedValueOnce(undefined);

			mockSttService.transcribe.mockRejectedValueOnce(new Error('STT service unavailable'));

			// update beat status to failed
			mockDb.where.mockResolvedValueOnce(undefined);

			await expect(service.transcribeBeat(beat.id, TEST_USER_ID)).rejects.toThrow(
				'STT service unavailable'
			);

			// Verify update was called to set failed status
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent beat', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.transcribeBeat('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});
});
