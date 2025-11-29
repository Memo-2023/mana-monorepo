import { writable } from 'svelte/store';
import type { Model } from '$lib/api/models';

export const models = writable<Model[]>([]);
export const selectedModel = writable<Model | null>(null);
export const isLoadingModels = writable(false);
