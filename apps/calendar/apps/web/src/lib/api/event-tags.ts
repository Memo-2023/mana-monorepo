/**
 * Event Tags API Client - Uses central Tags API from mana-core-auth
 *
 * This module wraps the central Tags API to provide backward-compatible
 * "event tags" interface for the Calendar app. Tags are now unified
 * across all Manacore apps (Todo, Calendar, Contacts).
 */

import { browser } from '$app/environment';
import {
	createTagsClient,
	type Tag,
	type CreateTagInput,
	type UpdateTagInput,
} from '@manacore/shared-tags';
import { authStore } from '$lib/stores/auth.svelte';

// Re-export Tag as EventTag for backward compatibility
export type EventTag = Tag;
export type CreateEventTagInput = CreateTagInput;
export type UpdateEventTagInput = UpdateTagInput;

// Get auth URL dynamically at runtime
function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return 'http://localhost:3001';
}

// Lazy-initialized client
let _tagsClient: ReturnType<typeof createTagsClient> | null = null;

function getTagsClient() {
	if (!browser) return null;
	if (!_tagsClient) {
		_tagsClient = createTagsClient({
			authUrl: getAuthUrl(),
			getToken: async () => {
				const token = await authStore.getAccessToken();
				return token || '';
			},
		});
	}
	return _tagsClient;
}

export async function getEventTags() {
	const client = getTagsClient();
	if (!client) return { data: null, error: null };
	try {
		const tags = await client.getAll();
		return { data: tags, error: null };
	} catch (e) {
		return {
			data: null,
			error: { message: e instanceof Error ? e.message : 'Failed to fetch tags' },
		};
	}
}

export async function getEventTag(id: string) {
	const client = getTagsClient();
	if (!client) return { data: null, error: null };
	try {
		const tag = await client.getById(id);
		return { data: tag, error: null };
	} catch (e) {
		return {
			data: null,
			error: { message: e instanceof Error ? e.message : 'Failed to fetch tag' },
		};
	}
}

export async function createEventTag(data: CreateEventTagInput) {
	const client = getTagsClient();
	if (!client) return { data: null, error: { message: 'Tags client not available' } };
	try {
		const tag = await client.create(data);
		return { data: tag, error: null };
	} catch (e) {
		return {
			data: null,
			error: { message: e instanceof Error ? e.message : 'Failed to create tag' },
		};
	}
}

export async function updateEventTag(id: string, data: UpdateEventTagInput) {
	const client = getTagsClient();
	if (!client) return { data: null, error: { message: 'Tags client not available' } };
	try {
		const tag = await client.update(id, data);
		return { data: tag, error: null };
	} catch (e) {
		return {
			data: null,
			error: { message: e instanceof Error ? e.message : 'Failed to update tag' },
		};
	}
}

export async function deleteEventTag(id: string) {
	const client = getTagsClient();
	if (!client) return { data: null, error: { message: 'Tags client not available' } };
	try {
		await client.delete(id);
		return { data: { success: true }, error: null };
	} catch (e) {
		return {
			data: null,
			error: { message: e instanceof Error ? e.message : 'Failed to delete tag' },
		};
	}
}

export async function createDefaultEventTags() {
	const client = getTagsClient();
	if (!client) return { data: null, error: null };
	try {
		const tags = await client.createDefaults();
		return { data: tags, error: null };
	} catch (e) {
		return {
			data: null,
			error: { message: e instanceof Error ? e.message : 'Failed to create default tags' },
		};
	}
}
