import { PipelineStep } from '../../core/pipeline.types';
import { CharacterPromptOutput, CharacterImageOutput } from '../types/character-pipeline.types';

// This is a mock implementation - replace with actual Replicate/image service
async function callReplicateAPI(prompt: string, negativePrompt: string): Promise<string> {
	// Simulating API call
	await new Promise((resolve) => setTimeout(resolve, 2000));

	// In real implementation, this would call:
	// const result = await replicate.run("stability-ai/sdxl:...", {
	//   input: { prompt, negative_prompt: negativePrompt }
	// });

	return `https://replicate.delivery/pbxt/mock-image-${Date.now()}.png`;
}

async function uploadToSupabase(imageUrl: string): Promise<{ url: string; id: string }> {
	// In real implementation, this would:
	// 1. Download image from Replicate
	// 2. Upload to Supabase storage
	// 3. Return public URL

	return {
		url: imageUrl,
		id: `img_${Date.now()}`,
	};
}

export const generateImageStep: PipelineStep<CharacterPromptOutput, CharacterImageOutput> = {
	name: 'generate-image',
	category: 'character',
	description: 'Generates character image using AI image generation service',
	timeout: 30000, // 30 second timeout
	retryable: true,
	maxRetries: 3,

	execute: async (input, context) => {
		try {
			// Log the prompt being used
			console.log('[Character Image Generation] Using prompt:', input.imageGenerationPrompt);

			// Generate image using Replicate
			const imageUrl = await callReplicateAPI(input.imageGenerationPrompt, input.negativePrompt);

			// Upload to Supabase storage
			const uploaded = await uploadToSupabase(imageUrl);

			return {
				...input,
				imageUrl: uploaded.url,
				imageId: uploaded.id,
				imageDimensions: {
					width: 1024,
					height: 1024,
				},
			};
		} catch (error) {
			console.error('[Character Image Generation] Failed:', error);
			throw new Error(`Image generation failed: ${(error as Error).message}`);
		}
	},

	rollback: async (input, error, context) => {
		// If image was uploaded, delete it from storage
		if ('imageId' in input && input.imageId) {
			console.log(`[Rollback] generate-image: Deleting image ${input.imageId}`);
			// await supabase.storage.from('characters').remove([input.imageId]);
		}
	},
};
