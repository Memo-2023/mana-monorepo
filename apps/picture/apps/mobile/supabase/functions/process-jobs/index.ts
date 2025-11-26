import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { processGeneration } from '../process-generation/lib.ts';

/**
 * PROCESS JOBS WORKER EDGE FUNCTION
 *
 * Purpose: Background worker that processes queued jobs from the job_queue table
 *
 * How it works:
 * 1. Called by pg_cron every minute (or manually via HTTP)
 * 2. Claims next available job(s) from queue using claim_next_job() function
 * 3. Processes job based on job_type:
 *    - 'generate-image': Calls Replicate API via processGeneration()
 *    - 'download-image': Downloads and stores generated image
 * 4. Updates job status and enqueues follow-up jobs as needed
 * 5. Processes multiple jobs in parallel for better throughput
 *
 * Configuration:
 * - MAX_PARALLEL_JOBS: Number of jobs to process concurrently (default 3)
 * - Can be triggered manually for testing: POST to function URL
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const MAX_PARALLEL_JOBS = 3; // Process up to 3 jobs in parallel
const JOB_TIMEOUT_MS = 600000; // 10 minutes per job

interface Job {
  id: string;
  job_type: string;
  payload: any;
  attempt_number: number;
  max_attempts: number;
}

/**
 * Process a single 'generate-image' job
 */
async function processGenerateImageJob(job: Job, supabaseAdmin: any): Promise<void> {
  console.log(`Processing generate-image job: ${job.id}`);
  console.log('Payload:', JSON.stringify(job.payload, null, 2));

  const {
    generation_id,
    user_id,
    prompt,
    negative_prompt,
    model_id,
    model_version,
    width,
    height,
    num_inference_steps,
    guidance_scale,
    seed,
    source_image_url,
    strength
  } = job.payload;

  if (!generation_id) {
    throw new Error('Missing generation_id in job payload');
  }

  try {
    // Update generation status to processing
    await supabaseAdmin
      .from('image_generations')
      .update({
        status: 'processing',
        error_message: null
      })
      .eq('id', generation_id);

    console.log('Updated generation status to processing');

    // Get Replicate API token
    const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN') || Deno.env.get('REPLICATE_API_KEY');
    if (!replicateApiToken) {
      throw new Error('Replicate API token not configured');
    }

    // Call the generation processor
    const result = await processGeneration(
      {
        prompt,
        negative_prompt,
        model_id,
        model_version,
        width: width || 1024,
        height: height || 1024,
        num_inference_steps: num_inference_steps || 30,
        guidance_scale: guidance_scale || 7.5,
        seed,
        source_image_url,
        strength
      },
      replicateApiToken
    );

    if (!result.success) {
      throw new Error(result.error || 'Generation failed');
    }

    console.log('Generation completed successfully');
    console.log('Output URL:', result.output_url);

    // Enqueue download-image job to handle the actual download and storage
    const { data: downloadJobId, error: queueError } = await supabaseAdmin.rpc('enqueue_job', {
      p_job_type: 'download-image',
      p_payload: {
        generation_id,
        user_id,
        output_url: result.output_url,
        format: result.format,
        width: result.width,
        height: result.height,
        prompt,
        negative_prompt,
        model_id
      },
      p_priority: 1, // High priority - image is ready
      p_max_attempts: 3
    });

    if (queueError) {
      console.error('Failed to enqueue download job:', queueError);
      throw new Error('Failed to enqueue download job');
    }

    console.log('Enqueued download-image job:', downloadJobId);

    // Mark generation as 'downloading' (intermediate state)
    await supabaseAdmin
      .from('image_generations')
      .update({
        status: 'downloading',
        generation_time_seconds: result.generation_time_seconds
      })
      .eq('id', generation_id);

    // Complete the job
    await supabaseAdmin.rpc('complete_job', {
      p_job_id: job.id,
      p_result: {
        output_url: result.output_url,
        format: result.format,
        download_job_id: downloadJobId
      }
    });

    console.log('Job completed successfully');

  } catch (error) {
    console.error('Error processing generate-image job:', error.message);

    // Update generation to failed
    await supabaseAdmin
      .from('image_generations')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', generation_id);

    // Complete job with error (will retry if attempts remain)
    await supabaseAdmin.rpc('complete_job', {
      p_job_id: job.id,
      p_error: error.message
    });

    throw error;
  }
}

/**
 * Process a single 'download-image' job
 */
async function processDownloadImageJob(job: Job, supabaseAdmin: any): Promise<void> {
  console.log(`Processing download-image job: ${job.id}`);
  console.log('Payload:', JSON.stringify(job.payload, null, 2));

  const {
    generation_id,
    user_id,
    output_url,
    format,
    width,
    height,
    prompt,
    negative_prompt,
    model_id
  } = job.payload;

  if (!generation_id || !output_url || !user_id) {
    throw new Error('Missing required fields in job payload');
  }

  try {
    console.log('Downloading image from:', output_url);

    // Download the generated image
    const contentResponse = await fetch(output_url);
    if (!contentResponse.ok) {
      throw new Error('Failed to download generated image from Replicate');
    }

    const contentBlob = await contentResponse.blob();
    const arrayBuffer = await contentBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('Image downloaded, size:', uint8Array.length, 'bytes');

    // Generate filename and storage path
    const filename = `${generation_id}.${format || 'webp'}`;
    const storagePath = `${user_id}/${filename}`;

    console.log('Uploading to storage:', storagePath);

    // Determine content type
    let contentType = 'image/webp';
    if (format === 'svg') contentType = 'image/svg+xml';
    else if (format === 'png') contentType = 'image/png';
    else if (format === 'jpeg') contentType = 'image/jpeg';

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('generated-images')
      .upload(storagePath, uint8Array, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('generated-images')
      .getPublicUrl(storagePath);

    console.log('Public URL:', publicUrl);

    // Extract model name
    const modelName = model_id?.split('/').pop() || 'unknown';

    // Save image record
    const { data: imageData, error: imageError } = await supabaseAdmin
      .from('images')
      .insert({
        generation_id,
        user_id,
        filename,
        storage_path: storagePath,
        public_url: publicUrl,
        file_size: uint8Array.length,
        width: width || 1024,
        height: height || 1024,
        format: format || 'webp',
        prompt,
        negative_prompt,
        model: modelName
      })
      .select()
      .single();

    if (imageError) {
      console.error('Image record error:', imageError);
      throw imageError;
    }

    console.log('Image record created:', imageData.id);

    // Update generation to completed
    await supabaseAdmin
      .from('image_generations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', generation_id);

    // Complete the job
    await supabaseAdmin.rpc('complete_job', {
      p_job_id: job.id,
      p_result: {
        image_id: imageData.id,
        public_url: publicUrl,
        storage_path: storagePath
      }
    });

    console.log('Job completed successfully');

  } catch (error) {
    console.error('Error processing download-image job:', error.message);

    // Update generation to failed if this is the last attempt
    if (job.attempt_number >= job.max_attempts) {
      await supabaseAdmin
        .from('image_generations')
        .update({
          status: 'failed',
          error_message: `Failed to download/store image: ${error.message}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', generation_id);
    }

    // Complete job with error
    await supabaseAdmin.rpc('complete_job', {
      p_job_id: job.id,
      p_error: error.message
    });

    throw error;
  }
}

/**
 * Process a single job based on its type
 */
async function processJob(job: Job, supabaseAdmin: any): Promise<void> {
  console.log(`\n=== PROCESSING JOB ${job.id} ===`);
  console.log('Type:', job.job_type);
  console.log('Attempt:', job.attempt_number, '/', job.max_attempts);

  const startTime = Date.now();

  try {
    switch (job.job_type) {
      case 'generate-image':
        await processGenerateImageJob(job, supabaseAdmin);
        break;

      case 'download-image':
        await processDownloadImageJob(job, supabaseAdmin);
        break;

      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }

    const duration = Date.now() - startTime;
    console.log(`Job ${job.id} completed in ${duration}ms`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Job ${job.id} failed after ${duration}ms:`, error.message);
    throw error;
  }
}

/**
 * Claim and process a single job
 */
async function claimAndProcessJob(supabaseAdmin: any): Promise<boolean> {
  try {
    // Claim next available job
    const { data: jobs, error: claimError } = await supabaseAdmin.rpc('claim_next_job');

    if (claimError) {
      console.error('Error claiming job:', claimError);
      return false;
    }

    if (!jobs || jobs.length === 0) {
      // No jobs available
      return false;
    }

    const job = jobs[0]; // claim_next_job returns SETOF, so we take the first element
    console.log('Claimed job:', job.id);

    // Process the job with timeout
    await Promise.race([
      processJob(job, supabaseAdmin),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Job timeout')), JOB_TIMEOUT_MS)
      )
    ]);

    return true;

  } catch (error) {
    console.error('Error in claimAndProcessJob:', error.message);
    return false;
  }
}

/**
 * Main worker loop - processes multiple jobs in parallel
 */
async function processJobs(supabaseAdmin: any): Promise<{ processed: number; errors: number }> {
  console.log('=== STARTING JOB PROCESSOR ===');
  console.log('Max parallel jobs:', MAX_PARALLEL_JOBS);

  let processed = 0;
  let errors = 0;

  // Process jobs in parallel
  const jobPromises: Promise<boolean>[] = [];

  for (let i = 0; i < MAX_PARALLEL_JOBS; i++) {
    jobPromises.push(claimAndProcessJob(supabaseAdmin));
  }

  const results = await Promise.all(jobPromises);

  // Count successes
  for (const success of results) {
    if (success) {
      processed++;
    } else {
      errors++;
    }
  }

  console.log('=== JOB PROCESSOR FINISHED ===');
  console.log('Processed:', processed);
  console.log('Errors:', errors);

  return { processed, errors };
}

/**
 * Edge Function Handler
 *
 * This function can be called:
 * 1. By pg_cron every minute: SELECT net.http_post(...)
 * 2. Manually via HTTP POST for testing
 * 3. By other functions that need to trigger job processing
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== PROCESS JOBS INVOKED ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    // Create admin client for database operations
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

    // Process jobs
    const result = await processJobs(supabaseAdmin);

    return new Response(
      JSON.stringify({
        success: true,
        processed: result.processed,
        errors: result.errors,
        message: `Processed ${result.processed} job(s) with ${result.errors} error(s)`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in process-jobs:', error.message);
    console.error('Stack:', error.stack);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
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
