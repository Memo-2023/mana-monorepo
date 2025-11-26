import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client for auth verification (with user context)
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

    // Create a service role client for database operations that bypass RLS
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

    // Parse request body
    const { 
      prompt, 
      model_id,
      model_version,
      width,
      height,
      num_inference_steps,
      guidance_scale,
      generation_id,
      seed = null,
      // Image-to-image specific parameters
      source_image_url = null,
      strength = null
    } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    if (!model_id) {
      throw new Error('Model ID is required');
    }

    // Use provided model information
    let finalWidth = width || 1024;
    let finalHeight = height || 1024;
    const finalSteps = num_inference_steps || 30;
    const finalGuidance = guidance_scale || 7.5;

    // Update generation record if ID provided
    if (generation_id) {
      await supabaseAdmin
        .from('image_generations')
        .update({
          status: 'processing'
        })
        .eq('id', generation_id)
        .eq('user_id', user.id);
    }

    // Get Replicate API token
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN') || Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token not configured');
    }

    console.log('Using model:', model_id);
    console.log('Model version:', model_version);
    console.log('Dimensions:', finalWidth, 'x', finalHeight);

    // Calculate aspect ratio for models that need it
    const aspectRatio = `${finalWidth}:${finalHeight}`;
    
    // Simplify aspect ratio to common formats
    let simplifiedRatio = aspectRatio;
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(finalWidth, finalHeight);
    const simplifiedWidth = finalWidth / divisor;
    const simplifiedHeight = finalHeight / divisor;
    simplifiedRatio = `${simplifiedWidth}:${simplifiedHeight}`;
    
    console.log('Calculated aspect ratio:', simplifiedRatio);

    // Handle image-to-image if source image is provided
    let sourceImageBase64 = null;
    if (source_image_url && strength !== null) {
      console.log('Image-to-image mode detected');
      console.log('Source image URL:', source_image_url);
      console.log('Strength:', strength);
      
      try {
        // Download the source image
        const imageResponse = await fetch(source_image_url);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch source image');
        }
        
        // Convert to base64
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64String = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        sourceImageBase64 = `data:${imageResponse.headers.get('content-type') || 'image/jpeg'};base64,${base64String}`;
        
        console.log('Source image converted to base64, length:', sourceImageBase64.length);
      } catch (error) {
        console.error('Error processing source image:', error);
        throw new Error('Failed to process source image for img2img');
      }
    }

    // Prepare input based on model type
    let input: any = {};

    if (model_id.includes('flux-schnell')) {
      // Flux Schnell only supports specific aspect ratios
      const supportedRatios = ['1:1', '16:9', '21:9', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '9:16', '9:21'];

      // Map the simplified ratio to the closest supported ratio
      let fluxAspectRatio = simplifiedRatio;
      if (!supportedRatios.includes(simplifiedRatio)) {
        // Calculate the numeric ratio
        const [w, h] = simplifiedRatio.split(':').map(Number);
        const targetRatio = w / h;

        // Find the closest supported ratio
        let closestRatio = '1:1';
        let minDiff = Infinity;

        for (const ratio of supportedRatios) {
          const [rw, rh] = ratio.split(':').map(Number);
          const r = rw / rh;
          const diff = Math.abs(r - targetRatio);
          if (diff < minDiff) {
            minDiff = diff;
            closestRatio = ratio;
          }
        }

        fluxAspectRatio = closestRatio;
        console.log(`Mapped ${simplifiedRatio} to closest supported ratio: ${fluxAspectRatio}`);
      }

      // Calculate actual dimensions based on the selected aspect ratio
      // Flux Schnell typically generates at 1024px on the shorter side
      const [aspectW, aspectH] = fluxAspectRatio.split(':').map(Number);
      if (aspectW > aspectH) {
        // Landscape: height is shorter
        finalHeight = 1024;
        finalWidth = Math.round((finalHeight * aspectW) / aspectH);
      } else if (aspectW < aspectH) {
        // Portrait: width is shorter
        finalWidth = 1024;
        finalHeight = Math.round((finalWidth * aspectH) / aspectW);
      } else {
        // Square
        finalWidth = 1024;
        finalHeight = 1024;
      }

      console.log(`Final dimensions for Flux Schnell: ${finalWidth}x${finalHeight}`);

      input = {
        prompt,
        num_inference_steps: finalSteps,
        guidance: finalGuidance,
        num_outputs: 1,
        aspect_ratio: fluxAspectRatio,
        output_format: 'webp',
        output_quality: 90,
      };
    } else if (model_id.includes('flux-krea-dev') || model_id.includes('flux-dev')) {
      input = {
        prompt,
        num_inference_steps: finalSteps,
        guidance_scale: finalGuidance,
        num_outputs: 1,
        width: finalWidth,
        height: finalHeight,
        output_format: 'webp',
        output_quality: 90,
      };
      
      // Add image-to-image parameters if provided
      if (sourceImageBase64 && strength !== null) {
        input.image = sourceImageBase64;
        input.prompt_strength = 1 - strength; // Flux uses prompt_strength which is inverse of strength
        console.log('Added img2img params for Flux Dev, prompt_strength:', input.prompt_strength);
      }
    } else if (model_id.includes('ideogram-v3-turbo') || model_id.includes('ideogram')) {
      input = {
        prompt,
        aspect_ratio: simplifiedRatio,
        model: 'turbo',
        style_type: 'auto',
      };
      if (seed) {
        input.seed = seed;
      }
    } else if (model_id.includes('imagen-4-fast') || model_id.includes('imagen')) {
      input = {
        prompt,
        aspect_ratio: simplifiedRatio,
        safety_tolerance: 2,
        output_format: 'png',
      };
    } else if (model_id.includes('sdxl-lightning')) {
      // SDXL Lightning has specific parameters
      input = {
        prompt,
        width: finalWidth,
        height: finalHeight,
        num_inference_steps: 4, // Always 4 steps for Lightning
        guidance_scale: 0, // No guidance for Lightning
        disable_safety_checker: false,
        output_format: 'webp',
        output_quality: 90,
      };
      
      // Add image-to-image parameters if provided
      if (sourceImageBase64 && strength !== null) {
        input.image = sourceImageBase64;
        input.strength = strength;
        console.log('Added img2img params for SDXL Lightning, strength:', input.strength);
      }
      
      if (seed) {
        input.seed = seed;
      }
    } else if (model_id.includes('sdxl')) {
      // Regular SDXL
      input = {
        prompt,
        width: finalWidth,
        height: finalHeight,
        num_inference_steps: finalSteps,
        guidance_scale: finalGuidance,
        refine: 'expert_ensemble_refiner',
        high_noise_frac: 0.8,
        output_format: 'webp',
        output_quality: 90,
      };
      
      // Add image-to-image parameters if provided
      if (sourceImageBase64 && strength !== null) {
        input.image = sourceImageBase64;
        input.prompt_strength = strength;
        console.log('Added img2img params for SDXL, prompt_strength:', input.prompt_strength);
      }
      
      if (seed) {
        input.seed = seed;
      }
    } else if (model_id.includes('seedream-4')) {
      // SeeDream 4 has different parameters
      let sizePreset = '2K';
      if (finalWidth >= 4096 || finalHeight >= 4096) {
        sizePreset = '4K';
      } else if (finalWidth <= 1024 && finalHeight <= 1024) {
        sizePreset = '1K';
      }

      input = {
        prompt,
        size: sizePreset,
        width: finalWidth,
        height: finalHeight,
        max_images: 1,
        aspect_ratio: simplifiedRatio,
      };

      // Add image-to-image parameters if provided
      if (sourceImageBase64 && strength !== null) {
        input.image_input = [sourceImageBase64];
        console.log('Added img2img params for SeeDream 4');
      }
    } else if (model_id.includes('seedream-3') || model_id.includes('seedream')) {
      input = {
        prompt,
        width: finalWidth,
        height: finalHeight,
        num_inference_steps: finalSteps,
        guidance_scale: finalGuidance,
      };
      if (seed) {
        input.seed = seed;
      }
    } else if (model_id.includes('flux-1.1-pro')) {
      // Flux 1.1 Pro uses aspect_ratio
      input = {
        prompt,
        aspect_ratio: simplifiedRatio,
        output_format: 'webp',
        output_quality: 90,
        safety_tolerance: 2,
      };
      if (seed) {
        input.seed = seed;
      }
    } else if (model_id.includes('recraft-v3-svg')) {
      input = {
        prompt,
        width: finalWidth,
        height: finalHeight,
        output_format: 'svg',
        style: 'vector_illustration',
      };
      if (seed) {
        input.seed = seed;
      }
    } else if (model_id.includes('recraft-v3') || model_id.includes('recraft')) {
      // Recraft V3 (non-SVG) uses size parameter
      input = {
        prompt,
        size: `${finalWidth}x${finalHeight}`,
        style: 'realistic_image',
      };
    } else if (model_id.includes('stable-diffusion-3.5') || model_id.includes('sd-3-5')) {
      // SD 3.5 Large
      input = {
        prompt,
        aspect_ratio: simplifiedRatio,
        cfg: finalGuidance,
        steps: finalSteps,
        output_format: 'webp',
        output_quality: 90,
      };
      if (seed) {
        input.seed = seed;
      }
    } else if (model_id.includes('qwen-image') || model_id.includes('qwen')) {
      // Qwen Image has specific parameter requirements
      input = {
        prompt,
        aspect_ratio: simplifiedRatio,
        num_inference_steps: finalSteps,
        guidance: finalGuidance,
        go_fast: true,
        image_size: 'optimize_for_quality',
        output_format: 'webp',
        output_quality: 90,
        enhance_prompt: false,
        disable_safety_checker: false
      };
      if (seed) {
        input.seed = seed;
      }
    } else {
      // Default/fallback input structure
      input = {
        prompt,
        width: finalWidth,
        height: finalHeight,
        num_inference_steps: finalSteps,
        guidance_scale: finalGuidance,
      };
      if (seed) {
        input.seed = seed;
      }
    }

    console.log('Calling Replicate API with input:', JSON.stringify(input, null, 2));

    // Prepare Replicate API request body
    // For official models without version, use model ID format (owner/name)
    // For models with version, use version hash
    const requestBody: any = { input };

    if (model_version) {
      // Use version hash if available
      requestBody.version = model_version;
      console.log('Using version hash:', model_version);
    } else {
      // Use model ID for official models without version
      requestBody.model = model_id;
      console.log('Using model ID (official model):', model_id);
    }

    // Call Replicate API
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('Replicate API error:', errorText);
      console.error('Response status:', replicateResponse.status);
      
      // Update generation with error if ID provided
      if (generation_id) {
        await supabaseAdmin
          .from('image_generations')
          .update({
            status: 'failed',
            error_message: `Replicate API error: ${errorText}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', generation_id);
      }
      
      throw new Error(`Replicate API error (${replicateResponse.status}): ${errorText}`);
    }

    const prediction = await replicateResponse.json();
    console.log('Prediction created:', prediction.id, 'Status:', prediction.status);

    // Update generation with prediction ID
    if (generation_id) {
      await supabaseAdmin
        .from('image_generations')
        .update({
          status: 'processing',
          replicate_prediction_id: prediction.id,
          error_message: null
        })
        .eq('id', generation_id);
    }

    // Start polling for completion
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max for slower models

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
      attempts++;

      // Get prediction status
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Failed to get prediction status');
        continue;
      }

      const result = await statusResponse.json();
      console.log(`Poll ${attempts}: ${result.status}`);

      if (result.status === 'succeeded' && result.output) {
        // Get the output URL - different models return in different formats
        let outputUrl;
        if (Array.isArray(result.output)) {
          outputUrl = result.output[0];
        } else if (typeof result.output === 'string') {
          outputUrl = result.output;
        } else if (result.output.url) {
          outputUrl = result.output.url;
        } else {
          console.error('Unexpected output format:', result.output);
          throw new Error('Unexpected output format from model');
        }
        
        console.log('Output URL received:', outputUrl);
        
        // Determine file format
        let format = 'webp';
        let contentType = 'image/webp';
        
        if (model_id.includes('recraft-v3-svg')) {
          format = 'svg';
          contentType = 'image/svg+xml';
        } else if (model_id.includes('imagen-4')) {
          format = 'png';
          contentType = 'image/png';
        } else if (outputUrl.includes('.png')) {
          format = 'png';
          contentType = 'image/png';
        } else if (outputUrl.includes('.jpg') || outputUrl.includes('.jpeg')) {
          format = 'jpeg';
          contentType = 'image/jpeg';
        }
        
        // Download the generated content
        const contentResponse = await fetch(outputUrl);
        if (!contentResponse.ok) {
          throw new Error('Failed to download generated content from Replicate');
        }
        
        const contentBlob = await contentResponse.blob();
        const arrayBuffer = await contentBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Generate filename
        const filename = `${generation_id || Date.now()}.${format}`;
        const storagePath = `${user.id}/${filename}`;
        
        console.log('Uploading to storage:', storagePath);
        
        // Upload to Supabase Storage (using admin client to bypass RLS)
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
        
        // Save image record if generation_id provided (using admin client to bypass RLS)
        if (generation_id) {
          const { data: imageData, error: imageError } = await supabaseAdmin
            .from('images')
            .insert({
              generation_id: generation_id,
              user_id: user.id,
              filename,
              storage_path: storagePath,
              public_url: publicUrl,
              file_size: uint8Array.length,
              width: finalWidth,
              height: finalHeight,
              format,
              prompt: prompt,
              negative_prompt: null,
              model: model_id.split('/').pop()
            })
            .select()
            .single();

          if (imageError) {
            console.error('Image record error:', imageError);
            throw imageError;
          }

          // Update generation status
          const generationTime = Math.floor((Date.now() - startTime) / 1000);
          await supabaseAdmin
            .from('image_generations')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              generation_time_seconds: generationTime
            })
            .eq('id', generation_id);
          
          console.log('Generation completed successfully');
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              image: imageData,
              generation_time: generationTime,
            }),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        } else {
          // Return without saving to database
          return new Response(
            JSON.stringify({ 
              success: true, 
              url: publicUrl,
              format,
              generation_time: Math.floor((Date.now() - startTime) / 1000),
            }),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
      } else if (result.status === 'failed' || result.status === 'canceled') {
        const errorMsg = result.error || `Generation ${result.status}`;
        console.error('Generation failed:', errorMsg);

        // Update generation with error if ID provided
        if (generation_id) {
          await supabaseAdmin
            .from('image_generations')
            .update({
              status: 'failed',
              error_message: errorMsg,
              completed_at: new Date().toISOString()
            })
            .eq('id', generation_id);
        }

        throw new Error(errorMsg);
      }
    }

    // Timeout
    if (generation_id) {
      await supabaseAdmin
        .from('image_generations')
        .update({
          status: 'failed',
          error_message: 'Generation timeout after 10 minutes',
          completed_at: new Date().toISOString()
        })
        .eq('id', generation_id);
    }
    
    throw new Error('Generation timeout after 10 minutes');

  } catch (error) {
    console.error('Error:', error.message);
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