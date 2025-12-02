/**
 * Reminders API Client
 */

import { fetchApi } from './client';
import type { Reminder, CreateReminderInput } from '@calendar/shared';

export async function getReminders(eventId: string) {
	return fetchApi<Reminder[]>(`/events/${eventId}/reminders`);
}

export async function createReminder(eventId: string, data: CreateReminderInput) {
	return fetchApi<Reminder>(`/events/${eventId}/reminders`, {
		method: 'POST',
		body: data,
	});
}

export async function deleteReminder(id: string) {
	return fetchApi<void>(`/reminders/${id}`, {
		method: 'DELETE',
	});
}
