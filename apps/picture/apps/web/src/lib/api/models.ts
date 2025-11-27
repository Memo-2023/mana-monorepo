/**
 * Models API - Now using Backend API instead of direct Supabase calls
 */

import { fetchApi } from './client';

export interface Model {
  id: string;
  name: string;
  displayName: string;
  replicateId: string;
  version?: string;
  description?: string;
  category?: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultSteps: number;
  defaultGuidanceScale: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  supportsNegativePrompt: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export async function getActiveModels(): Promise<Model[]> {
  const { data, error } = await fetchApi<Model[]>('/models');
  if (error) throw error;
  return data || [];
}

export async function getModelById(id: string): Promise<Model> {
  const { data, error } = await fetchApi<Model>(`/models/${id}`);
  if (error) throw error;
  if (!data) throw new Error('Model not found');
  return data;
}
