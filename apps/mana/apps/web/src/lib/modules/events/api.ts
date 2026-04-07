/**
 * mana-events HTTP client (host-side, JWT-authenticated).
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaEventsUrl } from '$lib/api/config';

export interface PublishedSnapshotInput {
	eventId: string;
	title: string;
	description?: string | null;
	location?: string | null;
	locationUrl?: string | null;
	startAt: string;
	endAt?: string | null;
	allDay?: boolean;
	coverImageUrl?: string | null;
	color?: string | null;
	capacity?: number | null;
}

export interface PublicRsvpRecord {
	id: string;
	token: string;
	name: string;
	email: string | null;
	status: 'yes' | 'no' | 'maybe';
	plusOnes: number;
	note: string | null;
	createdAt: string;
	updatedAt: string;
}

async function fetchWithAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
	const token = await authStore.getAccessToken();
	const res = await fetch(`${getManaEventsUrl()}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...init.headers,
		},
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(err.message || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export interface PublishedItemSnapshot {
	id: string;
	label: string;
	quantity?: number | null;
	order: number;
	done?: boolean;
}

export interface PublishedItemRecord {
	id: string;
	label: string;
	quantity: number | null;
	sortOrder: number;
	done: boolean;
	claimedByName: string | null;
}

export const eventsApi = {
	async publish(input: PublishedSnapshotInput): Promise<{ token: string; isNew: boolean }> {
		return fetchWithAuth('/api/v1/events/publish', {
			method: 'POST',
			body: JSON.stringify(input),
		});
	},

	async updateSnapshot(
		eventId: string,
		input: Partial<PublishedSnapshotInput>
	): Promise<{ token: string }> {
		return fetchWithAuth(`/api/v1/events/${eventId}/snapshot`, {
			method: 'PUT',
			body: JSON.stringify(input),
		});
	},

	async unpublish(eventId: string): Promise<{ deleted: boolean }> {
		return fetchWithAuth(`/api/v1/events/${eventId}`, { method: 'DELETE' });
	},

	async getRsvps(eventId: string): Promise<{ token: string; rsvps: PublicRsvpRecord[] }> {
		return fetchWithAuth(`/api/v1/events/${eventId}/rsvps`);
	},

	async syncItems(
		eventId: string,
		items: PublishedItemSnapshot[]
	): Promise<{ ok: true; count: number }> {
		return fetchWithAuth(`/api/v1/events/${eventId}/items`, {
			method: 'PUT',
			body: JSON.stringify({ items }),
		});
	},

	async getItems(eventId: string): Promise<{ items: PublishedItemRecord[] }> {
		return fetchWithAuth(`/api/v1/events/${eventId}/items`);
	},
};
