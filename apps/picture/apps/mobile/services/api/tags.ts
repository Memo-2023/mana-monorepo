/**
 * Tags API - Using NestJS Backend
 */

import { fetchApi } from './client';

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

/**
 * Get all tags for current user
 */
export async function getTags(): Promise<Tag[]> {
  const { data, error } = await fetchApi<Tag[]>('/tags');
  if (error) throw error;
  return data || [];
}

/**
 * Create a new tag
 */
export async function createTag(tagData: CreateTagData): Promise<Tag> {
  const { data, error } = await fetchApi<Tag>('/tags', {
    method: 'POST',
    body: tagData,
  });
  if (error) throw error;
  if (!data) throw new Error('Failed to create tag');
  return data;
}

/**
 * Update an existing tag
 */
export async function updateTag(id: string, tagData: UpdateTagData): Promise<Tag> {
  const { data, error } = await fetchApi<Tag>(`/tags/${id}`, {
    method: 'PATCH',
    body: tagData,
  });
  if (error) throw error;
  if (!data) throw new Error('Failed to update tag');
  return data;
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<void> {
  const { error } = await fetchApi(`/tags/${id}`, {
    method: 'DELETE',
  });
  if (error) throw error;
}

/**
 * Get tags for a specific image
 */
export async function getImageTags(imageId: string): Promise<Tag[]> {
  const { data, error } = await fetchApi<Tag[]>(`/tags/image/${imageId}`);
  if (error) throw error;
  return data || [];
}

/**
 * Add a tag to an image
 */
export async function addTagToImage(imageId: string, tagId: string): Promise<void> {
  const { error } = await fetchApi(`/tags/image/${imageId}/${tagId}`, {
    method: 'POST',
  });
  if (error) throw error;
}

/**
 * Remove a tag from an image
 */
export async function removeTagFromImage(imageId: string, tagId: string): Promise<void> {
  const { error } = await fetchApi(`/tags/image/${imageId}/${tagId}`, {
    method: 'DELETE',
  });
  if (error) throw error;
}
