# Image Generation Models

This directory contains documentation for all supported image generation models in the Picture app.

## Available Models

### 1. [Ideogram V3 Turbo](./ideogram-v3-turbo.md)
- **Best for**: Text rendering, logos, marketing materials
- **Speed**: Fast (10s)
- **Cost**: $0.02
- **Special**: Excellent text generation capabilities

### 2. [Google Imagen 4 Fast](./imagen-4-fast.md)
- **Best for**: Photorealistic images, portraits, product shots
- **Speed**: Very Fast (8s)
- **Cost**: $0.03
- **Special**: Superior photorealism and coherence

### 3. [ByteDance SeeDream 3](./seedream-3.md)
- **Best for**: Creative artwork, style mixing, illustrations
- **Speed**: Moderate (12s)
- **Cost**: $0.025
- **Special**: Excellent artistic versatility

### 4. [FLUX Schnell](./flux-schnell.md)
- **Best for**: Rapid prototyping, quick iterations
- **Speed**: Ultra-fast (4s)
- **Cost**: $0.01
- **Special**: Fastest generation time

### 5. [FLUX Krea Dev](./flux-krea-dev.md)
- **Best for**: Creative development, concept art
- **Speed**: Moderate (15s)
- **Cost**: $0.04
- **Special**: Enhanced for creative workflows

### 6. [Recraft V3 SVG](./recraft-v3-svg.md)
- **Best for**: Vector graphics, logos, icons
- **Speed**: Moderate (20s)
- **Cost**: $0.05
- **Special**: Generates scalable SVG files

### 7. [Qwen Image](./qwen-image.md)
- **Best for**: Multilingual content, Asian markets
- **Speed**: Fast (10s)
- **Cost**: $0.03
- **Special**: Excellent multilingual support

## Quick Comparison

| Model | Speed | Quality | Text | Realism | Art | Aspect Ratios | Cost |
|-------|-------|---------|------|---------|-----|---------------|------|
| Ideogram V3 Turbo | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 15 ratios | $0.02 |
| Imagen 4 Fast | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 5 ratios | $0.03 |
| SeeDream 3 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 9 ratios + custom | $0.025 |
| FLUX Schnell | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 11 ratios | $0.01 |
| FLUX Krea Dev | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 11 ratios | $0.04 |
| Recraft V3 SVG | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | N/A | ⭐⭐⭐⭐ | 16 ratios | $0.05 |
| Qwen Image | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 7 ratios | $0.03 |

## Choosing the Right Model

### For Text in Images
Choose **Ideogram V3 Turbo** - It has the best text rendering capabilities

### For Photorealism
Choose **Google Imagen 4 Fast** - Best for realistic photographs

### For Speed
Choose **FLUX Schnell** - Ultra-fast 4-second generation

### For Artistic Work
Choose **SeeDream 3** - Most versatile for creative styles

### For Logos/Icons
Choose **Recraft V3 SVG** - Only model that generates scalable vectors

### For Multilingual
Choose **Qwen Image** - Best for non-English prompts

### For Budget
Choose **FLUX Schnell** - Most cost-effective at $0.01

## API Integration

All models are integrated through the Replicate API and can be selected via the model picker in the app. Each model has been configured with optimal default parameters while allowing customization of:

- Resolution (width/height)
- Number of inference steps
- Guidance scale
- Negative prompts (where supported)
- Random seed for reproducibility

## Model Updates

Models are regularly updated by their providers. Version numbers are tracked in the database to ensure consistency. Check individual model documentation for specific capabilities and limitations.