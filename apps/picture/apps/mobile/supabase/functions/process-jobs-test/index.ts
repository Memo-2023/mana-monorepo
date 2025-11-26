import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { processGeneration } from '../process-generation/index.ts';

/**
 * TEST VERSION 2 - Testing with import
 *
 * This version tests if the import of process-generation causes the issue
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  console.log('=== STEP 1: Function invoked ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== STEP 2: Getting environment variables ===');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('SUPABASE_URL exists:', !!supabaseUrl);
    console.log('SUPABASE_URL length:', supabaseUrl?.length || 0);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceRoleKey);
    console.log('SUPABASE_SERVICE_ROLE_KEY length:', supabaseServiceRoleKey?.length || 0);

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not set');
    }

    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    console.log('=== STEP 3: Importing createClient ===');

    // Import here to see if this causes issues
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');

    console.log('createClient imported successfully');

    console.log('=== STEP 4: Creating Supabase client ===');

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Supabase client created successfully');

    console.log('=== STEP 5: Testing RPC call ===');

    // Test a simple query first
    const { data: testData, error: testError } = await supabaseAdmin
      .from('job_queue')
      .select('count')
      .limit(1);

    console.log('Test query result:', { testData, testError });

    console.log('=== STEP 6: Calling claim_next_job ===');

    const { data: jobs, error: claimError } = await supabaseAdmin.rpc('claim_next_job');

    console.log('claim_next_job result:', {
      jobs: jobs ? `${jobs.length} jobs` : 'null',
      error: claimError
    });

    if (claimError) {
      console.error('Error details:', JSON.stringify(claimError, null, 2));
      throw new Error(`claim_next_job failed: ${claimError.message}`);
    }

    console.log('=== STEP 7: Testing processGeneration import ===');

    console.log('processGeneration exists:', typeof processGeneration);

    console.log('=== STEP 8: Success ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Debug test completed successfully (with import)',
        jobs_found: jobs?.length || 0,
        debug: {
          supabaseUrl: supabaseUrl.substring(0, 20) + '...',
          hasServiceRoleKey: !!supabaseServiceRoleKey,
          testQueryWorked: !testError,
          claimJobWorked: !claimError,
          processGenerationImported: typeof processGeneration
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error: any) {
    console.error('=== ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        errorName: error.name,
        errorStack: error.stack,
        success: false
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
