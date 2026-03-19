import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NoteService } from '../note.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

describe('NoteService', () => {
	let service: NoteService;
	let mockDb: any;

	const mockNote = {
		id: 'note-1',
		contactId: 'contact-1',
		userId: 'user-1',
		content: 'Test note content',
		isPinned: false,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
	};

	const mockNote2 = {
		id: 'note-2',
		contactId: 'contact-1',
		userId: 'user-1',
		content: 'Another note',
		isPinned: true,
		createdAt: new Date('2025-01-02'),
		updatedAt: new Date('2025-01-02'),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NoteService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<NoteService>(NoteService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByContactId', () => {
		it('should return notes for a contact ordered by pinned and date', async () => {
			mockDb.orderBy.mockResolvedValue([mockNote2, mockNote]);

			const result = await service.findByContactId('contact-1', 'user-1');

			expect(result).toEqual([mockNote2, mockNote]);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
		});

		it('should return empty array when contact has no notes', async () => {
			mockDb.orderBy.mockResolvedValue([]);

			const result = await service.findByContactId('contact-1', 'user-1');

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return a note when found', async () => {
			mockDb.where.mockResolvedValue([mockNote]);

			const result = await service.findById('note-1', 'user-1');

			expect(result).toEqual(mockNote);
		});

		it('should return null when note is not found', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.findById('nonexistent', 'user-1');

			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('should insert and return a new note', async () => {
			mockDb.returning.mockResolvedValue([mockNote]);

			const newNote = {
				contactId: 'contact-1',
				userId: 'user-1',
				content: 'Test note content',
			};

			const result = await service.create(newNote as any);

			expect(result).toEqual(mockNote);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(newNote);
		});
	});

	describe('update', () => {
		it('should update and return the note', async () => {
			const updatedNote = { ...mockNote, content: 'Updated content' };
			mockDb.returning.mockResolvedValue([updatedNote]);

			const result = await service.update('note-1', 'user-1', { content: 'Updated content' });

			expect(result).toEqual(updatedNote);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException when note is not found', async () => {
			mockDb.returning.mockResolvedValue([]);

			await expect(service.update('nonexistent', 'user-1', { content: 'Updated' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete a note successfully', async () => {
			mockDb.where.mockResolvedValue(undefined);

			await expect(service.delete('note-1', 'user-1')).resolves.toBeUndefined();
			expect(mockDb.delete).toHaveBeenCalled();
		});
	});

	describe('togglePin', () => {
		it('should toggle isPinned from false to true', async () => {
			const pinnedNote = { ...mockNote, isPinned: true };
			// findById call
			mockDb.where.mockResolvedValueOnce([mockNote]);
			// update call (inside this.update)
			mockDb.returning.mockResolvedValue([pinnedNote]);

			const result = await service.togglePin('note-1', 'user-1');

			expect(result).toEqual(pinnedNote);
			expect(result.isPinned).toBe(true);
		});

		it('should toggle isPinned from true to false', async () => {
			const unpinnedNote = { ...mockNote2, isPinned: false };
			// findById call
			mockDb.where.mockResolvedValueOnce([mockNote2]);
			// update call
			mockDb.returning.mockResolvedValue([unpinnedNote]);

			const result = await service.togglePin('note-2', 'user-1');

			expect(result).toEqual(unpinnedNote);
			expect(result.isPinned).toBe(false);
		});

		it('should throw NotFoundException when note is not found', async () => {
			mockDb.where.mockResolvedValue([]);

			await expect(service.togglePin('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
		});
	});
});
