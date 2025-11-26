import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * START GENERATION EDGE FUNCTION
 *
 * Purpose: Accept image generation request and enqueue for async processing
 *
 * Flow:
 * 1. Validate user authentication
 * 2. Validate model configuration
 * 3. Create generation record in database
 * 4. Enqueue job for background processing
 * 5. Return immediately with generation ID
 *
 * This function returns INSTANTLY - no waiting for image generation!
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== START GENERATION REQUEST ===');

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client with user context
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const {
      prompt,
      model_id,
      model_version,
      width,
      height,
      num_inference_steps,
      guidance_scale,
      seed,
      negative_prompt,
      source_image_url,
      strength,
      style
    } = await req.json();

    // Validate required fields
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    if (!model_id) {
      throw new Error('Model ID is required');
    }

    console.log('Generating with model:', model_id);
    console.log('Prompt:', prompt.substring(0, 50) + '...');

    // Get model configuration from database
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('*')
      .eq('replicate_id', model_id)
      .single();

    if (modelError) {
      console.error('Model lookup error:', modelError);
    }

    const modelName = model?.name || model_id.split('/').pop();

    // Create admin client for database writes (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create generation record
    const { data: generation, error: generationError } = await supabaseAdmin
      .from('image_generations')
      .insert({
        user_id: user.id,
        prompt,
        negative_prompt: negative_prompt || null,
        model: modelName,
        style: style || null,
        width: width || model?.default_width || 1024,
        height: height || model?.default_height || 1024,
        steps: num_inference_steps || model?.default_steps || 30,
        guidance_scale: guidance_scale || model?.default_guidance_scale || 7.5,
        status: 'pending'
      })
      .select()
      .single();

    if (generationError) {
      console.error('Failed to create generation record:', generationError);
      throw new Error('Failed to create generation record');
    }

    console.log('Generation record created:', generation.id);

    // Enqueue job for async processing
    const { data: jobId, error: queueError } = await supabaseAdmin.rpc('enqueue_job', {
      p_job_type: 'generate-image',
      p_payload: {
        generation_id: generation.id,
        user_id: user.id,
        prompt,
        negative_prompt,
        model_id,
        model_version,
        width: width || model?.default_width || 1024,
        height: height || model?.default_height || 1024,
        num_inference_steps: num_inference_steps || model?.default_steps || 30,
        guidance_scale: guidance_scale || model?.default_guidance_scale || 7.5,
        seed,
        source_image_url,
        strength
      },
      p_priority: 0,
      p_max_attempts: 3
    });

    if (queueError) {
      console.error('Failed to enqueue job:', queueError);

      // Update generation status to failed
      await supabaseAdmin
        .from('image_generations')
        .update({
          status: 'failed',
          error_message: 'Failed to enqueue job'
        })
        .eq('id', generation.id);

      throw new Error('Failed to enqueue job');
    }

    console.log('Job enqueued:', jobId);

    // Update generation with job ID
    await supabaseAdmin
      .from('image_generations')
      .update({
        status: 'queued',
        // Could store job_id here for tracking
      })
      .eq('id', generation.id);

    console.log('=== GENERATION QUEUED SUCCESSFULLY ===');

    // Return immediately!
    return new Response(
      JSON.stringify({
        success: true,
        generation_id: generation.id,
        job_id: jobId,
        status: 'queued',
        message: 'Image generation started. You will be notified when complete.'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in start-generation:', error.message);
    console.error('Stack:', error.stack);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
