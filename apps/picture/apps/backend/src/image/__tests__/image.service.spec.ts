import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ImageService } from '../image.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import { images, imageTags, imageLikes, imageGenerations } from '../../db/schema';

// ── Mock helpers ──────────────────────────────────────────────────────

const NOW = new Date('2026-01-15T12:00:00Z');

const makeImage = (overrides: Record<string, any> = {}) => ({
	id: 'img-1',
	userId: 'user-1',
	generationId: null,
	sourceImageId: null,
	prompt: 'a sunset over mountains',
	negativePrompt: null,
	model: 'sdxl',
	style: null,
	publicUrl: 'https://cdn.example.com/img-1.png',
	storagePath: 'user-1/img-1.png',
	filename: 'img-1.png',
	format: 'png',
	width: 1024,
	height: 1024,
	fileSize: 204800,
	blurhash: null,
	isPublic: false,
	isFavorite: false,
	downloadCount: 0,
	rating: null,
	archivedAt: null,
	createdAt: NOW,
	updatedAt: NOW,
	...overrides,
});

// Drizzle-style fluent mock: each method returns the chain so callers
// can write db.select().from(x).where(y).orderBy(z).limit(n).offset(m)
function createChainMock(terminal: jest.Mock) {
	const chain: any = {};
	const methods = [
		'from',
		'where',
		'orderBy',
		'limit',
		'offset',
		'groupBy',
		'having',
		'set',
		'values',
		'returning',
	];
	for (const m of methods) {
		chain[m] = jest.fn().mockReturnValue(chain);
	}
	// The terminal mock is what eventually resolves
	chain.then = (resolve: any, reject: any) => terminal().then(resolve, reject);
	// Allow awaiting the chain directly
	(chain as any)[Symbol.toStringTag] = 'Promise';
	return chain;
}

let selectResult: jest.Mock;
let selectChain: any;
let insertResult: jest.Mock;
let insertChain: any;
let updateResult: jest.Mock;
let updateChain: any;
let deleteResult: jest.Mock;
let deleteChain: any;

function resetChains() {
	selectResult = jest.fn().mockResolvedValue([]);
	selectChain = createChainMock(selectResult);

	insertResult = jest.fn().mockResolvedValue([]);
	insertChain = createChainMock(insertResult);

	updateResult = jest.fn().mockResolvedValue([]);
	updateChain = createChainMock(updateResult);

	deleteResult = jest.fn().mockResolvedValue([]);
	deleteChain = createChainMock(deleteResult);
}

let mockDb: any;

function buildMockDb() {
	resetChains();

	mockDb = {
		select: jest.fn().mockReturnValue(selectChain),
		insert: jest.fn().mockReturnValue(insertChain),
		update: jest.fn().mockReturnValue(updateChain),
		delete: jest.fn().mockReturnValue(deleteChain),
	};
}

// ── Test suite ────────────────────────────────────────────────────────

describe('ImageService', () => {
	let service: ImageService;

	beforeEach(async () => {
		buildMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [ImageService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
		}).compile();

		service = module.get<ImageService>(ImageService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// ── getImages ───────────────────────────────────────────────────

	describe('getImages', () => {
		it('should return images for a user with default query', async () => {
			const img = makeImage();
			selectResult.mockResolvedValue([img]);

			const result = await service.getImages('user-1', {});

			expect(result).toEqual([img]);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should return archived images when archived=true', async () => {
			const archivedImg = makeImage({ archivedAt: NOW });
			selectResult.mockResolvedValue([archivedImg]);

			const result = await service.getImages('user-1', { archived: true });

			expect(result).toEqual([archivedImg]);
		});

		it('should return only favorites when favoritesOnly=true', async () => {
			const favImg = makeImage({ isFavorite: true });
			selectResult.mockResolvedValue([favImg]);

			const result = await service.getImages('user-1', { favoritesOnly: true });

			expect(result).toEqual([favImg]);
		});

		it('should return empty array when tag filter matches no images', async () => {
			// First select (tag subquery) returns empty
			selectResult.mockResolvedValueOnce([]);

			const result = await service.getImages('user-1', { tagIds: ['tag-1', 'tag-2'] });

			expect(result).toEqual([]);
		});

		it('should filter by tagIds when provided', async () => {
			const img = makeImage();
			// First call: tag subquery returns matching image IDs
			selectResult.mockResolvedValueOnce([{ imageId: 'img-1' }]);
			// Second call: actual images query
			selectResult.mockResolvedValueOnce([img]);

			const result = await service.getImages('user-1', { tagIds: ['tag-1'] });

			expect(result).toEqual([img]);
		});

		it('should handle tagIds as comma-separated string', async () => {
			selectResult.mockResolvedValueOnce([]);

			const result = await service.getImages('user-1', { tagIds: 'tag-1,tag-2' as any });

			expect(result).toEqual([]);
		});

		it('should respect pagination parameters', async () => {
			selectResult.mockResolvedValue([]);

			await service.getImages('user-1', { page: 2, limit: 10 });

			expect(selectChain.limit).toHaveBeenCalledWith(10);
			expect(selectChain.offset).toHaveBeenCalledWith(10);
		});
	});

	// ── getImageById ────────────────────────────────────────────────

	describe('getImageById', () => {
		it('should return image when user owns it', async () => {
			const img = makeImage();
			selectResult.mockResolvedValue([img]);

			const result = await service.getImageById('img-1', 'user-1');

			expect(result).toEqual(img);
		});

		it('should return public image to non-owner', async () => {
			const img = makeImage({ userId: 'user-other', isPublic: true });
			selectResult.mockResolvedValue([img]);

			const result = await service.getImageById('img-1', 'user-1');

			expect(result).toEqual(img);
		});

		it('should throw NotFoundException when image does not exist', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.getImageById('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException for private image owned by another user', async () => {
			const img = makeImage({ userId: 'user-other', isPublic: false });
			selectResult.mockResolvedValue([img]);

			await expect(service.getImageById('img-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});
	});

	// ── archiveImage ────────────────────────────────────────────────

	describe('archiveImage', () => {
		it('should archive an image owned by the user', async () => {
			const img = makeImage();
			const archived = makeImage({ archivedAt: NOW });

			// verifyOwnership select
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			// update returning
			updateChain.returning.mockResolvedValueOnce([archived]);

			const result = await service.archiveImage('img-1', 'user-1');

			expect(result.archivedAt).toEqual(NOW);
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent image', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.archiveImage('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException for image owned by another user', async () => {
			selectResult.mockResolvedValueOnce([{ userId: 'user-other' }]);

			await expect(service.archiveImage('img-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});
	});

	// ── unarchiveImage ──────────────────────────────────────────────

	describe('unarchiveImage', () => {
		it('should unarchive an image', async () => {
			const unarchived = makeImage({ archivedAt: null });
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			updateChain.returning.mockResolvedValueOnce([unarchived]);

			const result = await service.unarchiveImage('img-1', 'user-1');

			expect(result.archivedAt).toBeNull();
		});

		it('should throw NotFoundException for non-existent image', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.unarchiveImage('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ── deleteImage ─────────────────────────────────────────────────

	describe('deleteImage', () => {
		it('should delete image tags then the image', async () => {
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);

			await service.deleteImage('img-1', 'user-1');

			// delete called twice: imageTags then images
			expect(mockDb.delete).toHaveBeenCalledTimes(2);
		});

		it('should throw NotFoundException for non-existent image', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.deleteImage('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException for image owned by another user', async () => {
			selectResult.mockResolvedValueOnce([{ userId: 'user-other' }]);

			await expect(service.deleteImage('img-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});
	});

	// ── toggleFavorite ──────────────────────────────────────────────

	describe('toggleFavorite', () => {
		it('should mark image as favorite', async () => {
			const fav = makeImage({ isFavorite: true });
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			updateChain.returning.mockResolvedValueOnce([fav]);

			const result = await service.toggleFavorite('img-1', 'user-1', true);

			expect(result.isFavorite).toBe(true);
		});

		it('should unmark image as favorite', async () => {
			const notFav = makeImage({ isFavorite: false });
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			updateChain.returning.mockResolvedValueOnce([notFav]);

			const result = await service.toggleFavorite('img-1', 'user-1', false);

			expect(result.isFavorite).toBe(false);
		});

		it('should throw NotFoundException for non-existent image', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.toggleFavorite('non-existent', 'user-1', true)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ── publishImage / unpublishImage ───────────────────────────────

	describe('publishImage', () => {
		it('should set isPublic to true', async () => {
			const published = makeImage({ isPublic: true });
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			updateChain.returning.mockResolvedValueOnce([published]);

			const result = await service.publishImage('img-1', 'user-1');

			expect(result.isPublic).toBe(true);
		});
	});

	describe('unpublishImage', () => {
		it('should set isPublic to false', async () => {
			const unpublished = makeImage({ isPublic: false });
			selectResult.mockResolvedValueOnce([{ userId: 'user-1' }]);
			updateChain.returning.mockResolvedValueOnce([unpublished]);

			const result = await service.unpublishImage('img-1', 'user-1');

			expect(result.isPublic).toBe(false);
		});
	});

	// ── likeImage ───────────────────────────────────────────────────

	describe('likeImage', () => {
		it('should like a public image', async () => {
			const img = makeImage({ isPublic: true, userId: 'user-other' });

			// image lookup
			selectResult
				.mockResolvedValueOnce([img]) // image exists check
				.mockResolvedValueOnce([]) // no existing like
				.mockResolvedValueOnce([{ count: 1 }]); // like count after insert

			const result = await service.likeImage('img-1', 'user-1');

			expect(result.liked).toBe(true);
			expect(result.likeCount).toBe(1);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should allow owner to like own image', async () => {
			const img = makeImage({ userId: 'user-1', isPublic: false });

			selectResult
				.mockResolvedValueOnce([img])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ count: 1 }]);

			const result = await service.likeImage('img-1', 'user-1');

			expect(result.liked).toBe(true);
		});

		it('should return current state if already liked', async () => {
			const img = makeImage({ isPublic: true, userId: 'user-other' });

			selectResult
				.mockResolvedValueOnce([img])
				.mockResolvedValueOnce([{ imageId: 'img-1', userId: 'user-1' }]) // existing like
				.mockResolvedValueOnce([{ count: 3 }]);

			const result = await service.likeImage('img-1', 'user-1');

			expect(result.liked).toBe(true);
			expect(result.likeCount).toBe(3);
			// Should NOT have called insert
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent image', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.likeImage('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException for private image of another user', async () => {
			const img = makeImage({ userId: 'user-other', isPublic: false });
			selectResult.mockResolvedValueOnce([img]);

			await expect(service.likeImage('img-1', 'user-1')).rejects.toThrow(ForbiddenException);
		});
	});

	// ── unlikeImage ─────────────────────────────────────────────────

	describe('unlikeImage', () => {
		it('should unlike an image', async () => {
			const img = makeImage({ isPublic: true });

			selectResult
				.mockResolvedValueOnce([img]) // image exists
				.mockResolvedValueOnce([{ count: 0 }]); // like count after delete

			const result = await service.unlikeImage('img-1', 'user-1');

			expect(result.liked).toBe(false);
			expect(result.likeCount).toBe(0);
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent image', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.unlikeImage('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ── getLikeStatus ───────────────────────────────────────────────

	describe('getLikeStatus', () => {
		it('should return liked=true when user has liked the image', async () => {
			const img = makeImage({ isPublic: true });

			selectResult
				.mockResolvedValueOnce([img])
				.mockResolvedValueOnce([{ imageId: 'img-1', userId: 'user-1' }])
				.mockResolvedValueOnce([{ count: 5 }]);

			const result = await service.getLikeStatus('img-1', 'user-1');

			expect(result.liked).toBe(true);
			expect(result.likeCount).toBe(5);
		});

		it('should return liked=false when user has not liked the image', async () => {
			const img = makeImage({ isPublic: true });

			selectResult
				.mockResolvedValueOnce([img])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ count: 2 }]);

			const result = await service.getLikeStatus('img-1', 'user-1');

			expect(result.liked).toBe(false);
			expect(result.likeCount).toBe(2);
		});

		it('should throw NotFoundException for non-existent image', async () => {
			selectResult.mockResolvedValue([]);

			await expect(service.getLikeStatus('non-existent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ── getArchivedCount ────────────────────────────────────────────

	describe('getArchivedCount', () => {
		it('should return count of archived images', async () => {
			selectResult.mockResolvedValue([{ count: 7 }]);

			const result = await service.getArchivedCount('user-1');

			expect(result).toEqual({ count: 7 });
		});

		it('should return 0 when no archived images', async () => {
			selectResult.mockResolvedValue([{ count: 0 }]);

			const result = await service.getArchivedCount('user-1');

			expect(result).toEqual({ count: 0 });
		});
	});

	// ── batchArchiveImages ──────────────────────────────────────────

	describe('batchArchiveImages', () => {
		it('should archive multiple images', async () => {
			const img1 = makeImage({ id: 'img-1', archivedAt: NOW });
			const img2 = makeImage({ id: 'img-2', archivedAt: NOW });
			updateChain.returning.mockResolvedValueOnce([img1, img2]);

			const result = await service.batchArchiveImages(['img-1', 'img-2'], 'user-1');

			expect(result).toEqual({ affected: 2 });
		});
	});

	// ── batchRestoreImages ──────────────────────────────────────────

	describe('batchRestoreImages', () => {
		it('should restore multiple images', async () => {
			const img1 = makeImage({ id: 'img-1', archivedAt: null });
			updateChain.returning.mockResolvedValueOnce([img1]);

			const result = await service.batchRestoreImages(['img-1'], 'user-1');

			expect(result).toEqual({ affected: 1 });
		});
	});

	// ── batchDeleteImages ───────────────────────────────────────────

	describe('batchDeleteImages', () => {
		it('should delete tags then images', async () => {
			const img1 = makeImage({ id: 'img-1' });
			deleteChain.returning = jest.fn().mockResolvedValueOnce([img1]);

			const result = await service.batchDeleteImages(['img-1'], 'user-1');

			expect(result).toEqual({ affected: 1 });
			// delete called twice: imageTags then images
			expect(mockDb.delete).toHaveBeenCalledTimes(2);
		});
	});

	// ── getGenerationDetails ────────────────────────────────────────

	describe('getGenerationDetails', () => {
		it('should return generation details', async () => {
			const details = {
				steps: 30,
				guidanceScale: 7.5,
				generationTimeSeconds: 12,
				status: 'completed',
			};
			selectResult.mockResolvedValue([details]);

			const result = await service.getGenerationDetails('gen-1', 'user-1');

			expect(result).toEqual(details);
		});

		it('should return null when generation not found', async () => {
			selectResult.mockResolvedValue([]);

			const result = await service.getGenerationDetails('non-existent', 'user-1');

			expect(result).toBeNull();
		});
	});
});
