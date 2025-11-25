import { writable } from 'svelte/store';
import type { Database } from '@picture/shared/types';

type Model = Database['public']['Tables']['models']['Row'];

export const models = writable<Model[]>([]);
export const selectedModel = writable<Model | null>(null);
export const isLoadingModels = writable(false);
