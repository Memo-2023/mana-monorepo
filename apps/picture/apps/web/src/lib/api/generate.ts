/**
 * Generate API - Now using Backend API instead of Edge Functions
 */

import { fetchApi } from './client';
import type { Image } from './images';

export interface GenerateImageParams {
	prompt: string;
	modelId: string;
	negativePrompt?: string;
	width?: number;
	height?: number;
	steps?: number;
	guidanceScale?: number;
}

export interface GenerateImageResponse {
	generationId: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface GenerationStatus {
	id: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	progress?: number;
	errorMessage?: string;
	image?: Image;
}

/**
 * Start image generation (async)
 */
export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResponse> {
	const { data, error } = await fetchApi<GenerateImageResponse>('/generate', {
		method: 'POST',
		body: params,
	});

	if (error) {
		console.error('Generate Image Error:', error);
		throw error;
	}

	if (!data) {
		throw new Error('Failed to start image generation');
	}

	return data;
}

/**
 * Check generation status
 */
export async function checkGenerationStatus(generationId: string): Promise<GenerationStatus> {
	const { data, error } = await fetchApi<GenerationStatus>(`/generate/${generationId}/status`);

	if (error) throw error;
	if (!data) throw new Error('Generation not found');
	return data;
}

/**
 * Poll for generation completion
 */
export async function waitForGeneration(
	generationId: string,
	onProgress?: (status: GenerationStatus) => void,
	pollInterval = 2000,
	maxAttempts = 60
): Promise<GenerationStatus> {
	let attempts = 0;

	while (attempts < maxAttempts) {
		const status = await checkGenerationStatus(generationId);

		if (onProgress) {
			onProgress(status);
		}

		if (status.status === 'completed' || status.status === 'failed') {
			return status;
		}

		await new Promise((resolve) => setTimeout(resolve, pollInterval));
		attempts++;
	}

	throw new Error('Generation timed out');
}

/**
 * Generate image and wait for completion
 */
export async function generateAndWait(
	params: GenerateImageParams,
	onProgress?: (status: GenerationStatus) => void
): Promise<GenerationStatus> {
	const { generationId } = await generateImage(params);

	return waitForGeneration(generationId, onProgress);
}
