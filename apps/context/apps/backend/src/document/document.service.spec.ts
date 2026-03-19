import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentService } from './document.service';
import { SpaceService } from '../space/space.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
	createMockDocument,
	createMockSpace,
	TEST_USER_ID,
} from '../__tests__/utils/mock-factories';
import { createMockDb } from '../__tests__/utils/mock-db';

describe('DocumentService', () => {
	let service: DocumentService;
	let spaceService: SpaceService;
	let mockDb: any;

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DocumentService,
				{
					provide: SpaceService,
					useValue: {
						incrementDocCounter: jest.fn().mockResolvedValue({ counter: 1, prefix: 'A' }),
					},
				},
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<DocumentService>(DocumentService);
		spaceService = module.get<SpaceService>(SpaceService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findAll', () => {
		it('should return all documents for a user', async () => {
			const docs = [createMockDocument({ title: 'Doc 1' }), createMockDocument({ title: 'Doc 2' })];
			mockDb.orderBy.mockResolvedValueOnce(docs);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual(docs);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should filter by spaceId when provided', async () => {
			const spaceId = 'space-123';
			mockDb.orderBy.mockResolvedValueOnce([]);

			await service.findAll(TEST_USER_ID, spaceId);

			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return empty array when no documents found', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('findAllWithPreview', () => {
		it('should truncate content longer than 200 chars', async () => {
			const longContent = 'A'.repeat(300);
			const doc = createMockDocument({ content: longContent });
			mockDb.orderBy.mockResolvedValueOnce([doc]);

			const result = await service.findAllWithPreview(TEST_USER_ID);

			expect(result[0].content!.length).toBeLessThanOrEqual(203); // 200 + '...'
			expect(result[0].content!.endsWith('...')).toBe(true);
		});

		it('should not truncate short content', async () => {
			const doc = createMockDocument({ content: 'Short content' });
			mockDb.orderBy.mockResolvedValueOnce([doc]);

			const result = await service.findAllWithPreview(TEST_USER_ID);

			expect(result[0].content).toBe('Short content');
		});

		it('should limit results', async () => {
			const docs = Array.from({ length: 10 }, (_, i) => createMockDocument({ title: `Doc ${i}` }));
			mockDb.orderBy.mockResolvedValueOnce(docs);

			const result = await service.findAllWithPreview(TEST_USER_ID, undefined, 5);

			expect(result.length).toBe(5);
		});
	});

	describe('findRecent', () => {
		it('should return recent documents', async () => {
			const docs = [createMockDocument()];
			mockDb.limit.mockResolvedValueOnce(docs);

			const result = await service.findRecent(TEST_USER_ID, 5);

			expect(result).toEqual(docs);
		});
	});

	describe('findById', () => {
		it('should return document when found', async () => {
			const doc = createMockDocument();
			mockDb.where.mockResolvedValueOnce([doc]);

			const result = await service.findById(doc.id, TEST_USER_ID);

			expect(result).toEqual(doc);
		});

		it('should return null when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should throw NotFoundException when not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByIdOrThrow('non-existent', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a document with calculated metadata', async () => {
			const newDoc = createMockDocument({ title: 'New Doc' });
			mockDb.returning.mockResolvedValueOnce([newDoc]);

			const result = await service.create(TEST_USER_ID, {
				content: 'Hello world content',
				type: 'text',
				title: 'New Doc',
			});

			expect(result).toEqual(newDoc);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should generate short_id with space prefix when spaceId is given', async () => {
			const newDoc = createMockDocument({ shortId: 'AD1' });
			mockDb.returning.mockResolvedValueOnce([newDoc]);

			await service.create(TEST_USER_ID, {
				content: 'Content',
				type: 'text',
				spaceId: 'space-123',
			});

			expect(spaceService.incrementDocCounter).toHaveBeenCalledWith('space-123', 'text');
		});

		it('should use extractTitleFromMarkdown when no title provided', async () => {
			const newDoc = createMockDocument({ title: 'Hello World' });
			mockDb.returning.mockResolvedValueOnce([newDoc]);

			const result = await service.create(TEST_USER_ID, {
				content: 'Hello World is a great start',
				type: 'text',
			});

			expect(result).toBeDefined();
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should create context document', async () => {
			const newDoc = createMockDocument({ type: 'context' });
			mockDb.returning.mockResolvedValueOnce([newDoc]);

			const result = await service.create(TEST_USER_ID, {
				content: 'Context info',
				type: 'context',
				spaceId: 'space-123',
			});

			expect(result.type).toBe('context');
			expect(spaceService.incrementDocCounter).toHaveBeenCalledWith('space-123', 'context');
		});

		it('should create prompt document', async () => {
			const newDoc = createMockDocument({ type: 'prompt' });
			mockDb.returning.mockResolvedValueOnce([newDoc]);

			const result = await service.create(TEST_USER_ID, {
				content: 'Generate ideas for...',
				type: 'prompt',
				spaceId: 'space-123',
			});

			expect(result.type).toBe('prompt');
			expect(spaceService.incrementDocCounter).toHaveBeenCalledWith('space-123', 'prompt');
		});
	});

	describe('update', () => {
		it('should update document', async () => {
			const doc = createMockDocument();
			const updated = { ...doc, title: 'Updated Title' };
			mockDb.where.mockResolvedValueOnce([doc]); // findByIdOrThrow
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.update(doc.id, TEST_USER_ID, { title: 'Updated Title' });

			expect(result.title).toBe('Updated Title');
		});

		it('should recalculate word/token count when content changes', async () => {
			const doc = createMockDocument();
			const updated = { ...doc, content: 'New content here' };
			mockDb.where.mockResolvedValueOnce([doc]); // findByIdOrThrow
			mockDb.returning.mockResolvedValueOnce([updated]);

			await service.update(doc.id, TEST_USER_ID, { content: 'New content here' });

			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent document', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.update('non-existent', TEST_USER_ID, { title: 'New' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('updateTags', () => {
		it('should update document tags', async () => {
			const doc = createMockDocument({ metadata: { word_count: 5 } });
			const updated = { ...doc, metadata: { word_count: 5, tags: ['tag1', 'tag2'] } };
			mockDb.where.mockResolvedValueOnce([doc]); // findByIdOrThrow
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.updateTags(doc.id, TEST_USER_ID, ['tag1', 'tag2']);

			expect(result.metadata?.tags).toEqual(['tag1', 'tag2']);
		});

		it('should throw NotFoundException for non-existent document', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.updateTags('non-existent', TEST_USER_ID, ['tag'])).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('togglePinned', () => {
		it('should toggle pinned status', async () => {
			const doc = createMockDocument({ pinned: false });
			const updated = { ...doc, pinned: true };
			mockDb.where.mockResolvedValueOnce([doc]); // findByIdOrThrow
			mockDb.returning.mockResolvedValueOnce([updated]);

			const result = await service.togglePinned(doc.id, TEST_USER_ID, true);

			expect(result.pinned).toBe(true);
		});
	});

	describe('delete', () => {
		it('should delete document', async () => {
			const doc = createMockDocument();
			mockDb.where.mockResolvedValueOnce([doc]); // findByIdOrThrow

			await service.delete(doc.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException for non-existent document', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent', TEST_USER_ID)).rejects.toThrow(NotFoundException);
		});
	});

	describe('createVersion', () => {
		it('should create a version of an existing document', async () => {
			const original = createMockDocument({ title: 'Original' });
			const version = createMockDocument({
				title: 'Zusammenfassung: Original',
				metadata: {
					parent_document: original.id,
					generation_type: 'summary',
					model_used: 'gpt-4.1',
				},
			});
			mockDb.where.mockResolvedValueOnce([original]); // findByIdOrThrow
			mockDb.returning.mockResolvedValueOnce([version]);

			const result = await service.createVersion(original.id, TEST_USER_ID, {
				content: 'Summary content',
				generationType: 'summary',
				model: 'gpt-4.1',
				prompt: 'Summarize this',
			});

			expect(result.metadata?.parent_document).toBe(original.id);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should throw NotFoundException when original not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.createVersion('non-existent', TEST_USER_ID, {
					content: 'Summary',
					generationType: 'summary',
					model: 'gpt-4.1',
					prompt: 'Summarize',
				})
			).rejects.toThrow(NotFoundException);
		});

		it('should use correct title prefix for each generation type', async () => {
			const original = createMockDocument({ title: 'My Doc' });
			const types = ['summary', 'continuation', 'rewrite', 'ideas'] as const;
			const expectedPrefixes = ['Zusammenfassung', 'Fortsetzung', 'Umformulierung', 'Ideen zu'];

			for (let i = 0; i < types.length; i++) {
				mockDb.where.mockResolvedValueOnce([original]);
				const version = createMockDocument({
					title: `${expectedPrefixes[i]}: My Doc`,
				});
				mockDb.returning.mockResolvedValueOnce([version]);

				const result = await service.createVersion(original.id, TEST_USER_ID, {
					content: 'Generated content',
					generationType: types[i],
					model: 'gpt-4.1',
					prompt: 'Generate',
				});

				expect(result.title).toContain(expectedPrefixes[i]);
			}
		});
	});
});
