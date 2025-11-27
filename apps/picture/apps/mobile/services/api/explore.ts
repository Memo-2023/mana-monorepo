/**
 * Explore API - Public Gallery
 */

import { fetchApi } from './client';
import type { Image } from './images';

export type SortBy = 'recent' | 'popular' | 'trending';

export interface ExploreParams {
  page?: number;
  limit?: number;
  sortBy?: SortBy;
}

export interface SearchParams extends ExploreParams {
  searchTerm: string;
}

/**
 * Get public images for explore/discover feed
 */
export async function getExploreImages(params: ExploreParams = {}): Promise<Image[]> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'recent',
  } = params;

  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
  });

  const { data, error } = await fetchApi<Image[]>(`/explore?${searchParams}`);
  if (error) throw error;
  return data || [];
}

/**
 * Search public images
 */
export async function searchExploreImages(params: SearchParams): Promise<Image[]> {
  const {
    searchTerm,
    page = 1,
    limit = 20,
    sortBy = 'recent',
  } = params;

  const searchParams = new URLSearchParams({
    searchTerm,
    page: String(page),
    limit: String(limit),
    sortBy,
  });

  const { data, error } = await fetchApi<Image[]>(`/explore/search?${searchParams}`);
  if (error) throw error;
  return data || [];
}
