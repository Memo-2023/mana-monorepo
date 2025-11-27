/**
 * Job Queue Helper Functions
 *
 * Provides client-side utilities for interacting with the async job queue system.
 * Uses Supabase database functions to enqueue jobs and monitor status.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type JobType = 'generate-image' | 'download-image' | 'process-webhook' | 'cleanup-storage';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface JobQueueRow {
	id: string;
	job_type: JobType;
	payload: Record<string, any>;
	status: JobStatus;
	attempts: number;
	max_attempts: number;
	scheduled_at: string;
	started_at: string | null;
	completed_at: string | null;
	error_message: string | null;
	error_details: Record<string, any> | null;
	created_by: string | null;
	priority: number;
	created_at: string;
	updated_at: string;
}

export interface EnqueueJobParams {
	jobType: JobType;
	payload: Record<string, any>;
	priority?: number;
	scheduledAt?: Date;
	maxAttempts?: number;
}

export interface JobStats {
	total: number;
	pending: number;
	processing: number;
	completed: number;
	failed: number;
	avgDurationSeconds: number;
}

// ============================================================================
// QUEUE FUNCTIONS
// ============================================================================

/**
 * Enqueue a new job for background processing
 *
 * @example
 * ```typescript
 * const jobId = await enqueueJob(supabase, {
 *   jobType: 'generate-image',
 *   payload: { prompt: 'A beautiful sunset', model_id: 'flux-dev' },
 *   priority: 10
 * });
 * ```
 */
export async function enqueueJob(
	supabase: SupabaseClient<Database>,
	params: EnqueueJobParams
): Promise<string> {
	const { jobType, payload, priority = 0, scheduledAt = new Date(), maxAttempts = 3 } = params;

	const { data, error } = await supabase.rpc('enqueue_job', {
		p_job_type: jobType,
		p_payload: payload as any,
		p_priority: priority,
		p_scheduled_at: scheduledAt.toISOString(),
		p_max_attempts: maxAttempts,
	});

	if (error) {
		console.error('Failed to enqueue job:', error);
		throw new Error(`Failed to enqueue job: ${error.message}`);
	}

	return data as string;
}

/**
 * Get job by ID
 */
export async function getJob(
	supabase: SupabaseClient<Database>,
	jobId: string
): Promise<JobQueueRow | null> {
	const { data, error } = await supabase.from('job_queue').select('*').eq('id', jobId).single();

	if (error) {
		if (error.code === 'PGRST116') {
			return null; // Not found
		}
		throw error;
	}

	return data as JobQueueRow;
}

/**
 * Get all jobs for current user
 */
export async function getUserJobs(
	supabase: SupabaseClient<Database>,
	options?: {
		status?: JobStatus;
		limit?: number;
		offset?: number;
	}
): Promise<JobQueueRow[]> {
	let query = supabase.from('job_queue').select('*').order('created_at', { ascending: false });

	if (options?.status) {
		query = query.eq('status', options.status);
	}

	if (options?.limit) {
		query = query.limit(options.limit);
	}

	if (options?.offset) {
		query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return (data || []) as JobQueueRow[];
}

/**
 * Cancel a pending job
 */
export async function cancelJob(supabase: SupabaseClient<Database>, jobId: string): Promise<void> {
	const { error } = await supabase
		.from('job_queue')
		.update({ status: 'cancelled', updated_at: new Date().toISOString() })
		.eq('id', jobId)
		.eq('status', 'pending'); // Only cancel pending jobs

	if (error) {
		throw new Error(`Failed to cancel job: ${error.message}`);
	}
}

/**
 * Get queue health statistics
 */
export async function getQueueStats(
	supabase: SupabaseClient<Database>,
	jobType?: JobType
): Promise<JobStats> {
	const { data, error } = await supabase.from('queue_health').select('*');

	if (error) {
		throw error;
	}

	// Aggregate stats
	let stats: JobStats = {
		total: 0,
		pending: 0,
		processing: 0,
		completed: 0,
		failed: 0,
		avgDurationSeconds: 0,
	};

	const filtered = jobType ? data?.filter((row) => row.job_type === jobType) : data;

	filtered?.forEach((row) => {
		const count = row.count || 0;
		stats.total += count;

		switch (row.status) {
			case 'pending':
				stats.pending += count;
				break;
			case 'processing':
				stats.processing += count;
				break;
			case 'completed':
				stats.completed += count;
				break;
			case 'failed':
				stats.failed += count;
				break;
		}

		if (row.avg_duration_seconds) {
			stats.avgDurationSeconds = row.avg_duration_seconds;
		}
	});

	return stats;
}

/**
 * Get failed jobs (last 24 hours)
 */
export async function getRecentFailedJobs(
	supabase: SupabaseClient<Database>
): Promise<JobQueueRow[]> {
	const { data, error } = await supabase.from('failed_jobs_recent').select('*');

	if (error) {
		throw error;
	}

	return (data || []) as JobQueueRow[];
}

// ============================================================================
// REALTIME SUBSCRIPTION HELPERS
// ============================================================================

export type JobUpdateCallback = (job: JobQueueRow) => void;

/**
 * Subscribe to job updates via Realtime
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToJob(supabase, jobId, (job) => {
 *   console.log('Job updated:', job.status);
 *   if (job.status === 'completed') {
 *     unsubscribe();
 *   }
 * });
 * ```
 */
export function subscribeToJob(
	supabase: SupabaseClient<Database>,
	jobId: string,
	callback: JobUpdateCallback
): () => void {
	const channel = supabase
		.channel(`job:${jobId}`)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'job_queue',
				filter: `id=eq.${jobId}`,
			},
			(payload) => {
				callback(payload.new as JobQueueRow);
			}
		)
		.subscribe();

	return () => {
		channel.unsubscribe();
	};
}

/**
 * Subscribe to all job updates for current user
 */
export function subscribeToUserJobs(
	supabase: SupabaseClient<Database>,
	userId: string,
	callback: JobUpdateCallback
): () => void {
	const channel = supabase
		.channel(`user-jobs:${userId}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'job_queue',
				filter: `created_by=eq.${userId}`,
			},
			(payload) => {
				if (payload.new) {
					callback(payload.new as JobQueueRow);
				}
			}
		)
		.subscribe();

	return () => {
		channel.unsubscribe();
	};
}

// ============================================================================
// IMAGE GENERATION HELPERS (Convenience wrappers)
// ============================================================================

export interface GenerateImageJobParams {
	prompt: string;
	model_id: string;
	model_version?: string;
	width?: number;
	height?: number;
	num_inference_steps?: number;
	guidance_scale?: number;
	seed?: number;
	negative_prompt?: string;
	source_image_url?: string;
	strength?: number;
	style?: string;
}

/**
 * Start an image generation job (high-level wrapper)
 *
 * @example
 * ```typescript
 * const { generationId, jobId } = await startImageGeneration(supabase, {
 *   prompt: 'A beautiful sunset over mountains',
 *   model_id: 'black-forest-labs/flux-dev'
 * });
 *
 * // Subscribe to updates
 * subscribeToGeneration(supabase, generationId, (generation) => {
 *   console.log('Status:', generation.status);
 * });
 * ```
 */
export async function startImageGeneration(
	supabase: SupabaseClient<Database>,
	params: GenerateImageJobParams
): Promise<{ generationId: string; jobId: string }> {
	// Call start-generation Edge Function
	const { data, error } = await supabase.functions.invoke('start-generation', {
		body: params,
	});

	if (error) {
		throw new Error(`Failed to start generation: ${error.message}`);
	}

	if (!data.success) {
		throw new Error(data.error || 'Failed to start generation');
	}

	return {
		generationId: data.generation_id,
		jobId: data.job_id,
	};
}

/**
 * Subscribe to generation updates via Realtime
 */
export function subscribeToGeneration(
	supabase: SupabaseClient<Database>,
	generationId: string,
	callback: (generation: any) => void
): () => void {
	const channel = supabase
		.channel(`generation:${generationId}`)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'image_generations',
				filter: `id=eq.${generationId}`,
			},
			(payload) => {
				callback(payload.new);
			}
		)
		.subscribe();

	return () => {
		channel.unsubscribe();
	};
}

/**
 * Combined helper: Start generation and subscribe to updates
 *
 * @example
 * ```typescript
 * const { generationId, unsubscribe } = await generateImageWithUpdates(
 *   supabase,
 *   { prompt: 'A sunset', model_id: 'flux-dev' },
 *   (generation) => {
 *     console.log('Status:', generation.status);
 *     if (generation.status === 'completed') {
 *       console.log('Image ready!', generation.id);
 *       unsubscribe();
 *     }
 *   }
 * );
 * ```
 */
export async function generateImageWithUpdates(
	supabase: SupabaseClient<Database>,
	params: GenerateImageJobParams,
	onUpdate: (generation: any) => void
): Promise<{ generationId: string; jobId: string; unsubscribe: () => void }> {
	// Start generation
	const { generationId, jobId } = await startImageGeneration(supabase, params);

	// Subscribe to updates
	const unsubscribe = subscribeToGeneration(supabase, generationId, onUpdate);

	return { generationId, jobId, unsubscribe };
}

// ============================================================================
// POLLING HELPERS (fallback if Realtime not available)
// ============================================================================

/**
 * Poll for job status (fallback for environments without Realtime)
 */
export async function pollJobUntilComplete(
	supabase: SupabaseClient<Database>,
	jobId: string,
	options: {
		maxAttempts?: number;
		intervalMs?: number;
		onUpdate?: JobUpdateCallback;
	} = {}
): Promise<JobQueueRow> {
	const { maxAttempts = 60, intervalMs = 2000, onUpdate } = options;

	let attempts = 0;

	while (attempts < maxAttempts) {
		const job = await getJob(supabase, jobId);

		if (!job) {
			throw new Error('Job not found');
		}

		if (onUpdate) {
			onUpdate(job);
		}

		if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
			return job;
		}

		await new Promise((resolve) => setTimeout(resolve, intervalMs));
		attempts++;
	}

	throw new Error('Job polling timeout');
}

/**
 * Poll for generation completion
 */
export async function pollGenerationUntilComplete(
	supabase: SupabaseClient<Database>,
	generationId: string,
	options: {
		maxAttempts?: number;
		intervalMs?: number;
		onUpdate?: (generation: any) => void;
	} = {}
): Promise<any> {
	const { maxAttempts = 120, intervalMs = 2000, onUpdate } = options;

	let attempts = 0;

	while (attempts < maxAttempts) {
		const { data: generation, error } = await supabase
			.from('image_generations')
			.select('*')
			.eq('id', generationId)
			.single();

		if (error) {
			throw error;
		}

		if (onUpdate) {
			onUpdate(generation);
		}

		if (generation.status === 'completed' || generation.status === 'failed') {
			return generation;
		}

		await new Promise((resolve) => setTimeout(resolve, intervalMs));
		attempts++;
	}

	throw new Error('Generation polling timeout');
}
