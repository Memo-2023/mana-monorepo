/**
 * Profiles API - Using NestJS Backend
 */

import { fetchApi } from './client';

export interface Profile {
  id: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalImages: number;
  favoriteImages: number;
  archivedImages: number;
  publicImages: number;
}

export interface UpdateProfileData {
  username?: string;
  avatarUrl?: string;
}

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<Profile> {
  const { data, error } = await fetchApi<Profile>('/profiles/me');
  if (error) throw error;
  if (!data) throw new Error('Profile not found');
  return data;
}

/**
 * Update current user's profile
 */
export async function updateProfile(updateData: UpdateProfileData): Promise<Profile> {
  const { data, error } = await fetchApi<Profile>('/profiles/me', {
    method: 'PATCH',
    body: updateData,
  });
  if (error) throw error;
  if (!data) throw new Error('Failed to update profile');
  return data;
}

/**
 * Get user statistics (images count, favorites, etc.)
 */
export async function getUserStats(): Promise<UserStats> {
  const { data, error } = await fetchApi<UserStats>('/profiles/stats');
  if (error) throw error;
  return data || {
    totalImages: 0,
    favoriteImages: 0,
    archivedImages: 0,
    publicImages: 0,
  };
}
