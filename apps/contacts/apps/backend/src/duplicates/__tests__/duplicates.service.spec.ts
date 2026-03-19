import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DuplicatesService } from '../duplicates.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

describe('DuplicatesService', () => {
	let service: DuplicatesService;
	let mockDb: any;

	const mockContact1 = {
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
		notes: 'Note 1',
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

	const mockContact2 = {
		id: 'contact-2',
		userId: 'user-1',
		firstName: 'John',
		lastName: 'Doe',
		displayName: 'John D.',
		email: 'john@example.com',
		phone: null,
		mobile: '+9876543210',
		nickname: null,
		street: '123 Main St',
		city: 'Springfield',
		postalCode: null,
		country: null,
		company: null,
		jobTitle: 'Developer',
		department: null,
		website: 'https://john.dev',
		birthday: null,
		notes: 'Note 2',
		photoUrl: null,
		isFavorite: true,
		isArchived: false,
		organizationId: null,
		teamId: null,
		visibility: 'private',
		sharedWith: null,
		createdAt: new Date('2025-01-02'),
		updatedAt: new Date('2025-01-02'),
	};

	/**
	 * Create a fresh chainable mock that tracks call order.
	 * Each terminal call (limit, where as terminal, returning, execute)
	 * can be configured to resolve with specific values per invocation.
	 */
	function createMockDb() {
		const db: any = {
			select: jest.fn(),
			from: jest.fn(),
			where: jest.fn(),
			limit: jest.fn(),
			orderBy: jest.fn(),
			groupBy: jest.fn(),
			having: jest.fn(),
			insert: jest.fn(),
			values: jest.fn(),
			returning: jest.fn(),
			update: jest.fn(),
			set: jest.fn(),
			delete: jest.fn(),
			execute: jest.fn(),
		};

		// All methods return the db itself for chaining by default
		for (const key of Object.keys(db)) {
			db[key].mockReturnValue(db);
		}

		return db;
	}

	beforeEach(async () => {
		mockDb = createMockDb();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DuplicatesService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<DuplicatesService>(DuplicatesService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findDuplicates', () => {
		it('should return empty array when no duplicates found', async () => {
			// Email: select().from().where().groupBy().having().limit() -> []
			mockDb.limit.mockResolvedValueOnce([]);
			// Phone: execute() -> []
			mockDb.execute.mockResolvedValueOnce([]);
			// Name: select().from().where().groupBy().having().limit() -> []
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.findDuplicates('user-1');

			expect(result).toEqual([]);
		});

		it('should find email duplicates', async () => {
			// Email grouping query: limit() returns duplicate email groups
			mockDb.limit.mockResolvedValueOnce([{ normalizedEmail: 'john@example.com' }]);
			// Fetch contacts matching those emails: where() returns contacts
			// Since where() is the terminal here, we need it to resolve after the groupBy chain
			// The second where() call (after the limit resolved) returns contacts
			mockDb.where
				.mockReturnValueOnce(mockDb) // first where in groupBy chain
				.mockResolvedValueOnce([mockContact1, mockContact2]); // second where fetches contacts
			// Phone duplicates: execute() -> []
			mockDb.execute.mockResolvedValueOnce([]);
			// Name duplicates: limit() -> []
			mockDb.limit.mockResolvedValueOnce([]);

			const result = await service.findDuplicates('user-1');

			expect(result.length).toBe(1);
			expect(result[0].matchType).toBe('email');
			expect(result[0].matchValue).toBe('john@example.com');
			expect(result[0].contacts).toHaveLength(2);
		});
	});

	describe('mergeContacts', () => {
		it('should merge contacts and return merged result', async () => {
			const mergedContact = {
				...mockContact1,
				mobile: '+9876543210',
				street: '123 Main St',
				city: 'Springfield',
				jobTitle: 'Developer',
				website: 'https://john.dev',
				notes: 'Note 1\n\n---\n\nNote 2',
				isFavorite: true,
				updatedAt: new Date(),
			};

			// Get primary contact: select().from().where() -> [mockContact1]
			mockDb.where.mockResolvedValueOnce([mockContact1]);
			// Get contacts to merge: select().from().where() -> [mockContact2]
			mockDb.where.mockResolvedValueOnce([mockContact2]);
			// Update primary: update().set().where() -> chainable (returns mockDb)
			mockDb.where.mockReturnValueOnce(mockDb);
			// update chain .returning() -> [mergedContact]
			mockDb.returning.mockResolvedValueOnce([mergedContact]);
			// Delete merged: delete().where() -> undefined
			mockDb.where.mockResolvedValueOnce(undefined);

			const result = await service.mergeContacts('contact-1', ['contact-2'], 'user-1');

			expect(result.mergedContact).toEqual(mergedContact);
			expect(result.deletedIds).toEqual(['contact-2']);
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException when primary contact is not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.mergeContacts('nonexistent', ['contact-2'], 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw NotFoundException when merge contacts are not found', async () => {
			// Primary contact found
			mockDb.where.mockResolvedValueOnce([mockContact1]);
			// Merge contacts not found (empty for 2 requested IDs)
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.mergeContacts('contact-1', ['contact-2', 'contact-3'], 'user-1')
			).rejects.toThrow(NotFoundException);
		});

		it('should throw NotFoundException when some merge contacts are missing', async () => {
			// Primary contact found
			mockDb.where.mockResolvedValueOnce([mockContact1]);
			// Only 1 of 2 merge contacts found
			mockDb.where.mockResolvedValueOnce([mockContact2]);

			await expect(
				service.mergeContacts('contact-1', ['contact-2', 'contact-3'], 'user-1')
			).rejects.toThrow(NotFoundException);
		});

		it('should keep favorite status if any merged contact is favorite', async () => {
			const mergedContact = {
				...mockContact1,
				isFavorite: true,
			};

			// Primary (not favorite)
			mockDb.where.mockResolvedValueOnce([mockContact1]);
			// Merge contacts (contact2 is favorite)
			mockDb.where.mockResolvedValueOnce([mockContact2]);
			// Update chain: where() returns chainable
			mockDb.where.mockReturnValueOnce(mockDb);
			// Update returning
			mockDb.returning.mockResolvedValueOnce([mergedContact]);
			// Delete
			mockDb.where.mockResolvedValueOnce(undefined);

			const result = await service.mergeContacts('contact-1', ['contact-2'], 'user-1');

			expect(result.mergedContact.isFavorite).toBe(true);
		});

		it('should fill empty primary fields from merged contacts', async () => {
			const primaryWithGaps = {
				...mockContact1,
				street: null,
				city: null,
				jobTitle: null,
				website: null,
				mobile: null,
			};
			const mergedResult = {
				...primaryWithGaps,
				street: '123 Main St',
				city: 'Springfield',
				jobTitle: 'Developer',
				website: 'https://john.dev',
				mobile: '+9876543210',
			};

			mockDb.where.mockResolvedValueOnce([primaryWithGaps]);
			mockDb.where.mockResolvedValueOnce([mockContact2]);
			mockDb.where.mockReturnValueOnce(mockDb);
			mockDb.returning.mockResolvedValueOnce([mergedResult]);
			mockDb.where.mockResolvedValueOnce(undefined);

			const result = await service.mergeContacts('contact-1', ['contact-2'], 'user-1');

			expect(result.mergedContact.street).toBe('123 Main St');
			expect(result.mergedContact.city).toBe('Springfield');
			expect(result.mergedContact.jobTitle).toBe('Developer');
		});
	});

	describe('dismissDuplicate', () => {
		it('should resolve without error (no-op for now)', async () => {
			await expect(
				service.dismissDuplicate('email-contact-1-contact-2', 'user-1')
			).resolves.toBeUndefined();
		});
	});
});
