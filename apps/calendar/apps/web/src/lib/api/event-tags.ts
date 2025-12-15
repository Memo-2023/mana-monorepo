/**
 * Event Tags API Client - Uses Calendar Backend API
 *
 * This module provides the event tags interface for the Calendar app,
 * using the calendar backend's /event-tags endpoint which supports
 * tag groups (groupId).
 */

import { fetchApi } from './client';
import type { EventTag } from '@calendar/shared';

// Re-export EventTag from shared
export type { EventTag };

export interface CreateEventTagInput {
	name: string;
	color?: string;
	groupId?: string | null;
}

export interface UpdateEventTagInput {
	name?: string;
	color?: string;
	groupId?: string | null;
}

export async function getEventTags() {
	const result = await fetchApi<{ tags: EventTag[] }>('/event-tags');
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.tags, error: null };
}

export async function getEventTag(id: string) {
	const result = await fetchApi<{ tag: EventTag }>(`/event-tags/${id}`);
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.tag, error: null };
}

export async function createEventTag(data: CreateEventTagInput) {
	const result = await fetchApi<{ tag: EventTag }>('/event-tags', {
		method: 'POST',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.tag, error: null };
}

export async function updateEventTag(id: string, data: UpdateEventTagInput) {
	const result = await fetchApi<{ tag: EventTag }>(`/event-tags/${id}`, {
		method: 'PUT',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.tag, error: null };
}

export async function deleteEventTag(id: string) {
	const result = await fetchApi<{ success: boolean }>(`/event-tags/${id}`, {
		method: 'DELETE',
	});
	return result;
}
