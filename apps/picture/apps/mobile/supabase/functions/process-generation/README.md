# Process Generation Edge Function

## Overview

This Edge Function contains the core Replicate API integration logic extracted from the original 667-line `generate-image` function. It can be imported as a module or called standalone for testing.

## Purpose

- Handle actual Replicate API interaction for image generation
- Support 15+ different AI models with model-specific parameter handling
- Calculate aspect ratios and dimensions for each model
- Handle image-to-image (img2img) conversion
- Poll Replicate API until generation completes
- Return result URL when ready

## Supported Models

### FLUX Models
- **FLUX Schnell**: Fast generation with aspect ratio constraints
- **FLUX Dev**: Full control with img2img support
- **FLUX Krea Dev**: Enhanced version with img2img
- **FLUX 1.1 Pro**: Latest version with aspect ratio

### SDXL Models
- **SDXL**: Full parameters with refiner and img2img
- **SDXL Lightning**: Ultra-fast 4-step generation with img2img

### Other Models
- **Ideogram V3 Turbo**: Aspect ratio based
- **Imagen 4 Fast**: Google's model with aspect ratio
- **Stable Diffusion 3.5**: Latest SD with aspect ratio
- **SeeDream 3/4**: Advanced models with preset sizes
- **Recraft V3**: Both raster and SVG output
- **Qwen Image**: Specialized parameters

## Usage

### As a Module (Recommended)

```typescript
import { processGeneration } from '../process-generation/index.ts';

const result = await processGeneration(
  {
    prompt: "A beautiful sunset over mountains",
    model_id: "black-forest-labs/flux-schnell",
    width: 1024,
    height: 1024,
    num_inference_steps: 30,
    guidance_scale: 7.5,
  },
  replicateApiToken
);

if (result.success) {
  console.log('Output URL:', result.output_url);
  console.log('Format:', result.format);
} else {
  console.error('Error:', result.error);
}
```

### As Standalone Function (Testing)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-generation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset",
    "model_id": "black-forest-labs/flux-schnell",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 30,
    "guidance_scale": 7.5
  }'
```

## Parameters

### Required
- `prompt`: Text description of desired image
- `model_id`: Replicate model ID (e.g., "black-forest-labs/flux-schnell")
- `width`: Image width in pixels
- `height`: Image height in pixels
- `num_inference_steps`: Number of denoising steps
- `guidance_scale`: How closely to follow prompt

### Optional
- `negative_prompt`: What to avoid in image
- `model_version`: Specific model version hash
- `seed`: Random seed for reproducibility
- `source_image_url`: Source image for img2img
- `strength`: Transformation strength (0-1) for img2img

## Return Value

```typescript
interface GenerationResult {
  success: boolean;
  output_url?: string;           // URL to generated image
  format?: string;                // Image format (webp, png, jpeg, svg)
  width?: number;                 // Final image width
  height?: number;                // Final image height
  error?: string;                 // Error message if failed
  generation_time_seconds?: number; // Time taken
}
```

## Model-Specific Logic

### Aspect Ratio Handling
- **FLUX Schnell**: Only supports specific ratios (1:1, 16:9, etc.)
  - Automatically maps requested ratio to closest supported
  - Adjusts dimensions to maintain ratio
- **Ideogram/Imagen**: Use simplified aspect ratio string
- **SDXL/Others**: Use exact width/height

### Image-to-Image Support
Models with img2img:
- FLUX Dev/Krea Dev
- SDXL and SDXL Lightning
- SeeDream 4

The function automatically:
1. Downloads source image
2. Converts to base64 data URI
3. Adds appropriate parameters for each model

### Output Formats
- **Default**: WebP for efficiency
- **Imagen 4**: PNG
- **Recraft SVG**: Vector SVG format
- **Auto-detected**: From URL extension

## Architecture

### Main Function
`processGeneration(params, apiToken)` - Main entry point

### Helper Functions
- `simplifyAspectRatio()` - Calculate simplified ratio (e.g., 16:9)
- `convertImageToBase64()` - Convert URL to data URI for img2img
- `buildModelInput()` - Create model-specific input parameters
- `determineOutputFormat()` - Detect output format from URL/model

## Error Handling

- Validates required parameters
- Handles API errors with detailed messages
- Retries polling on transient failures
- Timeout after 10 minutes (120 polls × 2 seconds)
- Returns structured error in result object

## Environment Variables

Required:
- `REPLICATE_API_TOKEN` or `REPLICATE_API_KEY`: Replicate API token

## Development

### Local Testing

```bash
# Serve locally
npx supabase functions serve process-generation

# Test with curl
curl -X POST http://localhost:54321/functions/v1/process-generation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"prompt":"test","model_id":"black-forest-labs/flux-schnell",...}'
```

### Deploy

```bash
npx supabase functions deploy process-generation
```

## Integration with Job Queue

This function is called by `process-jobs` worker for 'generate-image' jobs:

```typescript
const result = await processGeneration(job.payload, apiToken);
if (result.success) {
  // Enqueue download-image job
  await enqueueJob('download-image', {
    output_url: result.output_url,
    ...
  });
}
```

## Performance Notes

- Polls every 2 seconds (not resource-intensive)
- Max 10 minute timeout per generation
- Supports concurrent generations when imported
- Image-to-image conversion happens once, then cached in memory

## Future Enhancements

- [ ] Add caching for model configurations
- [ ] Support batch generation (multiple images)
- [ ] Add progress callbacks for long generations
- [ ] Implement retry logic with exponential backoff
- [ ] Add telemetry/metrics collection
