import { writable } from 'svelte/store';
import type { Database } from '@picture/shared/types';

type Tag = Database['public']['Tables']['tags']['Row'];

export const tags = writable<Tag[]>([]);
export const selectedTags = writable<string[]>([]);
export const isLoadingTags = writable<boolean>(false);
