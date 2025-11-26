# Advanced Generation Settings

## Overview

The QuickGenerateBar now includes advanced settings that allow users to customize image generation parameters beyond just the prompt and model selection. These settings are accessible via a settings icon (⚙️) in the generation bar.

## Features

### 1. Image Count (Batch Generation)
- Generate 1-5 images at once with a single prompt
- Each image uses a different random seed for variety
- Progress indicator shows "Generiere Bild X/Y..." during batch generation
- Success toast shows total count: "X Bilder erfolgreich generiert!"

**Default**: 1 image

### 2. Aspect Ratio Selector
Choose from three preset aspect ratios:
- **Quadratisch** (Square): 1024×1024px
- **Hochformat** (Portrait): 832×1216px
- **Querformat** (Landscape): 1216×832px

Visual preview boxes show the relative dimensions.

**Default**: Square (1024×1024)

### 3. Steps Slider
Control the number of diffusion steps (quality vs. speed):
- **Range**: 20-150 steps (increments of 5)
- Lower values = faster generation, potentially lower quality
- Higher values = slower generation, higher quality/detail
- Visual labels: "Schnell" (20) → "Höchste Qualität" (150)

**Default**: 50 steps

### 4. Guidance Scale Slider
Control how closely the AI follows the prompt:
- **Range**: 1-20 (increments of 0.5)
- Lower values = more creative/artistic interpretation
- Higher values = stricter adherence to prompt
- Visual labels: "Kreativ" (1) → "Präzise" (20)
- Helper text: "Höhere Werte folgen dem Prompt genauer, niedrigere sind kreativer"

**Default**: 7.5

## UI/UX Details

### Settings Button
- **Location**: Between prompt input and Generate button
- **Icon**: Gear/settings icon (⚙️)
- **Badge**: Blue pulsing dot appears when any setting differs from defaults
- **State**: Disabled during generation

### Modal Layout
- **Style**: Glass-blur modal (white/95 with backdrop-blur-xl)
- **Size**: max-w-2xl centered
- **Close**: ESC key or close button (×)
- **Actions**: Cancel (gray) or Übernehmen (blue)

### Visual Feedback
The settings button shows a blue pulsing badge when:
- Image count > 1
- Aspect ratio ≠ Square
- Steps ≠ 50
- Guidance scale ≠ 7.5

## Implementation Details

### Files Modified

1. **`lib/components/generate/AdvancedSettingsModal.svelte`** (NEW)
   - Self-contained modal component
   - Local state management with $effect() for props sync
   - Exports `AdvancedSettings` and `AspectRatio` types

2. **`lib/components/gallery/QuickGenerateBar.svelte`**
   - Added `showAdvancedSettings` state
   - Added `advancedSettings` state with defaults
   - Added `hasCustomSettings` derived state for badge
   - Updated `handleQuickGenerate()` to:
     - Loop through imageCount
     - Pass width, height, steps, guidance_scale to API
     - Show progress per image
   - Added settings button with badge indicator
   - Integrated AdvancedSettingsModal component

3. **`lib/api/generate.ts`**
   - Extended `GenerateImageParams` interface:
     ```typescript
     export interface GenerateImageParams {
       prompt: string;
       model_id: string;
       negative_prompt?: string;
       width?: number;           // NEW
       height?: number;          // NEW
       steps?: number;           // NEW
       guidance_scale?: number;  // NEW
     }
     ```

### API Integration

The advanced settings are passed directly to the edge function:

```typescript
const result = await generateImage({
  prompt: prompt.trim(),
  model_id: selectedModelId,
  width: advancedSettings.aspectRatio.width,
  height: advancedSettings.aspectRatio.height,
  steps: advancedSettings.steps,
  guidance_scale: advancedSettings.guidanceScale
});
```

**Note**: The edge function (`supabase/functions/generate-image/index.ts`) must handle these parameters and pass them to the image generation API (Replicate, Stability AI, etc.).

### Batch Generation Flow

When `imageCount > 1`:
1. Loop from 0 to imageCount
2. For each iteration:
   - Update progress: `Generiere Bild ${i + 1}/${totalImages}...`
   - Call `generateImage()` with same params
   - Poll for completion: `Verarbeite Bild ${i + 1}/${totalImages}...`
   - Increment completedImages counter
3. Show success toast with total count
4. Trigger `onGenerated()` callback to refresh gallery

## Future Enhancements

Potential additions inspired by mobile app:
- [ ] Tag input for organizing generated images
- [ ] Negative prompt field
- [ ] Seed input for reproducible generations
- [ ] Style presets (e.g., "Photorealistic", "Artistic", "Anime")
- [ ] Rate limit indicator
- [ ] Batch progress tracker with individual image status
- [ ] Save/load preset configurations
- [ ] Advanced toggle (show/hide extra options)

## Testing

### Manual Test Cases

1. **Default Generation**
   - Open generate bar
   - Enter prompt
   - Click Generate
   - Verify: 1 square image at default quality

2. **Custom Aspect Ratio**
   - Click settings icon
   - Select Portrait
   - Click Übernehmen
   - Verify: Badge appears on settings button
   - Generate image
   - Verify: Image is 832×1216

3. **Batch Generation**
   - Open settings
   - Select 3 images
   - Click Übernehmen
   - Generate
   - Verify: Progress shows "Bild 1/3", "Bild 2/3", "Bild 3/3"
   - Verify: Toast shows "3 Bilder erfolgreich generiert!"
   - Verify: 3 images appear in gallery

4. **Settings Persistence**
   - Set custom values in modal
   - Close modal
   - Re-open modal
   - Verify: Values are still set

5. **Settings Reset**
   - Set custom values
   - Generate image
   - Verify: Badge still shows on settings button
   - Open modal
   - Change all back to defaults
   - Verify: Badge disappears

6. **Keyboard Navigation**
   - Open modal with click
   - Press ESC
   - Verify: Modal closes

## Design Inspiration

Based on mobile app's `QuickGenerateBar.tsx` which includes:
- ImageCountSelector with pill/counter/compact styles
- AspectRatioSelector with visual previews
- Slider controls for steps and guidance
- Tag input for organization
- Rate limiting display
- Batch progress tracking

The web implementation follows similar patterns while adapting to:
- Desktop-first layout with responsive mobile view
- Glass-blur aesthetic matching existing UI
- Svelte 5 runes instead of React hooks
- Simpler initial feature set (can expand later)
