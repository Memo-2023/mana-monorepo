/**
 * Models Service for Mobile App
 *
 * Uses the NestJS backend API instead of direct Supabase calls.
 */

import { getActiveModels as fetchModels, getModelById as fetchModelById, type Model } from './api/models';

export type { Model };

export async function getActiveModels(): Promise<Model[]> {
  console.log('Fetching models from backend...');
  const models = await fetchModels();
  console.log(`Fetched ${models.length} models from backend`);
  return models;
}

export async function getDefaultModel(): Promise<Model | null> {
  const models = await getActiveModels();
  return models.find((m) => m.isDefault) || models[0] || null;
}

export async function getModelById(id: string): Promise<Model> {
  return fetchModelById(id);
}
