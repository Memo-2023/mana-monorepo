import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SongService } from './song.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { createMockSong, TEST_USER_ID } from '../__tests__/utils/mock-factories';

// Mock the storage module
jest.mock('@manacore/shared-storage', () => ({
	createMukkeStorage: jest.fn(() => ({
		getUploadUrl: jest.fn().mockResolvedValue('https://s3.example.com/upload'),
		getDownloadUrl: jest.fn().mockResolvedValue('https://s3.example.com/download'),
		delete: jest.fn().mockResolvedValue(undefined),
	})),
	generateUserFileKey: jest.fn((userId: string, filename: string) => `users/${userId}/${filename}`),
	getContentType: jest.fn((filename: string) => {
		if (filename.endsWith('.mp3')) return 'audio/mpeg';
		if (filename.endsWith('.wav')) return 'audio/wav';
		if (filename.endsWith('.txt')) return 'text/plain';
		return 'application/octet-stream';
	}),
}));

describe('SongService', () => {
	let service: SongService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SongService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<SongService>(SongService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createUploadUrl', () => {
		it('should create song record and return upload URL', async () => {
			const song = createMockSong({ title: 'test-song' });
			mockDb.returning.mockResolvedValueOnce([song]);

			const result = await service.createUploadUrl(TEST_USER_ID, 'test-song.mp3');

			expect(result.song).toEqual(song);
			expect(result.uploadUrl).toBe('https://s3.example.com/upload');
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
			expect(mockDb.returning).toHaveBeenCalled();
		});

		it('should reject non-audio files', async () => {
			await expect(service.createUploadUrl(TEST_USER_ID, 'test.txt')).rejects.toThrow(
				BadRequestException
			);
		});
	});

	describe('findByUserId', () => {
		it('should return all songs for a user', async () => {
			const songs = [createMockSong(), createMockSong({ title: 'Song 2' })];
			mockDb.orderBy.mockResolvedValueOnce(songs);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual(songs);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return empty array when no songs', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return song when found', async () => {
			const song = createMockSong();
			mockDb.where.mockResolvedValueOnce([song]);

			const result = await service.findById(song.id, TEST_USER_ID);

			expect(result).toEqual(song);
		});

		it('should return null when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return song when found', async () => {
			const song = createMockSong();
			mockDb.where.mockResolvedValueOnce([song]);

			const result = await service.findByIdOrThrow(song.id, TEST_USER_ID);

			expect(result).toEqual(song);
		});

		it('should throw NotFoundException when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByIdOrThrow('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('toggleFavorite', () => {
		it('should toggle favorite from false to true', async () => {
			const song = createMockSong({ favorite: false });
			const updatedSong = createMockSong({ ...song, favorite: true });

			// First call: findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([song]);
			// Second call: update returning
			mockDb.returning.mockResolvedValueOnce([updatedSong]);

			const result = await service.toggleFavorite(song.id, TEST_USER_ID);

			expect(result).toEqual(updatedSong);
			expect(result.favorite).toBe(true);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent song', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.toggleFavorite('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('incrementPlayCount', () => {
		it('should increment play count and set lastPlayedAt', async () => {
			const song = createMockSong({ playCount: 5 });
			const updatedSong = createMockSong({
				...song,
				playCount: 6,
				lastPlayedAt: new Date(),
			});

			// First call: findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([song]);
			// Second call: update returning
			mockDb.returning.mockResolvedValueOnce([updatedSong]);

			const result = await service.incrementPlayCount(song.id, TEST_USER_ID);

			expect(result).toEqual(updatedSong);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent song', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.incrementPlayCount('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('search', () => {
		it('should return matching songs', async () => {
			const songs = [createMockSong({ title: 'Bohemian Rhapsody' })];
			mockDb.limit.mockResolvedValueOnce(songs);

			const result = await service.search(TEST_USER_ID, 'Bohemian');

			expect(result).toEqual(songs);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.limit).toHaveBeenCalled();
		});

		it('should return empty array for no matches', async () => {
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.search(TEST_USER_ID, 'nonexistent');

			expect(result).toEqual([]);
		});
	});

	describe('updateMetadata', () => {
		it('should update song metadata', async () => {
			const song = createMockSong();
			const updatedSong = createMockSong({
				...song,
				title: 'Updated Title',
				artist: 'Updated Artist',
			});

			// First call: findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([song]);
			// Second call: update returning
			mockDb.returning.mockResolvedValueOnce([updatedSong]);

			const result = await service.updateMetadata(song.id, TEST_USER_ID, {
				title: 'Updated Title',
				artist: 'Updated Artist',
			});

			expect(result).toEqual(updatedSong);
			expect(result.title).toBe('Updated Title');
			expect(result.artist).toBe('Updated Artist');
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent song', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.updateMetadata('non-existent-id', TEST_USER_ID, { title: 'New Title' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		it('should delete song from storage and database', async () => {
			const song = createMockSong();

			// First call: findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([song]);
			// Second call: db.delete().where()
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.delete(song.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should still delete from DB if storage delete fails', async () => {
			const { createMukkeStorage } = require('@manacore/shared-storage');
			const mockStorage = {
				getUploadUrl: jest.fn().mockResolvedValue('https://s3.example.com/upload'),
				getDownloadUrl: jest.fn().mockResolvedValue('https://s3.example.com/download'),
				delete: jest.fn().mockRejectedValue(new Error('Storage error')),
			};
			createMukkeStorage.mockReturnValue(mockStorage);

			// Re-create the service to pick up the new mock
			const module: TestingModule = await Test.createTestingModule({
				providers: [
					SongService,
					{
						provide: DATABASE_CONNECTION,
						useValue: mockDb,
					},
				],
			}).compile();
			const serviceWithFailingStorage = module.get<SongService>(SongService);

			const song = createMockSong();

			// First call: findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([song]);
			// Second call: db.delete().where()
			mockDb.where.mockResolvedValueOnce(undefined);

			await serviceWithFailingStorage.delete(song.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent song', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('getDownloadUrl', () => {
		it('should return presigned download URL', async () => {
			const song = createMockSong();

			// findByIdOrThrow -> findById
			mockDb.where.mockResolvedValueOnce([song]);

			const result = await service.getDownloadUrl(song.id, TEST_USER_ID);

			expect(result).toBe('https://s3.example.com/download');
		});

		it('should throw NotFoundException for non-existent song', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.getDownloadUrl('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});
});
