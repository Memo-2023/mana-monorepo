import { useState, useCallback, useEffect } from 'react';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { tokenManager } from '~/features/auth/services/tokenManager';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

const debug = __DEV__ ? console.debug : () => {};

interface LoadingStates {
	memo: boolean;
	memories: boolean;
	audio: boolean;
	photos: boolean;
	overall: boolean;
}

export function useOptimizedMemoData(memoId: string | undefined) {
	const { t } = useTranslation();
	const [memo, setMemo] = useState<any>(null);
	const [memories, setMemories] = useState<any[]>([]);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [photos, setPhotos] = useState<any[]>([]);
	const [loadingStates, setLoadingStates] = useState<LoadingStates>({
		memo: false,
		memories: false,
		audio: false,
		photos: false,
		overall: false,
	});
	const [error, setError] = useState<Error | null>(null);

	const updateLoadingState = useCallback((key: keyof LoadingStates, value: boolean) => {
		setLoadingStates((prev) => {
			const newState = { ...prev, [key]: value };
			// Update overall loading state
			newState.overall = newState.memo || newState.memories || newState.audio || newState.photos;
			return newState;
		});
	}, []);

	const getSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
		try {
			const supabase = await getAuthenticatedClient();
			const { data, error } = await supabase.storage
				.from('user-uploads')
				.createSignedUrl(filePath, 3600);

			if (error) {
				debug('Error creating signed URL:', error.message);
				return null;
			}

			return data?.signedUrl || null;
		} catch (error) {
			debug('Error in getSignedUrl:', error);
			return null;
		}
	}, []);

	const loadMemoData = useCallback(async () => {
		if (!memoId || memoId === 'undefined' || memoId === 'null') {
			setError(new Error('Invalid memo ID'));
			return;
		}

		const startTime = Date.now();
		debug(`Starting optimized memo load for ID: ${memoId}`);

		try {
			updateLoadingState('overall', true);
			updateLoadingState('memo', true);

			// Get token once for all operations
			const token = await tokenManager.getValidToken({ maxRetries: 1 });
			if (!token) {
				throw new Error('Authentication failed');
			}

			const supabase = await getAuthenticatedClient();

			// Load all data in parallel
			const [memoResult, memoriesResult, viewCountResult] = await Promise.allSettled([
				// 1. Fetch memo data
				supabase.from('memos').select('*').eq('id', memoId).single(),

				// 2. Fetch memories
				supabase
					.from('memories')
					.select('id, title, content, metadata')
					.eq('memo_id', memoId)
					.order('sort_order', { ascending: true })
					.order('created_at', { ascending: false }),

				// 3. Increment view count (fire and forget)
				supabase.rpc('increment_memo_view_count', { memo_id: memoId }),
			]);

			// Handle memo data
			if (memoResult.status === 'fulfilled' && memoResult.value.data) {
				const memoData = memoResult.value.data;
				setMemo(memoData);
				updateLoadingState('memo', false);

				// Load audio URL in parallel if available
				const audioPath = memoData.source?.audio_path;

				if (audioPath) {
					updateLoadingState('audio', true);
					getSignedUrl(audioPath).then((url) => {
						setAudioUrl(url);
						updateLoadingState('audio', false);
					});
				}

				// Load photos in parallel (if you have photo loading logic)
				// updateLoadingState('photos', true);
				// loadPhotos(memoId).then(photos => {
				//   setPhotos(photos);
				//   updateLoadingState('photos', false);
				// });
			} else if (memoResult.status === 'rejected') {
				throw new Error('Failed to load memo');
			}

			// Handle memories
			if (memoriesResult.status === 'fulfilled' && memoriesResult.value.data) {
				setMemories(memoriesResult.value.data);
			}
			updateLoadingState('memories', false);

			const loadTime = Date.now() - startTime;
			debug(`Memo load completed in ${loadTime}ms`);
		} catch (err) {
			const loadTime = Date.now() - startTime;
			debug(`Memo load failed after ${loadTime}ms:`, err);
			setError(err as Error);

			Alert.alert(t('common.error', 'Error'), t('memo.could_not_load', 'Could not load memo'));
		} finally {
			updateLoadingState('overall', false);
		}
	}, [memoId, t, getSignedUrl, updateLoadingState]);

	// Load data when memoId changes
	useEffect(() => {
		if (memoId) {
			loadMemoData();
		}
	}, [memoId, loadMemoData]);

	return {
		memo,
		memories,
		audioUrl,
		photos,
		loading: loadingStates.overall,
		loadingStates,
		error,
		refetch: loadMemoData,
	};
}
