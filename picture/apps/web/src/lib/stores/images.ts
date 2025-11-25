import { writable } from 'svelte/store';
import type { Database } from '@picture/shared/types';

type Image = Database['public']['Tables']['images']['Row'];

export const images = writable<Image[]>([]);
export const selectedImage = writable<Image | null>(null);
export const isLoading = writable(false);
export const hasMore = writable(true);
export const currentPage = writable(1);
export const showFavoritesOnly = writable(false);
