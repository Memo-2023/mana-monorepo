import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { EventService } from '../event/event.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
	createMockReminder,
	createMockEvent,
	TEST_USER_ID,
	TEST_USER_EMAIL,
} from '../__tests__/utils/mock-factories';

describe('ReminderService', () => {
	let service: ReminderService;
	let mockDb: any;
	let mockEventService: jest.Mocked<EventService>;
	let mockEmailService: jest.Mocked<EmailService>;
	let mockNotificationService: jest.Mocked<NotificationService>;

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

		mockEventService = {
			findByIdOrThrow: jest.fn(),
		} as unknown as jest.Mocked<EventService>;

		mockEmailService = {
			sendReminderEmail: jest.fn().mockResolvedValue(true),
		} as unknown as jest.Mocked<EmailService>;

		mockNotificationService = {
			sendToUser: jest.fn().mockResolvedValue(true),
		} as unknown as jest.Mocked<NotificationService>;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ReminderService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: EventService,
					useValue: mockEventService,
				},
				{
					provide: EmailService,
					useValue: mockEmailService,
				},
				{
					provide: NotificationService,
					useValue: mockNotificationService,
				},
			],
		}).compile();

		service = module.get<ReminderService>(ReminderService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByEvent', () => {
		it('should return reminders for an event', async () => {
			const event = createMockEvent();
			const reminders = [
				createMockReminder({ eventId: event.id }),
				createMockReminder({ eventId: event.id }),
			];

			mockEventService.findByIdOrThrow.mockResolvedValueOnce(event);
			mockDb.where.mockResolvedValueOnce(reminders);

			const result = await service.findByEvent(event.id, TEST_USER_ID);

			expect(result).toEqual(reminders);
			expect(mockEventService.findByIdOrThrow).toHaveBeenCalledWith(event.id, TEST_USER_ID);
		});
	});

	describe('findById', () => {
		it('should return reminder when found', async () => {
			const reminder = createMockReminder();
			mockDb.where.mockResolvedValueOnce([reminder]);

			const result = await service.findById(reminder.id, TEST_USER_ID);

			expect(result).toEqual(reminder);
		});

		it('should return null when reminder not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('create', () => {
		it('should create a new reminder', async () => {
			const event = createMockEvent();
			const newReminder = createMockReminder({ eventId: event.id });

			mockEventService.findByIdOrThrow.mockResolvedValueOnce(event);
			mockDb.returning.mockResolvedValueOnce([newReminder]);

			const result = await service.create(TEST_USER_ID, TEST_USER_EMAIL, {
				eventId: event.id,
				minutesBefore: 15,
				notifyPush: true,
				notifyEmail: false,
			});

			expect(result).toEqual(newReminder);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should calculate reminder time based on event start time', async () => {
			const startTime = new Date('2024-12-15T10:00:00Z');
			const event = createMockEvent({ startTime });
			const newReminder = createMockReminder({
				eventId: event.id,
				minutesBefore: 30,
			});

			mockEventService.findByIdOrThrow.mockResolvedValueOnce(event);
			mockDb.returning.mockResolvedValueOnce([newReminder]);

			await service.create(TEST_USER_ID, TEST_USER_EMAIL, {
				eventId: event.id,
				minutesBefore: 30,
			});

			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					minutesBefore: 30,
					userEmail: TEST_USER_EMAIL,
				})
			);
		});
	});

	describe('delete', () => {
		it('should delete reminder', async () => {
			const reminder = createMockReminder();
			mockDb.where.mockResolvedValueOnce([reminder]);

			await service.delete(reminder.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException when deleting non-existent reminder', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('getPendingReminders', () => {
		it('should return pending reminders due within a minute', async () => {
			const reminders = [
				createMockReminder({ status: 'pending' }),
				createMockReminder({ status: 'pending' }),
			];
			mockDb.where.mockResolvedValueOnce(reminders);

			const result = await service.getPendingReminders();

			expect(result).toEqual(reminders);
		});
	});

	describe('markAsSent', () => {
		it('should mark reminder as sent with timestamp', async () => {
			const reminder = createMockReminder();

			await service.markAsSent(reminder.id);

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'sent',
				})
			);
		});
	});

	describe('markAsFailed', () => {
		it('should mark reminder as failed', async () => {
			const reminder = createMockReminder();

			await service.markAsFailed(reminder.id, 'Error message');

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'failed',
				})
			);
		});
	});

	describe('processReminders', () => {
		it('should process pending reminders and send notifications', async () => {
			const event = createMockEvent();
			const reminder = createMockReminder({
				eventId: event.id,
				notifyPush: true,
				notifyEmail: true,
				userEmail: TEST_USER_EMAIL,
			});

			// Mock getPendingReminders
			mockDb.where.mockResolvedValueOnce([reminder]);
			// Mock event lookup
			mockDb.where.mockResolvedValueOnce([event]);

			await service.processReminders();

			expect(mockNotificationService.sendToUser).toHaveBeenCalledWith(
				reminder.userId,
				expect.objectContaining({
					title: expect.stringContaining('Erinnerung'),
					body: expect.any(String),
				})
			);
			expect(mockEmailService.sendReminderEmail).toHaveBeenCalledWith(
				TEST_USER_EMAIL,
				event.title,
				expect.any(Date),
				reminder.minutesBefore
			);
		});

		it('should mark reminder as failed when event not found', async () => {
			const reminder = createMockReminder();

			// Mock getPendingReminders
			mockDb.where.mockResolvedValueOnce([reminder]);
			// Mock event lookup - not found
			mockDb.where.mockResolvedValueOnce([]);

			await service.processReminders();

			expect(mockDb.update).toHaveBeenCalled();
		});

		it('should skip email if userEmail not set', async () => {
			const event = createMockEvent();
			const reminder = createMockReminder({
				eventId: event.id,
				notifyPush: false,
				notifyEmail: true,
				userEmail: null,
			});

			mockDb.where.mockResolvedValueOnce([reminder]);
			mockDb.where.mockResolvedValueOnce([event]);

			await service.processReminders();

			expect(mockEmailService.sendReminderEmail).not.toHaveBeenCalled();
		});
	});

	describe('updateRemindersForEvent', () => {
		it('should update reminder times when event time changes', async () => {
			const eventId = 'event-123';
			const newStartTime = new Date('2024-12-20T14:00:00Z');
			const reminders = [
				createMockReminder({ eventId, minutesBefore: 15 }),
				createMockReminder({ eventId, minutesBefore: 60 }),
			];

			mockDb.where.mockResolvedValueOnce(reminders);

			await service.updateRemindersForEvent(eventId, newStartTime);

			// Should have updated each reminder
			expect(mockDb.update).toHaveBeenCalledTimes(reminders.length);
		});
	});
});
