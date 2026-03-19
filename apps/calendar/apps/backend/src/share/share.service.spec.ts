import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShareService } from './share.service';
import { CalendarService } from '../calendar/calendar.service';
import { EmailService } from '../email/email.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
	createMockCalendarShare,
	createMockCalendar,
	TEST_USER_ID,
	TEST_USER_EMAIL,
} from '../__tests__/utils/mock-factories';

describe('ShareService', () => {
	let service: ShareService;
	let mockDb: any;
	let mockCalendarService: jest.Mocked<CalendarService>;
	let mockEmailService: jest.Mocked<EmailService>;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		mockCalendarService = {
			findByIdOrThrow: jest.fn(),
		} as unknown as jest.Mocked<CalendarService>;

		mockEmailService = {
			sendCalendarInvitationEmail: jest.fn().mockResolvedValue(true),
		} as unknown as jest.Mocked<EmailService>;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ShareService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: CalendarService,
					useValue: mockCalendarService,
				},
				{
					provide: EmailService,
					useValue: mockEmailService,
				},
				{
					provide: ConfigService,
					useValue: { get: jest.fn().mockReturnValue('http://localhost:5179') },
				},
			],
		}).compile();

		service = module.get<ShareService>(ShareService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByCalendar', () => {
		it('should return shares for a calendar', async () => {
			const calendar = createMockCalendar();
			const shares = [
				createMockCalendarShare({ calendarId: calendar.id }),
				createMockCalendarShare({ calendarId: calendar.id }),
			];

			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);
			mockDb.where.mockResolvedValueOnce(shares);

			const result = await service.findByCalendar(calendar.id, TEST_USER_ID);

			expect(result).toEqual(shares);
			expect(mockCalendarService.findByIdOrThrow).toHaveBeenCalledWith(calendar.id, TEST_USER_ID);
		});
	});

	describe('findById', () => {
		it('should return share when found', async () => {
			const share = createMockCalendarShare();
			mockDb.where.mockResolvedValueOnce([share]);

			const result = await service.findById(share.id);

			expect(result).toEqual(share);
		});

		it('should return null when share not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id');

			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('should create share with email and send invitation', async () => {
			const calendar = createMockCalendar();
			const newShare = createMockCalendarShare({
				calendarId: calendar.id,
				sharedWithEmail: 'invited@example.com',
			});

			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);
			mockDb.returning.mockResolvedValueOnce([newShare]);

			const result = await service.create(TEST_USER_ID, TEST_USER_EMAIL, {
				calendarId: calendar.id,
				email: 'invited@example.com',
				permission: 'read',
			});

			expect(result).toEqual(newShare);
			expect(mockEmailService.sendCalendarInvitationEmail).toHaveBeenCalledWith(
				'invited@example.com',
				calendar.name,
				expect.any(String),
				'read',
				expect.stringContaining('/shares/')
			);
		});

		it('should create shareable link when createLink is true', async () => {
			const calendar = createMockCalendar();
			const newShare = createMockCalendarShare({
				calendarId: calendar.id,
				shareToken: expect.any(String),
				shareUrl: expect.stringContaining('/share/'),
			});

			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);
			mockDb.returning.mockResolvedValueOnce([newShare]);

			const result = await service.create(TEST_USER_ID, TEST_USER_EMAIL, {
				calendarId: calendar.id,
				createLink: true,
				permission: 'read',
			});

			expect(result).toEqual(newShare);
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					shareToken: expect.any(String),
				})
			);
			// Should not send email for link sharing
			expect(mockEmailService.sendCalendarInvitationEmail).not.toHaveBeenCalled();
		});

		it('should set expiration date when provided', async () => {
			const calendar = createMockCalendar();
			const expiresAt = '2024-12-31T23:59:59Z';
			const newShare = createMockCalendarShare({
				calendarId: calendar.id,
				expiresAt: new Date(expiresAt),
			});

			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);
			mockDb.returning.mockResolvedValueOnce([newShare]);

			await service.create(TEST_USER_ID, TEST_USER_EMAIL, {
				calendarId: calendar.id,
				email: 'invited@example.com',
				permission: 'read',
				expiresAt,
			});

			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					expiresAt: expect.any(Date),
				})
			);
		});
	});

	describe('update', () => {
		it('should update share permissions', async () => {
			const share = createMockCalendarShare({ permission: 'read' });
			const calendar = createMockCalendar({ id: share.calendarId });
			const updatedShare = { ...share, permission: 'write' };

			mockDb.where.mockResolvedValueOnce([share]);
			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);
			mockDb.returning.mockResolvedValueOnce([updatedShare]);

			const result = await service.update(share.id, TEST_USER_ID, {
				permission: 'write',
			});

			expect(result.permission).toBe('write');
		});

		it('should throw NotFoundException when share not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { permission: 'write' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		it('should delete share', async () => {
			const share = createMockCalendarShare();
			const calendar = createMockCalendar({ id: share.calendarId });

			mockDb.where.mockResolvedValueOnce([share]);
			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);

			await service.delete(share.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException when deleting non-existent share', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('acceptInvitation', () => {
		it('should accept pending invitation', async () => {
			const share = createMockCalendarShare({ status: 'pending' });
			const acceptedShare = {
				...share,
				status: 'accepted',
				sharedWithUserId: TEST_USER_ID,
				acceptedAt: new Date(),
			};

			mockDb.where.mockResolvedValueOnce([share]);
			mockDb.returning.mockResolvedValueOnce([acceptedShare]);

			const result = await service.acceptInvitation(share.id, TEST_USER_ID, 'shared@example.com');

			expect(result.status).toBe('accepted');
			expect(result.sharedWithUserId).toBe(TEST_USER_ID);
		});

		it('should throw NotFoundException when invitation not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.acceptInvitation('non-existent-id', TEST_USER_ID, 'shared@example.com')
			).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException when invitation already processed', async () => {
			const share = createMockCalendarShare({ status: 'accepted' });
			mockDb.where.mockResolvedValueOnce([share]);

			await expect(
				service.acceptInvitation(share.id, TEST_USER_ID, 'shared@example.com')
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('declineInvitation', () => {
		it('should decline pending invitation', async () => {
			const share = createMockCalendarShare({ status: 'pending' });
			const declinedShare = { ...share, status: 'declined' };

			mockDb.where.mockResolvedValueOnce([share]);
			mockDb.returning.mockResolvedValueOnce([declinedShare]);

			const result = await service.declineInvitation(share.id, TEST_USER_ID);

			expect(result.status).toBe('declined');
		});

		it('should throw ForbiddenException when invitation already processed', async () => {
			const share = createMockCalendarShare({ status: 'declined' });
			mockDb.where.mockResolvedValueOnce([share]);

			await expect(service.declineInvitation(share.id, TEST_USER_ID)).rejects.toThrow(
				ForbiddenException
			);
		});
	});

	describe('findByShareToken', () => {
		it('should return share for valid token', async () => {
			const share = createMockCalendarShare({
				shareToken: 'valid-token-123',
			});
			mockDb.where.mockResolvedValueOnce([share]);

			const result = await service.findByShareToken('valid-token-123');

			expect(result).toEqual(share);
		});

		it('should return null for invalid token', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findByShareToken('invalid-token');

			expect(result).toBeNull();
		});
	});

	describe('getSharedCalendarsForUser', () => {
		it('should return accepted shares for user', async () => {
			const shares = [
				createMockCalendarShare({ sharedWithUserId: TEST_USER_ID, status: 'accepted' }),
				createMockCalendarShare({ sharedWithUserId: TEST_USER_ID, status: 'accepted' }),
			];
			mockDb.where.mockResolvedValueOnce(shares);

			const result = await service.getSharedCalendarsForUser(TEST_USER_ID);

			expect(result).toEqual(shares);
			expect(result.every((s) => s.status === 'accepted')).toBe(true);
		});
	});
});
