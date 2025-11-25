import { writable } from 'svelte/store';
import type { Database } from '@picture/shared/types';

type Image = Database['public']['Tables']['images']['Row'];

export const archivedImages = writable<Image[]>([]);
export const isLoadingArchive = writable(false);
export const hasMoreArchive = writable(true);
export const currentArchivePage = writable(1);
