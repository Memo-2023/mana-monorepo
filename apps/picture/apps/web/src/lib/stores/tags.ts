import { writable } from 'svelte/store';
import type { Tag } from '$lib/api/tags';

export const tags = writable<Tag[]>([]);
export const selectedTags = writable<string[]>([]);
export const isLoadingTags = writable<boolean>(false);
