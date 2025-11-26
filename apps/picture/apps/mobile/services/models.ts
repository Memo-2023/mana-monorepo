import { supabase } from '~/utils/supabase';

export interface Model {
  id: string;
  name: string;
  display_name: string;
  replicate_id: string;
  version?: string;
  description?: string;
  default_steps: number;
  default_guidance_scale: number;
  default_width: number;
  default_height: number;
  supports_negative_prompt: boolean;
  supports_seed: boolean;
  supports_image_to_image: boolean;
  min_width: number;
  max_width: number;
  min_height: number;
  max_height: number;
  max_steps: number;
  estimated_time_seconds: number;
  cost_per_generation: number;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  supported_aspect_ratios?: string[];
}

export async function getActiveModels() {
  console.log('🔍 Fetching models from Supabase...');
  
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching models:', error);
    throw error;
  }

  console.log(`📊 Fetched ${data?.length || 0} models from database`);
  
  // Return empty array if data is null or undefined
  return (data || []) as Model[];
}

export async function getDefaultModel() {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('is_active', true)
    .eq('is_default', true)
    .single();

  if (error) {
    console.error('Error fetching default model:', error);
    throw error;
  }

  return data as Model;
}

export async function getModelById(id: string) {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching model:', error);
    throw error;
  }

  return data as Model;
}