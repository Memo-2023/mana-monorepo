/**
 * Async Image Generation Service for Mobile App
 *
 * This service provides React hooks for async image generation using the NestJS backend.
 * It handles:
 * - Starting image generation via Backend API
 * - Polling for status updates
 * - Managing loading states and progress
 * - Error handling
 *
 * Usage:
 * ```tsx
 * const { status, progress, imageUrl, error, generate } = useImageGeneration();
 *
 * await generate({
 *   prompt: 'A beautiful sunset',
 *   modelId: 'uuid-of-model'
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
	generateImage,
	checkGenerationStatus,
	cancelGeneration,
	type GenerateImageParams,
	type GenerationStatus,
} from './api';
import { logger } from '~/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type GenerationStatusType =
	| 'idle'
	| 'pending'
	| 'queued'
	| 'processing'
	| 'completed'
	| 'failed'
	| 'cancelled';

export interface GenerationResult {
	generationId: string;
	imageUrl: string | null;
	status: GenerationStatusType;
}

export interface GenerationState {
	status: GenerationStatusType;
	progress: number; // 0-100
	imageUrl: string | null;
	error: string | null;
	generationId: string | null;
}

// ============================================================================
// HOOK: useImageGeneration
// ============================================================================

/**
 * React hook for async image generation with polling updates
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { status, progress, imageUrl, error, generate, reset } = useImageGeneration();
 *
 *   const handleGenerate = async () => {
 *     try {
 *       await generate({
 *         prompt: 'A beautiful sunset over mountains',
 *         modelId: 'your-model-uuid',
 *         width: 1024,
 *         height: 1024
 *       });
 *     } catch (err) {
 *       console.error('Generation failed:', err);
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       {status === 'idle' && (
 *         <Button onPress={handleGenerate}>Generate</Button>
 *       )}
 *       {status !== 'idle' && status !== 'completed' && (
 *         <View>
 *           <Text>Status: {status}</Text>
 *           <Text>Progress: {progress}%</Text>
 *         </View>
 *       )}
 *       {status === 'completed' && imageUrl && (
 *         <Image source={{ uri: imageUrl }} />
 *       )}
 *       {error && <Text>Error: {error}</Text>}
 *     </View>
 *   );
 * }
 * ```
 */
export function useImageGeneration() {
	const [state, setState] = useState<GenerationState>({
		status: 'idle',
		progress: 0,
		imageUrl: null,
		error: null,
		generationId: null,
	});

	const pollingRef = useRef<NodeJS.Timeout | null>(null);
	const mountedRef = useRef(true);

	// Cleanup on unmount
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			if (pollingRef.current) {
				clearInterval(pollingRef.current);
				pollingRef.current = null;
			}
		};
	}, []);

	/**
	 * Calculate progress based on status
	 */
	const calculateProgress = (status: GenerationStatusType): number => {
		switch (status) {
			case 'idle':
				return 0;
			case 'pending':
				return 5;
			case 'queued':
				return 10;
			case 'processing':
				return 50;
			case 'completed':
				return 100;
			case 'failed':
			case 'cancelled':
				return 0;
			default:
				return 0;
		}
	};

	/**
	 * Poll for generation status
	 */
	const startPolling = useCallback((generationId: string) => {
		if (pollingRef.current) {
			clearInterval(pollingRef.current);
		}

		pollingRef.current = setInterval(async () => {
			if (!mountedRef.current) {
				if (pollingRef.current) {
					clearInterval(pollingRef.current);
					pollingRef.current = null;
				}
				return;
			}

			try {
				const status = await checkGenerationStatus(generationId);
				logger.debug('Generation status update:', status);

				const statusType = status.status as GenerationStatusType;
				const progress = calculateProgress(statusType);

				setState((prev) => ({
					...prev,
					status: statusType,
					progress,
					error: status.errorMessage || null,
					imageUrl: status.image?.publicUrl || null,
				}));

				// Stop polling when done
				if (statusType === 'completed' || statusType === 'failed' || statusType === 'cancelled') {
					if (pollingRef.current) {
						clearInterval(pollingRef.current);
						pollingRef.current = null;
					}
				}
			} catch (error: any) {
				logger.error('Error polling generation status:', error);
			}
		}, 2000);
	}, []);

	/**
	 * Start image generation
	 */
	const generate = useCallback(
		async (params: Omit<GenerateImageParams, 'waitForResult'>) => {
			try {
				logger.info('Starting image generation...');
				logger.debug('Parameters:', params);

				// Reset state
				setState({
					status: 'pending',
					progress: 5,
					imageUrl: null,
					error: null,
					generationId: null,
				});

				// Start generation via Backend API
				// Use async mode (waitForResult: false) for mobile to show progress
				const response = await generateImage({ ...params, waitForResult: false });

				logger.info('Generation started:', { generationId: response.generationId });

				// Update state with generation ID
				setState((prev) => ({
					...prev,
					generationId: response.generationId,
					status: response.status as GenerationStatusType,
					progress: calculateProgress(response.status as GenerationStatusType),
				}));

				// If already completed (sync mode), we're done
				if (response.status === 'completed' && response.image) {
					setState((prev) => ({
						...prev,
						status: 'completed',
						progress: 100,
						imageUrl: response.image?.publicUrl || null,
					}));
					return;
				}

				// Start polling for status updates
				startPolling(response.generationId);
			} catch (error: any) {
				logger.error('Generation error:', error);
				setState((prev) => ({
					...prev,
					status: 'failed',
					error: error.message || 'Failed to start generation',
					progress: 0,
				}));
				throw error;
			}
		},
		[startPolling]
	);

	/**
	 * Reset state to idle
	 */
	const reset = useCallback(() => {
		// Stop polling
		if (pollingRef.current) {
			clearInterval(pollingRef.current);
			pollingRef.current = null;
		}

		setState({
			status: 'idle',
			progress: 0,
			imageUrl: null,
			error: null,
			generationId: null,
		});
	}, []);

	/**
	 * Cancel ongoing generation
	 */
	const cancel = useCallback(async () => {
		if (!state.generationId) {
			return;
		}

		try {
			await cancelGeneration(state.generationId);
			reset();
		} catch (error: any) {
			logger.error('Failed to cancel generation:', error);
		}
	}, [state.generationId, reset]);

	return {
		status: state.status,
		progress: state.progress,
		imageUrl: state.imageUrl,
		error: state.error,
		generationId: state.generationId,
		generate,
		reset,
		cancel,
		isGenerating:
			state.status !== 'idle' &&
			state.status !== 'completed' &&
			state.status !== 'failed' &&
			state.status !== 'cancelled',
	};
}

// ============================================================================
// HOOK: useGenerationHistory
// ============================================================================

/**
 * React hook for fetching user's generation history
 * Note: This hook now uses the backend API instead of Supabase Realtime
 */
export function useGenerationHistory(limit: number = 20) {
	const [generations, setGenerations] = useState<GenerationStatus[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchGenerations = async () => {
		// TODO: Add /generate/history endpoint to backend
		// For now, return empty array
		setLoading(false);
		setGenerations([]);
	};

	// Initial fetch
	useEffect(() => {
		fetchGenerations();
	}, [limit]);

	return {
		generations,
		loading,
		error,
		refresh: fetchGenerations,
	};
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get generation status with details
 */
export async function getGenerationStatus(generationId: string): Promise<GenerationStatus> {
	return checkGenerationStatus(generationId);
}

/**
 * Get completed image for a generation
 */
export async function getGenerationImage(generationId: string) {
	const status = await checkGenerationStatus(generationId);
	return status.image || null;
}
