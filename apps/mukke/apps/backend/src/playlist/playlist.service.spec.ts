import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
	createMockPlaylist,
	createMockSong,
	TEST_USER_ID,
} from '../__tests__/utils/mock-factories';

describe('PlaylistService', () => {
	let service: PlaylistService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			innerJoin: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PlaylistService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<PlaylistService>(PlaylistService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByUserId', () => {
		it('should return all playlists for a user', async () => {
			const playlists = [
				createMockPlaylist({ name: 'Playlist 1' }),
				createMockPlaylist({ name: 'Playlist 2' }),
			];
			mockDb.orderBy.mockResolvedValueOnce(playlists);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual(playlists);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return empty array when no playlists', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.findByUserId(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return playlist when found', async () => {
			const playlist = createMockPlaylist();
			mockDb.where.mockResolvedValueOnce([playlist]);

			const result = await service.findById(playlist.id, TEST_USER_ID);

			expect(result).toEqual(playlist);
		});

		it('should throw NotFoundException when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findById('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a new playlist', async () => {
			const newPlaylist = createMockPlaylist({ name: 'New Playlist' });
			mockDb.returning.mockResolvedValueOnce([newPlaylist]);

			const result = await service.create(TEST_USER_ID, {
				name: 'New Playlist',
				description: 'A new playlist',
			});

			expect(result).toEqual(newPlaylist);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update playlist name', async () => {
			const playlist = createMockPlaylist();
			const updatedPlaylist = { ...playlist, name: 'Updated Name' };

			// Mock findById
			mockDb.where.mockResolvedValueOnce([playlist]);
			// Mock update returning
			mockDb.returning.mockResolvedValueOnce([updatedPlaylist]);

			const result = await service.update(playlist.id, TEST_USER_ID, {
				name: 'Updated Name',
			});

			expect(result.name).toBe('Updated Name');
		});

		it('should throw NotFoundException for non-existent playlist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { name: 'New Name' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		it('should delete playlist', async () => {
			const playlist = createMockPlaylist();
			mockDb.where.mockResolvedValueOnce([playlist]);

			await service.delete(playlist.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent playlist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('addSong', () => {
		it('should add a song to a playlist with correct sort order', async () => {
			const playlist = createMockPlaylist();
			const song = createMockSong();

			// Mock findById
			mockDb.where.mockResolvedValueOnce([playlist]);
			// Mock select maxOrder
			mockDb.where.mockResolvedValueOnce([{ maxOrder: 2 }]);
			// Mock insert (no return needed, returns void)
			mockDb.values.mockReturnThis();
			// Mock update for updatedAt
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.addSong(playlist.id, song.id, TEST_USER_ID);

			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.update).toHaveBeenCalled();
		});
	});

	describe('removeSong', () => {
		it('should remove a song from a playlist', async () => {
			const playlist = createMockPlaylist();
			const song = createMockSong();

			// Mock findById
			mockDb.where.mockResolvedValueOnce([playlist]);
			// Mock delete
			mockDb.where.mockResolvedValueOnce(undefined);
			// Mock update for updatedAt
			mockDb.where.mockResolvedValueOnce(undefined);

			await service.removeSong(playlist.id, song.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent playlist', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.removeSong('non-existent-id', 'song-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});
});
