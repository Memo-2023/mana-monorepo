import { ContactController } from '../contact.controller';

const TEST_USER_ID = 'test-user-123';
const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

function createMockContact(overrides: Record<string, unknown> = {}) {
	return {
		id: 'contact-1',
		userId: TEST_USER_ID,
		firstName: 'Max',
		lastName: 'Mustermann',
		displayName: 'Max Mustermann',
		email: 'max@example.com',
		isFavorite: false,
		isArchived: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe('ContactController', () => {
	let controller: ContactController;
	let service: any;

	beforeEach(() => {
		service = {
			findByUserId: jest.fn(),
			count: jest.fn(),
			findWithBirthdays: jest.fn(),
			findById: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			toggleFavorite: jest.fn(),
			toggleArchive: jest.fn(),
			ensureSelfContact: jest.fn().mockResolvedValue(createMockContact({ isSelf: true })),
			findSelfContact: jest.fn(),
		};
		controller = new ContactController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return contacts with total', async () => {
			const contacts = [createMockContact()];
			service.findByUserId.mockResolvedValue(contacts);
			service.count.mockResolvedValue(1);
			const result = await controller.findAll(mockUser as any, {} as any);
			expect(result).toEqual({ contacts, total: 1 });
		});
	});

	describe('getBirthdays', () => {
		it('should return contacts with birthdays', async () => {
			const contacts = [createMockContact({ birthday: '1990-01-15' })];
			service.findWithBirthdays.mockResolvedValue(contacts);
			const result = await controller.getBirthdays(mockUser as any);
			expect(result).toEqual({ contacts });
		});
	});

	describe('findOne', () => {
		it('should return contact', async () => {
			const contact = createMockContact();
			service.findById.mockResolvedValue(contact);
			const result = await controller.findOne(mockUser as any, 'contact-1');
			expect(result).toEqual({ contact });
		});

		it('should return null when not found', async () => {
			service.findById.mockResolvedValue(null);
			const result = await controller.findOne(mockUser as any, 'bad-id');
			expect(result).toEqual({ contact: null });
		});
	});

	describe('create', () => {
		it('should generate displayName from first+last name', async () => {
			const contact = createMockContact();
			service.create.mockResolvedValue(contact);
			await controller.create(mockUser as any, { firstName: 'Max', lastName: 'Mustermann' } as any);
			expect(service.create).toHaveBeenCalledWith(
				expect.objectContaining({ displayName: 'Max Mustermann', userId: TEST_USER_ID })
			);
		});

		it('should use provided displayName', async () => {
			service.create.mockResolvedValue(createMockContact());
			await controller.create(mockUser as any, { displayName: 'Custom' } as any);
			expect(service.create).toHaveBeenCalledWith(
				expect.objectContaining({ displayName: 'Custom' })
			);
		});
	});

	describe('update', () => {
		it('should update contact', async () => {
			const contact = createMockContact({ firstName: 'Updated' });
			service.update.mockResolvedValue(contact);
			const result = await controller.update(mockUser as any, 'contact-1', {
				firstName: 'Updated',
			} as any);
			expect(result).toEqual({ contact });
		});
	});

	describe('delete', () => {
		it('should delete and return success', async () => {
			service.delete.mockResolvedValue(undefined);
			const result = await controller.delete(mockUser as any, 'contact-1');
			expect(result).toEqual({ success: true });
		});
	});

	describe('toggleFavorite', () => {
		it('should toggle favorite', async () => {
			const contact = createMockContact({ isFavorite: true });
			service.toggleFavorite.mockResolvedValue(contact);
			const result = await controller.toggleFavorite(mockUser as any, 'contact-1');
			expect(result).toEqual({ contact });
		});
	});

	describe('toggleArchive', () => {
		it('should toggle archive', async () => {
			const contact = createMockContact({ isArchived: true });
			service.toggleArchive.mockResolvedValue(contact);
			const result = await controller.toggleArchive(mockUser as any, 'contact-1');
			expect(result).toEqual({ contact });
		});
	});
});
