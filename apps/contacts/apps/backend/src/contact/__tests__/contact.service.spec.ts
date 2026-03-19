import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContactService } from '../contact.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

describe('ContactService', () => {
	let service: ContactService;
	let mockDb: any;

	const mockContact = {
		id: 'contact-1',
		userId: 'user-1',
		firstName: 'John',
		lastName: 'Doe',
		displayName: 'John Doe',
		email: 'john@example.com',
		phone: '+1234567890',
		mobile: null,
		nickname: null,
		street: null,
		city: null,
		postalCode: null,
		country: null,
		company: 'Acme Inc',
		jobTitle: null,
		department: null,
		website: null,
		birthday: null,
		notes: null,
		photoUrl: null,
		isFavorite: false,
		isArchived: false,
		organizationId: null,
		teamId: null,
		visibility: 'private',
		sharedWith: null,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			offset: jest.fn().mockReturnThis(),
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
				ContactService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<ContactService>(ContactService);
	});

	describe('findByUserId', () => {
		it('should return contacts without search filters', async () => {
			mockDb.offset.mockResolvedValue([mockContact]);

			const result = await service.findByUserId('user-1');

			expect(result).toEqual([mockContact]);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return contacts with search filter using relevance scoring', async () => {
			const searchResult = [{ contact: mockContact, relevance: 100 }];
			mockDb.offset.mockResolvedValue(searchResult);

			const result = await service.findByUserId('user-1', { search: 'John' });

			expect(result).toEqual([mockContact]);
			expect(mockDb.select).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return a contact when found', async () => {
			mockDb.where.mockResolvedValue([mockContact]);

			const result = await service.findById('contact-1', 'user-1');

			expect(result).toEqual(mockContact);
		});

		it('should return null when contact is not found', async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await service.findById('nonexistent', 'user-1');

			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('should insert and return a new contact', async () => {
			mockDb.returning.mockResolvedValue([mockContact]);

			const newContact = {
				userId: 'user-1',
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
			};

			const result = await service.create(newContact as any);

			expect(result).toEqual(mockContact);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(newContact);
		});
	});

	describe('update', () => {
		it('should update and return the contact', async () => {
			const updatedContact = { ...mockContact, firstName: 'Jane' };
			mockDb.returning.mockResolvedValue([updatedContact]);

			const result = await service.update('contact-1', 'user-1', { firstName: 'Jane' });

			expect(result).toEqual(updatedContact);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalled();
		});

		it('should throw NotFoundException when contact is not found', async () => {
			mockDb.returning.mockResolvedValue([]);

			await expect(service.update('nonexistent', 'user-1', { firstName: 'Jane' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('toggleFavorite', () => {
		it('should toggle isFavorite from false to true', async () => {
			const toggledContact = { ...mockContact, isFavorite: true };

			// findById call
			mockDb.where.mockResolvedValueOnce([mockContact]);
			// update call
			mockDb.returning.mockResolvedValue([toggledContact]);

			const result = await service.toggleFavorite('contact-1', 'user-1');

			expect(result).toEqual(toggledContact);
			expect(result.isFavorite).toBe(true);
		});

		it('should throw NotFoundException when contact is not found', async () => {
			mockDb.where.mockResolvedValue([]);

			await expect(service.toggleFavorite('nonexistent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('toggleArchive', () => {
		it('should toggle isArchived from false to true', async () => {
			const archivedContact = { ...mockContact, isArchived: true };

			// findById call
			mockDb.where.mockResolvedValueOnce([mockContact]);
			// update call
			mockDb.returning.mockResolvedValue([archivedContact]);

			const result = await service.toggleArchive('contact-1', 'user-1');

			expect(result).toEqual(archivedContact);
			expect(result.isArchived).toBe(true);
		});

		it('should throw NotFoundException when contact is not found', async () => {
			mockDb.where.mockResolvedValue([]);

			await expect(service.toggleArchive('nonexistent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('count', () => {
		it('should return the count of contacts', async () => {
			mockDb.where.mockResolvedValue([{ count: 42 }]);

			const result = await service.count('user-1');

			expect(result).toBe(42);
		});

		it('should return 0 when no contacts exist', async () => {
			mockDb.where.mockResolvedValue([{ count: 0 }]);

			const result = await service.count('user-1');

			expect(result).toBe(0);
		});
	});

	describe('delete', () => {
		it('should delete a contact successfully', async () => {
			// findById check (contact exists)
			mockDb.where.mockResolvedValueOnce([mockContact]);
			// delete call
			mockDb.where.mockResolvedValueOnce(undefined);

			await expect(service.delete('contact-1', 'user-1')).resolves.toBeUndefined();
		});

		it('should throw NotFoundException if contact does not exist', async () => {
			// findById returns nothing
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('contact-1', 'user-1')).rejects.toThrow(NotFoundException);
		});
	});
});
