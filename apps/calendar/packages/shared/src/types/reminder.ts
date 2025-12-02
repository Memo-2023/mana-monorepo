/**
 * Reminder status
 */
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

/**
 * Event reminder entity
 */
export interface Reminder {
	id: string;
	eventId: string;
	userId: string;

	// Timing
	minutesBefore: number;
	reminderTime: Date | string;

	// Notification channels
	notifyPush: boolean;
	notifyEmail: boolean;

	// Status
	status: ReminderStatus;
	sentAt?: Date | string | null;

	// For recurring events
	eventInstanceDate?: Date | string | null;

	createdAt: Date | string;
}

/**
 * Data required to create a reminder
 */
export interface CreateReminderInput {
	eventId: string;
	minutesBefore: number;
	notifyPush?: boolean;
	notifyEmail?: boolean;
}

/**
 * Common reminder presets (in minutes)
 */
export const REMINDER_PRESETS = [
	{ label: 'At time of event', minutes: 0 },
	{ label: '5 minutes before', minutes: 5 },
	{ label: '10 minutes before', minutes: 10 },
	{ label: '15 minutes before', minutes: 15 },
	{ label: '30 minutes before', minutes: 30 },
	{ label: '1 hour before', minutes: 60 },
	{ label: '2 hours before', minutes: 120 },
	{ label: '1 day before', minutes: 1440 },
	{ label: '2 days before', minutes: 2880 },
	{ label: '1 week before', minutes: 10080 },
] as const;

export type ReminderPreset = (typeof REMINDER_PRESETS)[number];
