/**
 * Tags API - Now using Backend API instead of direct Supabase calls
 */

import { fetchApi } from './client';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export async function getAllTags(): Promise<Tag[]> {
  const { data, error } = await fetchApi<Tag[]>('/tags');
  if (error) throw error;
  return data || [];
}

export async function createTag(tag: { name: string; color?: string }): Promise<Tag> {
  const { data, error } = await fetchApi<Tag>('/tags', {
    method: 'POST',
    body: tag,
  });
  if (error) throw error;
  if (!data) throw new Error('Failed to create tag');
  return data;
}

export async function updateTag(id: string, updates: { name?: string; color?: string }): Promise<Tag> {
  const { data, error } = await fetchApi<Tag>(`/tags/${id}`, {
    method: 'PATCH',
    body: updates,
  });
  if (error) throw error;
  if (!data) throw new Error('Failed to update tag');
  return data;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await fetchApi(`/tags/${id}`, {
    method: 'DELETE',
  });
  if (error) throw error;
}

export async function getImageTags(imageId: string): Promise<Tag[]> {
  const { data, error } = await fetchApi<Tag[]>(`/tags/image/${imageId}`);
  if (error) throw error;
  return data || [];
}

export async function addTagToImage(imageId: string, tagId: string): Promise<void> {
  const { error } = await fetchApi(`/tags/image/${imageId}/${tagId}`, {
    method: 'POST',
  });
  if (error) throw error;
}

export async function removeTagFromImage(imageId: string, tagId: string): Promise<void> {
  const { error } = await fetchApi(`/tags/image/${imageId}/${tagId}`, {
    method: 'DELETE',
  });
  if (error) throw error;
}
