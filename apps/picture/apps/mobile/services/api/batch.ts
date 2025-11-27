/**
 * Batch API - Using NestJS Backend
 */

import { fetchApi } from './client';

// Request DTOs (camelCase for API)
export interface BatchPromptDto {
	text: string;
	negativePrompt?: string;
	seed?: number;
	tags?: string[];
}

export interface SharedSettingsDto {
	modelId: string;
	modelVersion: string;
	width: number;
	height: number;
	steps: number;
	guidanceScale: number;
}

export interface CreateBatchDto {
	prompts: BatchPromptDto[];
	sharedSettings: SharedSettingsDto;
	batchName?: string;
}

// Response types (camelCase from API)
export interface BatchItem {
	id: string;
	index: number;
	prompt: string;
	status: string;
	errorMessage?: string | null;
	retryCount?: number;
	imageUrl?: string | null;
}

export interface BatchGeneration {
	id: string;
	userId: string;
	name: string | null;
	totalCount: number;
	completedCount: number;
	failedCount: number;
	processingCount: number;
	pendingCount: number;
	status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
	modelId?: string | null;
	modelVersion?: string | null;
	width?: number | null;
	height?: number | null;
	steps?: number | null;
	guidanceScale?: number | null;
	createdAt: string;
	completedAt?: string | null;
	items?: BatchItem[];
}

export interface BatchProgress {
	totalCount: number;
	completedCount: number;
	failedCount: number;
	processingCount: number;
	pendingCount: number;
	status: string;
}

/**
 * Create a new batch generation
 */
export async function createBatch(dto: CreateBatchDto): Promise<BatchGeneration> {
	const { data, error } = await fetchApi<BatchGeneration>('/batch', {
		method: 'POST',
		body: dto,
	});
	if (error) throw error;
	if (!data) throw new Error('Failed to create batch');
	return data;
}

/**
 * Get all batches for the current user
 */
export async function getUserBatches(page = 1, limit = 20): Promise<BatchGeneration[]> {
	const searchParams = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});

	const { data, error } = await fetchApi<BatchGeneration[]>(`/batch?${searchParams}`);
	if (error) throw error;
	return data || [];
}

/**
 * Get a specific batch by ID with its items
 */
export async function getBatch(batchId: string): Promise<BatchGeneration> {
	const { data, error } = await fetchApi<BatchGeneration>(`/batch/${batchId}`);
	if (error) throw error;
	if (!data) throw new Error('Batch not found');
	return data;
}

/**
 * Get batch progress (for polling)
 */
export async function getBatchProgress(batchId: string): Promise<BatchProgress> {
	const { data, error } = await fetchApi<BatchProgress>(`/batch/${batchId}/progress`);
	if (error) throw error;
	if (!data) throw new Error('Failed to get batch progress');
	return data;
}

/**
 * Retry failed generations in a batch
 */
export async function retryFailed(batchId: string): Promise<{ affected: number }> {
	const { data, error } = await fetchApi<{ affected: number }>(`/batch/${batchId}/retry`, {
		method: 'POST',
	});
	if (error) throw error;
	return data || { affected: 0 };
}

/**
 * Cancel a batch
 */
export async function cancelBatch(batchId: string): Promise<void> {
	const { error } = await fetchApi(`/batch/${batchId}/cancel`, {
		method: 'POST',
	});
	if (error) throw error;
}

/**
 * Delete a batch and all its generations
 */
export async function deleteBatch(batchId: string): Promise<void> {
	const { error } = await fetchApi(`/batch/${batchId}`, {
		method: 'DELETE',
	});
	if (error) throw error;
}
