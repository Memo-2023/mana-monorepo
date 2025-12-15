/**
 * Event Tag Groups API Client
 */

import { fetchApi } from './client';
import type { EventTagGroup } from '@calendar/shared';

export interface CreateEventTagGroupInput {
	name: string;
	color?: string;
}

export interface UpdateEventTagGroupInput {
	name?: string;
	color?: string;
}

interface GetEventTagGroupsResponse {
	groups: EventTagGroup[];
	ungroupedTagCount: number;
}

export async function getEventTagGroups() {
	const result = await fetchApi<GetEventTagGroupsResponse>('/event-tag-groups');
	if (result.error || !result.data) {
		return { data: null, ungroupedTagCount: 0, error: result.error };
	}
	return {
		data: result.data.groups,
		ungroupedTagCount: result.data.ungroupedTagCount,
		error: null,
	};
}

export async function getEventTagGroup(id: string) {
	const result = await fetchApi<{ group: EventTagGroup }>(`/event-tag-groups/${id}`);
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.group, error: null };
}

export async function createEventTagGroup(data: CreateEventTagGroupInput) {
	const result = await fetchApi<{ group: EventTagGroup }>('/event-tag-groups', {
		method: 'POST',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.group, error: null };
}

export async function updateEventTagGroup(id: string, data: UpdateEventTagGroupInput) {
	const result = await fetchApi<{ group: EventTagGroup }>(`/event-tag-groups/${id}`, {
		method: 'PUT',
		body: data,
	});
	if (result.error || !result.data) {
		return { data: null, error: result.error };
	}
	return { data: result.data.group, error: null };
}

export async function deleteEventTagGroup(id: string) {
	return fetchApi<{ success: boolean }>(`/event-tag-groups/${id}`, {
		method: 'DELETE',
	});
}

export async function reorderEventTagGroups(groupIds: string[]) {
	const result = await fetchApi<GetEventTagGroupsResponse>('/event-tag-groups/reorder', {
		method: 'PUT',
		body: { groupIds },
	});
	if (result.error || !result.data) {
		return { data: null, ungroupedTagCount: 0, error: result.error };
	}
	return {
		data: result.data.groups,
		ungroupedTagCount: result.data.ungroupedTagCount,
		error: null,
	};
}
