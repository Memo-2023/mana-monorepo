# ByteDance SeeDream 4

## Overview
SeeDream 4 is ByteDance's latest generation image model featuring unified text-to-image generation and precise single-sentence editing capabilities. It offers significant improvements over SeeDream 3 with higher resolution support and more flexible workflows.

## Model Details
- **Provider**: ByteDance
- **Replicate ID**: `bytedance/seedream-4`
- **Version**: `054cd8c667f535616fd66710ce20c8949bf64ac3d9a3459e338f026424be8bec`

## Key Features
- **Unified Architecture**: Single model for both generation and editing
- **Ultra High Resolution**: Up to 4K (4096x4096) output
- **Multi-Reference Support**: Use up to 10 reference images
- **Batch Generation**: Generate up to 15 images in one request
- **Precise Editing**: Natural language prompt-based editing
- **Consistent Characters**: Maintains character consistency across multiple outputs

## Default Parameters
- **Resolution**: 2048x2048 (2K preset)
- **Steps**: 50 (automatic based on size preset)
- **Guidance Scale**: 7.5 (automatic)
- **Supports Negative Prompts**: No
- **Supports Seed**: No
- **Supports Image-to-Image**: Yes (via image_input array)

## Supported Aspect Ratios
**8 fixed ratios**:
- **Square**: 1:1
- **Landscape**: 4:3, 16:9, 3:2, 21:9
- **Portrait**: 3:4, 9:16, 2:3

Additionally supports "match_input_image" when using reference images.

## Size Presets
- **1K**: Best for quick previews (1024-2047px)
- **2K**: Balanced quality and speed (2048-3071px) - Default
- **4K**: Maximum quality (4096px)
- **Custom**: Specify exact width/height (1024-4096px range)

## Best Use Cases
- Character consistency across multiple scenes
- High-resolution commercial imagery
- Image editing with natural language prompts
- Multi-view generation from single prompt
- Reference-based generation
- Batch creation of variations

## Example Prompts
1. "A professional portrait of a woman in business attire, modern office background, natural lighting"
2. "A selection of photos of this character [reference] exploring a bookshop called 'SeeDream 4'"
3. "Multiple views of a futuristic car design, different angles and lighting"

## Tips for Best Results
- Use the 2K preset for optimal balance of quality and speed
- Leverage multi-reference input for character consistency
- Use natural language for precise editing instructions
- Request multiple outputs for variations in one go
- Specify detailed scene descriptions for better results
- For ultra-high quality, use 4K preset

## Strengths
- Exceptional high-resolution output (up to 4K)
- Unified generation and editing workflow
- Excellent character consistency
- Multi-reference and batch capabilities
- Fast inference compared to quality level
- Natural language editing

## Limitations
- No manual seed control
- No negative prompt support
- Fixed aspect ratios only (no completely custom ratios)
- Slightly higher cost than SeeDream 3 ($0.03 vs $0.025)

## Cost
$0.03 per generation (regardless of resolution)

## Migration from SeeDream 3
If you're upgrading from SeeDream 3:
- Resolution limits increased: 2048x2048 → 4096x4096
- New parameter structure (size presets instead of raw dimensions)
- Removed: seed support, negative prompts
- Added: image_input array, multi-image generation, higher resolutions
- Slightly higher cost but significantly more features
