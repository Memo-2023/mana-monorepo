import { supabase } from '~/utils/supabase';
import { getModelById } from './models';
import { logger, networkLogger } from '~/utils/logger';

export interface GenerationParams {
  prompt: string;
  model_id: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance_scale?: number;
  style?: string;
}

export async function generateImage(params: GenerationParams) {
  try {
    logger.info('=== Starting Image Generation ===');
    logger.debug('Parameters:', params);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      logger.error('User authentication failed:', userError);
      throw new Error('User not authenticated');
    }

    logger.debug('User authenticated:', user.id);

    // Get model configuration
    const model = await getModelById(params.model_id);
    if (!model) {
      throw new Error('Invalid model selected');
    }

    logger.debug('Using model:', model.name, model.replicate_id);

    // Create generation record
    logger.debug('Creating generation record...');
    const { data: generation, error: generationError } = await supabase
      .from('image_generations')
      .insert({
        user_id: user.id,
        prompt: params.prompt,
        negative_prompt: null,
        model: model.name,
        style: params.style || null,
        width: params.width || model.default_width,
        height: params.height || model.default_height,
        steps: params.steps || model.default_steps,
        guidance_scale: params.guidance_scale || model.default_guidance_scale,
        status: 'pending'
      })
      .select()
      .single();

    if (generationError) {
      logger.error('Failed to create generation record:', generationError);
      throw generationError;
    }

    logger.info('Generation record created:', generation.id);

    // No need to manually get session - supabase.functions.invoke() handles it
    logger.debug('Calling edge function...');

    networkLogger.request('generate-image', 'POST', {
      generation_id: generation.id,
      model: model.replicate_id,
    });

    // Call Edge Function to generate image
    // Explicitly pass the authorization header
    const requestBody = {
      prompt: params.prompt,
      negative_prompt: undefined,
      model_id: model.replicate_id,
      model_version: model.version,
      width: params.width || model.default_width,
      height: params.height || model.default_height,
      num_inference_steps: params.steps || model.default_steps,
      guidance_scale: params.guidance_scale || model.default_guidance_scale,
      generation_id: generation.id
    };

    logger.debug('Request body:', requestBody);

    // Use supabase.functions.invoke which handles auth properly
    // It automatically includes both the apikey and Authorization headers
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: requestBody,
    });

    if (error) {
      logger.error('Edge function error:', error);
      networkLogger.error('generate-image', error);

      // Update generation status to failed
      await supabase
        .from('image_generations')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', generation.id);

      throw error;
    }

    networkLogger.response('generate-image', 200, data);
    logger.success('Image generation successful');
    return data;
  } catch (error: any) {
    logger.error('Generation error:', error);
    logger.debug('Error stack:', error.stack);
    throw error;
  }
}

export async function getGenerationStatus(generationId: string) {
  const { data, error } = await supabase
    .from('image_generations')
    .select('*')
    .eq('id', generationId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserImages(userId: string) {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}