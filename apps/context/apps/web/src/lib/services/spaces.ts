import { api } from '$lib/api/client';
import type { Space } from '$lib/types';

export async function getSpaces(): Promise<Space[]> {
	const { data, error } = await api.get<{ spaces: Space[] }>('/spaces');
	if (error || !data) return [];
	return data.spaces;
}

export async function getSpaceById(id: string): Promise<Space | null> {
	const { data, error } = await api.get<{ space: Space }>(`/spaces/${id}`);
	if (error || !data) return null;
	return data.space;
}

export async function createSpace(
	userId: string,
	name: string,
	description?: string,
	pinned: boolean = true
): Promise<{ data: Space | null; error: string | null }> {
	const { data, error } = await api.post<{ space: Space }>('/spaces', {
		name,
		description: description || null,
		pinned,
	});

	if (error || !data) {
		return { data: null, error: error?.message || 'Fehler beim Erstellen' };
	}
	return { data: data.space, error: null };
}

export async function updateSpace(
	id: string,
	updates: Partial<Space>
): Promise<{ success: boolean; error: string | null }> {
	const { error } = await api.put(`/spaces/${id}`, updates);
	return { success: !error, error: error?.message || null };
}

export async function toggleSpacePinned(
	id: string,
	pinned: boolean
): Promise<{ success: boolean; error: string | null }> {
	const { error } = await api.put(`/spaces/${id}`, { pinned });
	return { success: !error, error: error?.message || null };
}

export async function deleteSpace(id: string): Promise<{ success: boolean; error: string | null }> {
	const { error } = await api.delete(`/spaces/${id}`);
	return { success: !error, error: error?.message || null };
}
