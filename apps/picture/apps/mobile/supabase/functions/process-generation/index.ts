import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { processGeneration, type GenerationParams, type GenerationResult } from './lib.ts';

/**
 * PROCESS GENERATION EDGE FUNCTION
 *
 * Standalone Edge Function wrapper for processGeneration library.
 * Useful for testing and direct invocation.
 *
 * The actual generation logic lives in lib.ts so it can be safely
 * imported by other functions (like process-jobs) without causing
 * Deno.serve() conflicts.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== PROCESS GENERATION EDGE FUNCTION INVOKED ===');

    // Get Replicate API token
    const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN') || Deno.env.get('REPLICATE_API_KEY');
    if (!replicateApiToken) {
      throw new Error('Replicate API token not configured');
    }

    // Parse request body
    const params: GenerationParams = await req.json();

    console.log('Received generation request:', {
      model: params.model_id,
      prompt: params.prompt.substring(0, 50) + '...',
      dimensions: `${params.width}x${params.height}`
    });

    // Call generation library
    const result: GenerationResult = await processGeneration(params, replicateApiToken);

    // Return response
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error: any) {
    console.error('Error in process-generation handler:', error.message);
    console.error('Stack:', error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
