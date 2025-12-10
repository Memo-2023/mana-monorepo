/**
 * Labels API - Uses central Tags API from mana-core-auth
 *
 * This module wraps the central Tags API to provide backward-compatible
 * "labels" interface for the Todo app. Tags and Labels are now unified
 * across all Manacore apps.
 */

import { browser } from '$app/environment';
import {
	createTagsClient,
	type Tag,
	type CreateTagInput,
	type UpdateTagInput,
} from '@manacore/shared-tags';
import { authStore } from '$lib/stores/auth.svelte';

// Re-export Tag as Label for backward compatibility
export type Label = Tag;

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

export async function getLabels(): Promise<Label[]> {
	const client = getTagsClient();
	if (!client) return [];
	return client.getAll();
}

export async function createLabel(data: CreateTagInput): Promise<Label> {
	const client = getTagsClient();
	if (!client) throw new Error('Tags client not available');
	return client.create(data);
}

export async function updateLabel(id: string, data: UpdateTagInput): Promise<Label> {
	const client = getTagsClient();
	if (!client) throw new Error('Tags client not available');
	return client.update(id, data);
}

export async function deleteLabel(id: string): Promise<void> {
	const client = getTagsClient();
	if (!client) throw new Error('Tags client not available');
	await client.delete(id);
}

export async function createDefaultLabels(): Promise<Label[]> {
	const client = getTagsClient();
	if (!client) return [];
	return client.createDefaults();
}
