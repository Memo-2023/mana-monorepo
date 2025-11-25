/**
 * PROCESS GENERATION LIBRARY
 *
 * Pure functions for image generation via Replicate API.
 * This module contains NO Deno.serve() so it can be safely imported
 * by other Edge Functions.
 *
 * Can be imported by:
 * - process-generation/index.ts (Edge Function wrapper)
 * - process-jobs/index.ts (Worker function)
 * - Any other function that needs to generate images
 */

// Supported model types and their configurations
interface ModelConfig {
  id: string;
  version?: string;
  supportsImg2Img: boolean;
  supportsAspectRatio: boolean;
  supportsDimensions: boolean;
}

export interface GenerationParams {
  prompt: string;
  negative_prompt?: string | null;
  model_id: string;
  model_version?: string | null;
  width: number;
  height: number;
  num_inference_steps: number;
  guidance_scale: number;
  seed?: number | null;
  source_image_url?: string | null;
  strength?: number | null;
}

export interface GenerationResult {
  success: boolean;
  output_url?: string;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
  generation_time_seconds?: number;
}

/**
 * Calculate greatest common divisor for aspect ratio simplification
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Simplify aspect ratio to smallest whole numbers (e.g., 1920:1080 -> 16:9)
 */
function simplifyAspectRatio(width: number, height: number): string {
  const divisor = gcd(width, height);
  const simplifiedWidth = width / divisor;
  const simplifiedHeight = height / divisor;
  return `${simplifiedWidth}:${simplifiedHeight}`;
}

/**
 * Convert image URL to base64 data URI for img2img
 */
async function convertImageToBase64(imageUrl: string): Promise<string> {
  console.log('Converting image to base64:', imageUrl);

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error('Failed to fetch source image');
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const base64String = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  const dataUri = `data:${contentType};base64,${base64String}`;

  console.log('Image converted to base64, length:', dataUri.length);
  return dataUri;
}

/**
 * Build model-specific input parameters for Replicate API
 */
function buildModelInput(params: GenerationParams, sourceImageBase64?: string | null): any {
  const {
    prompt,
    model_id,
    width,
    height,
    num_inference_steps,
    guidance_scale,
    seed,
    strength
  } = params;

  let finalWidth = width;
  let finalHeight = height;
  const simplifiedRatio = simplifyAspectRatio(width, height);

  console.log('Building input for model:', model_id);
  console.log('Dimensions:', finalWidth, 'x', finalHeight);
  console.log('Aspect ratio:', simplifiedRatio);

  let input: any = {};

  // FLUX Schnell - Uses aspect_ratio with specific supported ratios
  if (model_id.includes('flux-schnell')) {
    const supportedRatios = ['1:1', '16:9', '21:9', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '9:16', '9:21'];

    // Find closest supported ratio
    let fluxAspectRatio = simplifiedRatio;
    if (!supportedRatios.includes(simplifiedRatio)) {
      const [w, h] = simplifiedRatio.split(':').map(Number);
      const targetRatio = w / h;

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

    // Calculate actual dimensions (Flux Schnell uses 1024px on shorter side)
    const [aspectW, aspectH] = fluxAspectRatio.split(':').map(Number);
    if (aspectW > aspectH) {
      finalHeight = 1024;
      finalWidth = Math.round((finalHeight * aspectW) / aspectH);
    } else if (aspectW < aspectH) {
      finalWidth = 1024;
      finalHeight = Math.round((finalWidth * aspectH) / aspectW);
    } else {
      finalWidth = 1024;
      finalHeight = 1024;
    }

    console.log(`Final dimensions for Flux Schnell: ${finalWidth}x${finalHeight}`);

    input = {
      prompt,
      num_inference_steps,
      guidance: guidance_scale,
      num_outputs: 1,
      aspect_ratio: fluxAspectRatio,
      output_format: 'webp',
      output_quality: 90,
    };
  }
  // FLUX Dev / FLUX Krea Dev - Supports dimensions and img2img
  else if (model_id.includes('flux-krea-dev') || model_id.includes('flux-dev')) {
    input = {
      prompt,
      num_inference_steps,
      guidance_scale,
      num_outputs: 1,
      width: finalWidth,
      height: finalHeight,
      output_format: 'webp',
      output_quality: 90,
    };

    if (sourceImageBase64 && strength !== null) {
      input.image = sourceImageBase64;
      input.prompt_strength = 1 - strength; // Flux uses inverse
      console.log('Added img2img params for Flux Dev, prompt_strength:', input.prompt_strength);
    }
  }
  // Ideogram V3 Turbo - Uses aspect_ratio
  else if (model_id.includes('ideogram-v3-turbo') || model_id.includes('ideogram')) {
    input = {
      prompt,
      aspect_ratio: simplifiedRatio,
      model: 'turbo',
      style_type: 'auto',
    };
    if (seed) input.seed = seed;
  }
  // Imagen 4 Fast - Uses aspect_ratio
  else if (model_id.includes('imagen-4-fast') || model_id.includes('imagen')) {
    input = {
      prompt,
      aspect_ratio: simplifiedRatio,
      safety_tolerance: 2,
      output_format: 'png',
    };
  }
  // SDXL Lightning - 4 steps, no guidance, supports img2img
  else if (model_id.includes('sdxl-lightning')) {
    input = {
      prompt,
      width: finalWidth,
      height: finalHeight,
      num_inference_steps: 4, // Always 4 for Lightning
      guidance_scale: 0, // No guidance for Lightning
      disable_safety_checker: false,
      output_format: 'webp',
      output_quality: 90,
    };

    if (sourceImageBase64 && strength !== null) {
      input.image = sourceImageBase64;
      input.strength = strength;
      console.log('Added img2img params for SDXL Lightning, strength:', input.strength);
    }

    if (seed) input.seed = seed;
  }
  // Regular SDXL - Full parameters, supports img2img
  else if (model_id.includes('sdxl')) {
    input = {
      prompt,
      width: finalWidth,
      height: finalHeight,
      num_inference_steps,
      guidance_scale,
      refine: 'expert_ensemble_refiner',
      high_noise_frac: 0.8,
      output_format: 'webp',
      output_quality: 90,
    };

    if (sourceImageBase64 && strength !== null) {
      input.image = sourceImageBase64;
      input.prompt_strength = strength;
      console.log('Added img2img params for SDXL, prompt_strength:', input.prompt_strength);
    }

    if (seed) input.seed = seed;
  }
  // SeeDream 4 - Uses size preset and aspect_ratio
  else if (model_id.includes('seedream-4')) {
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

    if (sourceImageBase64 && strength !== null) {
      input.image_input = [sourceImageBase64];
      console.log('Added img2img params for SeeDream 4');
    }
  }
  // SeeDream 3 - Standard dimensions
  else if (model_id.includes('seedream-3') || model_id.includes('seedream')) {
    input = {
      prompt,
      width: finalWidth,
      height: finalHeight,
      num_inference_steps,
      guidance_scale,
    };
    if (seed) input.seed = seed;
  }
  // FLUX 1.1 Pro - Uses aspect_ratio
  else if (model_id.includes('flux-1.1-pro')) {
    input = {
      prompt,
      aspect_ratio: simplifiedRatio,
      output_format: 'webp',
      output_quality: 90,
      safety_tolerance: 2,
    };
    if (seed) input.seed = seed;
  }
  // Recraft V3 SVG - Vector output
  else if (model_id.includes('recraft-v3-svg')) {
    input = {
      prompt,
      width: finalWidth,
      height: finalHeight,
      output_format: 'svg',
      style: 'vector_illustration',
    };
    if (seed) input.seed = seed;
  }
  // Recraft V3 - Uses size parameter
  else if (model_id.includes('recraft-v3') || model_id.includes('recraft')) {
    input = {
      prompt,
      size: `${finalWidth}x${finalHeight}`,
      style: 'realistic_image',
    };
  }
  // Stable Diffusion 3.5 Large
  else if (model_id.includes('stable-diffusion-3.5') || model_id.includes('sd-3-5')) {
    input = {
      prompt,
      aspect_ratio: simplifiedRatio,
      cfg: guidance_scale,
      steps: num_inference_steps,
      output_format: 'webp',
      output_quality: 90,
    };
    if (seed) input.seed = seed;
  }
  // Qwen Image - Specific parameter requirements
  else if (model_id.includes('qwen-image') || model_id.includes('qwen')) {
    input = {
      prompt,
      aspect_ratio: simplifiedRatio,
      num_inference_steps,
      guidance: guidance_scale,
      go_fast: true,
      image_size: 'optimize_for_quality',
      output_format: 'webp',
      output_quality: 90,
      enhance_prompt: false,
      disable_safety_checker: false
    };
    if (seed) input.seed = seed;
  }
  // Default/fallback for unknown models
  else {
    input = {
      prompt,
      width: finalWidth,
      height: finalHeight,
      num_inference_steps,
      guidance_scale,
    };
    if (seed) input.seed = seed;
  }

  return { input, finalWidth, finalHeight };
}

/**
 * Determine output format from model ID and output URL
 */
function determineOutputFormat(modelId: string, outputUrl: string): { format: string; contentType: string } {
  if (modelId.includes('recraft-v3-svg')) {
    return { format: 'svg', contentType: 'image/svg+xml' };
  }
  if (modelId.includes('imagen-4')) {
    return { format: 'png', contentType: 'image/png' };
  }
  if (outputUrl.includes('.png')) {
    return { format: 'png', contentType: 'image/png' };
  }
  if (outputUrl.includes('.jpg') || outputUrl.includes('.jpeg')) {
    return { format: 'jpeg', contentType: 'image/jpeg' };
  }
  // Default to webp
  return { format: 'webp', contentType: 'image/webp' };
}

/**
 * Main function: Process image generation via Replicate API
 *
 * @param params - Generation parameters
 * @param replicateApiToken - Replicate API token
 * @returns Generation result with output URL or error
 */
export async function processGeneration(
  params: GenerationParams,
  replicateApiToken: string
): Promise<GenerationResult> {
  const startTime = Date.now();

  try {
    console.log('=== PROCESS GENERATION START ===');
    console.log('Model:', params.model_id);
    console.log('Prompt:', params.prompt.substring(0, 100) + '...');

    // Handle image-to-image conversion if needed
    let sourceImageBase64: string | null = null;
    if (params.source_image_url && params.strength !== null) {
      console.log('Image-to-image mode detected');
      sourceImageBase64 = await convertImageToBase64(params.source_image_url);
    }

    // Build model-specific input
    const { input, finalWidth, finalHeight } = buildModelInput(params, sourceImageBase64);

    console.log('Replicate API input:', JSON.stringify(input, null, 2));

    // Prepare Replicate API request
    const requestBody: any = { input };

    if (params.model_version) {
      requestBody.version = params.model_version;
      console.log('Using version hash:', params.model_version);
    } else {
      requestBody.model = params.model_id;
      console.log('Using model ID (official model):', params.model_id);
    }

    // Call Replicate API to start prediction
    console.log('Calling Replicate API...');
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('Replicate API error:', errorText);
      console.error('Response status:', replicateResponse.status);
      throw new Error(`Replicate API error (${replicateResponse.status}): ${errorText}`);
    }

    const prediction = await replicateResponse.json();
    console.log('Prediction created:', prediction.id, 'Status:', prediction.status);

    // Poll for completion
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      attempts++;

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${replicateApiToken}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Failed to get prediction status');
        continue; // Retry
      }

      const result = await statusResponse.json();
      console.log(`Poll ${attempts}: ${result.status}`);

      // Success - Extract output URL
      if (result.status === 'succeeded' && result.output) {
        let outputUrl: string;

        // Different models return output in different formats
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

        console.log('Generation succeeded! Output URL:', outputUrl);

        const { format, contentType } = determineOutputFormat(params.model_id, outputUrl);
        const generationTime = Math.floor((Date.now() - startTime) / 1000);

        console.log('=== PROCESS GENERATION COMPLETE ===');
        console.log('Time taken:', generationTime, 'seconds');

        return {
          success: true,
          output_url: outputUrl,
          format,
          width: finalWidth,
          height: finalHeight,
          generation_time_seconds: generationTime
        };
      }

      // Failed or canceled
      if (result.status === 'failed' || result.status === 'canceled') {
        const errorMsg = result.error || `Generation ${result.status}`;
        console.error('Generation failed:', errorMsg);
        throw new Error(errorMsg);
      }
    }

    // Timeout after max attempts
    throw new Error('Generation timeout after 10 minutes');

  } catch (error: any) {
    console.error('Error in processGeneration:', error.message);
    console.error('Stack:', error.stack);

    return {
      success: false,
      error: error.message || 'Unknown error during generation'
    };
  }
}
