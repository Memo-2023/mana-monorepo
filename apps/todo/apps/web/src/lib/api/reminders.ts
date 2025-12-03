import { apiClient } from './client';
import type { Reminder, ReminderType } from '@todo/shared';

interface CreateReminderDto {
	minutesBefore: number;
	type?: ReminderType;
}

interface RemindersResponse {
	reminders: Reminder[];
}

interface ReminderResponse {
	reminder: Reminder;
}

export async function getReminders(taskId: string): Promise<Reminder[]> {
	const response = await apiClient.get<RemindersResponse>(`/api/v1/tasks/${taskId}/reminders`);
	return response.reminders;
}

export async function createReminder(taskId: string, data: CreateReminderDto): Promise<Reminder> {
	const response = await apiClient.post<ReminderResponse>(
		`/api/v1/tasks/${taskId}/reminders`,
		data
	);
	return response.reminder;
}

export async function deleteReminder(id: string): Promise<void> {
	await apiClient.delete(`/api/v1/reminders/${id}`);
}
