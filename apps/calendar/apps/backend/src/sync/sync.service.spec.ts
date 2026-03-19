import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SyncService } from './sync.service';
import { ICalService } from './ical.service';
import { CalDavService } from './caldav.service';
import { GoogleCalendarService } from './google-calendar.service';
import { EncryptionService } from '../common/encryption.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { TEST_USER_ID } from '../__tests__/utils/mock-factories';
import { v4 as uuidv4 } from 'uuid';

function createMockExternalCalendar(overrides: Record<string, unknown> = {}) {
	return {
		id: uuidv4(),
		userId: TEST_USER_ID,
		name: 'External Calendar',
		provider: 'ical_url',
		calendarUrl: 'https://example.com/calendar.ics',
		username: null,
		encryptedPassword: null,
		accessToken: null,
		refreshToken: null,
		tokenExpiresAt: null,
		syncEnabled: true,
		syncDirection: 'both',
		syncInterval: 15,
		lastSyncAt: null,
		lastSyncError: null,
		color: '#6B7280',
		isVisible: true,
		providerData: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe('SyncService', () => {
	let service: SyncService;
	let mockDb: any;
	let mockICalService: any;
	let mockCalDavService: any;
	let mockGoogleCalendarService: any;
	let mockEncryptionService: any;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn().mockResolvedValue([]),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		mockICalService = {
			fetchAndParseICalUrl: jest.fn().mockResolvedValue([]),
			generateICalData: jest.fn().mockReturnValue('BEGIN:VCALENDAR\nEND:VCALENDAR'),
		};

		mockCalDavService = {
			discoverCalendars: jest.fn().mockResolvedValue([]),
			getAppleCalDavUrl: jest.fn().mockReturnValue('https://caldav.icloud.com'),
			fetchEvents: jest.fn().mockResolvedValue({ events: [], ctag: null }),
			upsertEvent: jest.fn().mockResolvedValue(undefined),
		};

		mockGoogleCalendarService = {
			isConfigured: jest.fn().mockReturnValue(false),
			getAuthUrl: jest.fn().mockReturnValue('https://google.com/auth'),
			exchangeCodeForTokens: jest.fn(),
			listCalendars: jest.fn(),
			refreshAccessToken: jest.fn(),
			fetchEvents: jest.fn().mockResolvedValue([]),
			createEvent: jest.fn(),
			updateEvent: jest.fn(),
		};

		mockEncryptionService = {
			encrypt: jest.fn().mockReturnValue('encrypted-password'),
			decrypt: jest.fn().mockReturnValue('decrypted-password'),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SyncService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: ICalService,
					useValue: mockICalService,
				},
				{
					provide: CalDavService,
					useValue: mockCalDavService,
				},
				{
					provide: GoogleCalendarService,
					useValue: mockGoogleCalendarService,
				},
				{
					provide: EncryptionService,
					useValue: mockEncryptionService,
				},
			],
		}).compile();

		service = module.get<SyncService>(SyncService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByUser', () => {
		it('should return all external calendars for a user', async () => {
			const calendars = [
				createMockExternalCalendar({ name: 'Calendar 1' }),
				createMockExternalCalendar({ name: 'Calendar 2' }),
			];
			mockDb.where.mockResolvedValueOnce(calendars);

			const result = await service.findByUser(TEST_USER_ID);

			expect(result).toEqual(calendars);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
		});

		it('should return empty array when user has no external calendars', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findByUser(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('findOne', () => {
		it('should return an external calendar when found', async () => {
			const calendar = createMockExternalCalendar();
			mockDb.where.mockResolvedValueOnce([calendar]);

			const result = await service.findOne(calendar.id as string, TEST_USER_ID);

			expect(result).toEqual(calendar);
		});

		it('should throw NotFoundException when calendar not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findOne('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('connect', () => {
		it('should connect an iCal URL calendar', async () => {
			const newCalendar = createMockExternalCalendar({ provider: 'ical_url' });
			mockDb.returning.mockResolvedValueOnce([newCalendar]);

			const result = await service.connect(TEST_USER_ID, {
				name: 'External Calendar',
				provider: 'ical_url',
				calendarUrl: 'https://example.com/calendar.ics',
			});

			expect(result).toEqual(newCalendar);
			expect(mockICalService.fetchAndParseICalUrl).toHaveBeenCalledWith(
				'https://example.com/calendar.ics'
			);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should throw BadRequestException for CalDAV without credentials', async () => {
			await expect(
				service.connect(TEST_USER_ID, {
					name: 'CalDAV Calendar',
					provider: 'caldav',
					calendarUrl: 'https://caldav.example.com/cal',
				})
			).rejects.toThrow(BadRequestException);
		});

		it('should connect a CalDAV calendar with credentials', async () => {
			const newCalendar = createMockExternalCalendar({ provider: 'caldav' });
			mockDb.returning.mockResolvedValueOnce([newCalendar]);

			const result = await service.connect(TEST_USER_ID, {
				name: 'CalDAV Calendar',
				provider: 'caldav',
				calendarUrl: 'https://caldav.example.com/cal',
				username: 'user',
				password: 'pass',
			});

			expect(result).toEqual(newCalendar);
			expect(mockCalDavService.discoverCalendars).toHaveBeenCalled();
			expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('pass');
		});

		it('should throw BadRequestException for Google without access token', async () => {
			await expect(
				service.connect(TEST_USER_ID, {
					name: 'Google Calendar',
					provider: 'google',
					calendarUrl: 'https://google.com/calendar',
				})
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('disconnect', () => {
		it('should disconnect an external calendar and delete synced events', async () => {
			const calendar = createMockExternalCalendar();
			mockDb.where.mockResolvedValueOnce([calendar]);

			await service.disconnect(calendar.id as string, TEST_USER_ID);

			// Should delete synced events and the calendar
			expect(mockDb.delete).toHaveBeenCalledTimes(2);
		});

		it('should throw NotFoundException when calendar not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.disconnect('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('update', () => {
		it('should update external calendar settings', async () => {
			const calendar = createMockExternalCalendar();
			const updatedCalendar = { ...calendar, name: 'Updated Name' };

			// findOne
			mockDb.where.mockResolvedValueOnce([calendar]);
			// update returning
			mockDb.returning.mockResolvedValueOnce([updatedCalendar]);

			const result = await service.update(calendar.id as string, TEST_USER_ID, {
				name: 'Updated Name',
			});

			expect(result.name).toBe('Updated Name');
			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should throw NotFoundException when updating non-existent calendar', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { name: 'New Name' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('syncCalendar', () => {
		it('should return early when sync is disabled', async () => {
			const calendar = createMockExternalCalendar({ syncEnabled: false });
			mockDb.where.mockResolvedValueOnce([calendar]);

			const result = await service.syncCalendar(calendar.id as string);

			expect(result.success).toBe(true);
			expect(result.eventsImported).toBe(0);
			expect(result.eventsExported).toBe(0);
			expect(result.errors).toContain('Sync is disabled');
		});

		it('should throw NotFoundException when calendar not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.syncCalendar('non-existent-id')).rejects.toThrow(NotFoundException);
		});
	});

	describe('discoverCalDav', () => {
		it('should discover CalDAV calendars', async () => {
			mockCalDavService.discoverCalendars!.mockResolvedValueOnce([
				{
					url: 'https://caldav.example.com/cal/1',
					displayName: 'My Calendar',
					color: '#3B82F6',
					description: 'Test calendar',
					ctag: null,
				},
			]);

			const result = await service.discoverCalDav({
				serverUrl: 'https://caldav.example.com',
				username: 'user',
				password: 'pass',
			});

			expect(result.calendars).toHaveLength(1);
			expect(result.calendars[0].name).toBe('My Calendar');
			expect(result.calendars[0].url).toBe('https://caldav.example.com/cal/1');
		});
	});

	describe('getGoogleAuthUrl', () => {
		it('should throw BadRequestException when Google is not configured', () => {
			mockGoogleCalendarService.isConfigured!.mockReturnValue(false);

			expect(() => service.getGoogleAuthUrl()).toThrow(BadRequestException);
		});

		it('should return auth URL when Google is configured', () => {
			mockGoogleCalendarService.isConfigured!.mockReturnValue(true);
			mockGoogleCalendarService.getAuthUrl!.mockReturnValue('https://google.com/auth?state=test');

			const result = service.getGoogleAuthUrl('test');

			expect(result).toBe('https://google.com/auth?state=test');
		});
	});

	describe('exportCalendarAsIcal', () => {
		it('should export a calendar as iCal data', async () => {
			const calendar = {
				id: uuidv4(),
				userId: TEST_USER_ID,
				name: 'My Calendar',
			};
			const calendarEvents = [{ id: uuidv4(), title: 'Event 1' }];

			// Find calendar
			mockDb.where.mockResolvedValueOnce([calendar]);
			// Find events
			mockDb.where.mockResolvedValueOnce(calendarEvents);

			const result = await service.exportCalendarAsIcal(calendar.id, TEST_USER_ID);

			expect(result).toBe('BEGIN:VCALENDAR\nEND:VCALENDAR');
			expect(mockICalService.generateICalData).toHaveBeenCalledWith('My Calendar', calendarEvents);
		});

		it('should throw NotFoundException when calendar not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.exportCalendarAsIcal('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});
});
