import { writable } from 'svelte/store';
import type { Image } from '$lib/api/images';

export const archivedImages = writable<Image[]>([]);
export const isLoadingArchive = writable(false);
export const hasMoreArchive = writable(true);
export const currentArchivePage = writable(1);
