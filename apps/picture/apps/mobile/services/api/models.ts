/**
 * Models API - Using NestJS Backend
 */

import { fetchApi } from './client';

export interface Model {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  replicateId: string;
  version?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultSteps?: number;
  defaultGuidanceScale?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxSteps?: number;
  supportsNegativePrompt: boolean;
  supportsImg2Img: boolean;
  supportsSeed: boolean;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  costPerGeneration?: number;
  estimatedTimeSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all active models
 */
export async function getActiveModels(): Promise<Model[]> {
  console.log('Fetching models from backend...');

  const { data, error } = await fetchApi<Model[]>('/models');

  if (error) {
    console.error('Error fetching models:', error);
    throw error;
  }

  console.log(`Fetched ${data?.length || 0} models from backend`);

  return data || [];
}

/**
 * Get model by ID
 */
export async function getModelById(id: string): Promise<Model> {
  const { data, error } = await fetchApi<Model>(`/models/${id}`);

  if (error) {
    console.error('Error fetching model:', error);
    throw error;
  }

  if (!data) {
    throw new Error(`Model with id ${id} not found`);
  }

  return data;
}

/**
 * Get default model
 */
export async function getDefaultModel(): Promise<Model | null> {
  const models = await getActiveModels();
  return models.find(m => m.isDefault) || models[0] || null;
}
