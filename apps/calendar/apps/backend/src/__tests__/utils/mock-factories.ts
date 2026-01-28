/**
 * Mock factories for test data generation
 */

import { v4 as uuidv4 } from 'uuid';
import type { Calendar } from '../../db/schema/calendars.schema';
import type { Event } from '../../db/schema/events.schema';
import type { Reminder } from '../../db/schema/reminders.schema';
import type { CalendarShare } from '../../db/schema/calendar-shares.schema';
import type { DeviceToken } from '../../db/schema/device-tokens.schema';

// Default test user
export const TEST_USER_ID = 'test-user-123';
export const TEST_USER_EMAIL = 'test@example.com';

/**
 * Create a mock calendar
 */
export function createMockCalendar(overrides: Partial<Calendar> = {}): Calendar {
	return {
		id: uuidv4(),
		userId: TEST_USER_ID,
		name: 'Test Calendar',
		description: 'A test calendar',
		color: '#3B82F6',
		isDefault: false,
		isVisible: true,
		timezone: 'Europe/Berlin',
		settings: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

/**
 * Create a mock event
 */
export function createMockEvent(overrides: Partial<Event> = {}): Event {
	const startTime = new Date();
	startTime.setHours(startTime.getHours() + 1);
	const endTime = new Date(startTime);
	endTime.setHours(endTime.getHours() + 1);

	return {
		id: uuidv4(),
		calendarId: uuidv4(),
		userId: TEST_USER_ID,
		title: 'Test Event',
		description: 'A test event',
		location: null,
		startTime,
		endTime,
		isAllDay: false,
		timezone: 'Europe/Berlin',
		recurrenceRule: null,
		recurrenceEndDate: null,
		recurrenceExceptions: null,
		parentEventId: null,
		color: null,
		status: 'confirmed',
		externalId: null,
		externalCalendarId: null,
		lastSyncedAt: null,
		metadata: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

/**
 * Create a mock reminder
 */
export function createMockReminder(overrides: Partial<Reminder> = {}): Reminder {
	const reminderTime = new Date();
	reminderTime.setMinutes(reminderTime.getMinutes() + 15);

	return {
		id: uuidv4(),
		eventId: uuidv4(),
		userId: TEST_USER_ID,
		userEmail: TEST_USER_EMAIL,
		minutesBefore: 15,
		reminderTime,
		notifyPush: true,
		notifyEmail: false,
		status: 'pending',
		sentAt: null,
		eventInstanceDate: null,
		createdAt: new Date(),
		...overrides,
	};
}

/**
 * Create a mock calendar share
 */
export function createMockCalendarShare(overrides: Partial<CalendarShare> = {}): CalendarShare {
	return {
		id: uuidv4(),
		calendarId: uuidv4(),
		sharedWithUserId: null,
		sharedWithEmail: 'shared@example.com',
		permission: 'read',
		shareToken: null,
		shareUrl: null,
		status: 'pending',
		invitedBy: TEST_USER_ID,
		acceptedAt: null,
		expiresAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

/**
 * Create a mock device token
 */
export function createMockDeviceToken(overrides: Partial<DeviceToken> = {}): DeviceToken {
	return {
		id: uuidv4(),
		userId: TEST_USER_ID,
		pushToken: `ExponentPushToken[${uuidv4()}]`,
		platform: 'ios',
		deviceName: 'Test iPhone',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

/**
 * Create mock database query result
 */
export function createQueryResult<T>(data: T[]): T[] {
	return data;
}
