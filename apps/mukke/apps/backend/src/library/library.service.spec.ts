import { Test, TestingModule } from '@nestjs/testing';
import { LibraryService } from './library.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { createMockSong, TEST_USER_ID } from '../__tests__/utils/mock-factories';

describe('LibraryService', () => {
	let service: LibraryService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			execute: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LibraryService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<LibraryService>(LibraryService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getAlbums', () => {
		it('should return grouped albums for user', async () => {
			const albums = [
				{ album: 'Album A', albumArtist: 'Artist 1', year: 2020, coverArtPath: null, songCount: 5 },
				{ album: 'Album B', albumArtist: 'Artist 2', year: 2022, coverArtPath: null, songCount: 3 },
			];
			mockDb.execute.mockResolvedValueOnce(albums);

			const result = await service.getAlbums(TEST_USER_ID);

			expect(result).toEqual(albums);
			expect(mockDb.execute).toHaveBeenCalled();
		});
	});

	describe('getArtists', () => {
		it('should return grouped artists for user', async () => {
			const artists = [
				{ artist: 'Artist 1', songCount: 10, albumCount: 2 },
				{ artist: 'Artist 2', songCount: 5, albumCount: 1 },
			];
			mockDb.execute.mockResolvedValueOnce(artists);

			const result = await service.getArtists(TEST_USER_ID);

			expect(result).toEqual(artists);
			expect(mockDb.execute).toHaveBeenCalled();
		});
	});

	describe('getGenres', () => {
		it('should return grouped genres for user', async () => {
			const genres = [
				{ genre: 'Rock', songCount: 15 },
				{ genre: 'Jazz', songCount: 8 },
			];
			mockDb.execute.mockResolvedValueOnce(genres);

			const result = await service.getGenres(TEST_USER_ID);

			expect(result).toEqual(genres);
			expect(mockDb.execute).toHaveBeenCalled();
		});
	});

	describe('getStats', () => {
		it('should return library statistics', async () => {
			const stats = [
				{
					totalSongs: 50,
					totalArtists: 10,
					totalAlbums: 8,
					totalGenres: 5,
					totalDuration: 12500.5,
					totalPlays: 200,
				},
			];
			mockDb.execute.mockResolvedValueOnce(stats);

			const result = await service.getStats(TEST_USER_ID);

			expect(result).toEqual(stats[0]);
			expect(mockDb.execute).toHaveBeenCalled();
		});
	});

	describe('getSongsByAlbum', () => {
		it('should return songs for a specific album', async () => {
			const songs = [
				createMockSong({ title: 'Track 1', album: 'Test Album', trackNumber: 1 }),
				createMockSong({ title: 'Track 2', album: 'Test Album', trackNumber: 2 }),
			];
			mockDb.orderBy.mockResolvedValueOnce(songs);

			const result = await service.getSongsByAlbum(TEST_USER_ID, 'Test Album');

			expect(result).toEqual(songs);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});
	});

	describe('getSongsByArtist', () => {
		it('should return songs for a specific artist', async () => {
			const songs = [
				createMockSong({ title: 'Song A', artist: 'Test Artist' }),
				createMockSong({ title: 'Song B', artist: 'Test Artist' }),
			];
			mockDb.orderBy.mockResolvedValueOnce(songs);

			const result = await service.getSongsByArtist(TEST_USER_ID, 'Test Artist');

			expect(result).toEqual(songs);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});
	});

	describe('getSongsByGenre', () => {
		it('should return songs for a specific genre', async () => {
			const songs = [
				createMockSong({ title: 'Rock Song 1', genre: 'Rock' }),
				createMockSong({ title: 'Rock Song 2', genre: 'Rock' }),
			];
			mockDb.orderBy.mockResolvedValueOnce(songs);

			const result = await service.getSongsByGenre(TEST_USER_ID, 'Rock');

			expect(result).toEqual(songs);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});
	});
});
