import { supabase } from '$lib/supabase';

export interface GenerateImageParams {
	prompt: string;
	model_id: string;
	negative_prompt?: string;
	width?: number;
	height?: number;
	num_inference_steps?: number;
	guidance_scale?: number;
}

export interface GenerateImageResponse {
	image_id: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
}

export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResponse> {
	// Get current user
	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error('User not authenticated');
	}

	// Get model info
	const { data: model, error: modelError } = await supabase
		.from('models')
		.select('*')
		.eq('id', params.model_id)
		.single();

	if (modelError || !model) {
		throw new Error('Invalid model selected');
	}

	// Create generation record first
	const { data: generation, error: generationError } = await supabase
		.from('image_generations')
		.insert({
			user_id: user.id,
			prompt: params.prompt,
			negative_prompt: params.negative_prompt || null,
			model: model.name,
			width: params.width || model.default_width,
			height: params.height || model.default_height,
			steps: params.num_inference_steps || model.default_steps,
			guidance_scale: params.guidance_scale || model.default_guidance_scale,
			status: 'pending'
		})
		.select()
		.single();

	if (generationError) {
		throw generationError;
	}

	// Call Edge Function with generation_id
	const { data, error } = await supabase.functions.invoke('generate-image', {
		body: {
			prompt: params.prompt,
			negative_prompt: params.negative_prompt,
			model_id: model.replicate_id,
			model_version: model.version,
			width: params.width || model.default_width,
			height: params.height || model.default_height,
			num_inference_steps: params.num_inference_steps || model.default_steps,
			guidance_scale: params.guidance_scale || model.default_guidance_scale,
			generation_id: generation.id
		}
	});

	if (error) {
		// Log detailed error for debugging
		console.error('Edge Function Error:', error);
		console.error('Error details:', {
			message: error.message,
			context: error.context,
			details: error
		});

		// Update generation status to failed
		await supabase
			.from('image_generations')
			.update({
				status: 'failed',
				error_message: error.message || JSON.stringify(error),
				completed_at: new Date().toISOString()
			})
			.eq('id', generation.id);

		throw new Error(error.message || 'Edge Function failed');
	}

	return {
		image_id: generation.id,
		status: 'processing'
	};
}

export async function checkGenerationStatus(imageId: string) {
	const { data, error } = await supabase
		.from('images')
		.select('*')
		.eq('id', imageId)
		.single();

	if (error) throw error;
	return data;
}
