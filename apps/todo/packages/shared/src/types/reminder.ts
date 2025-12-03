export type ReminderType = 'push' | 'email' | 'both';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface Reminder {
	id: string;
	taskId: string;
	userId: string;
	minutesBefore: number;
	reminderTime: Date | string;
	type: ReminderType;
	status: ReminderStatus;
	sentAt?: Date | string | null;
	createdAt: Date | string;
}

export interface CreateReminderInput {
	minutesBefore: number;
	type?: ReminderType;
}
