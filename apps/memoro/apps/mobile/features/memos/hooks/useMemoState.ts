import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { tokenManager } from '~/features/auth/services/tokenManager';
import { getTranscriptText, getUtterances } from '~/features/memos/utils/transcriptUtils';

// Debug utility
const debug = __DEV__ ? console.debug : () => {};

// Type definitions
interface MemoType {
	id: string;
	title?: string;
	intro?: string;
	created_at: string;
	transcript?: string; // Full transcription text (moved from source for performance)
	location?: string; // PostGIS POINT format
	source?: {
		type?: string;
		content?: string;
		transcript?: string;
		transcription?: string;
		speakers?: Record<string, Array<{ text: string; offset?: number; duration?: number }>>;
		utterances?: Array<{ text: string; offset?: number; duration?: number; speakerId?: string }>;
		duration?: number;
		duration_seconds?: number;
		audio_path?: string;
		additional_recordings?: Array<{
			path: string;
			type: string;
			timestamp: string;
			status: string;
			transcript?: string;
			speakers?: Record<string, Array<{ text: string; offset?: number; duration?: number }>>;
			utterances?: Array<{ text: string; offset?: number; duration?: number; speakerId?: string }>;
			languages?: string[];
		}>;
	};
	metadata?: {
		transcription?: boolean;
		blueprint_id?: string;
		speakerLabels?: Record<string, string>;
		transcript?: string;
		utterances?: Array<{ text: string; offset?: number; duration?: number; speakerId?: string }>;
		location?: {
			latitude: number;
			longitude: number;
			timestamp: number;
		};
		stats?: {
			viewCount: number;
			wordCount?: number;
			lastViewed?: string;
			audioDuration?: number;
		};
	};
}

interface MemoryType {
	id: string;
	title: string;
	content: string;
	metadata?: Record<string, unknown>;
}

interface LoadingStates {
	memo: boolean;
	question: boolean;
	memories: boolean;
	audio: boolean;
	critical: boolean;
}

interface MemoState {
	// Core memo data
	memo: MemoType | null;
	memories: MemoryType[];
	localMemories: MemoryType[];

	// Memo properties
	isPinned: boolean;
	isEditMode: boolean;
	editTitle: string;
	editIntro: string;
	editTranscript: string;
	editUtterances: Array<{
		text: string;
		offset?: number;
		duration?: number;
		speakerId?: string;
	}> | null;

	// Audio and media
	audioUrl: string | null;

	// Loading states
	loadingStates: LoadingStates;

	// Word replacement
	wordToReplace: string;
	replacementWord: string;
	speakerMappings: Record<string, string>;

	// Summary and processing
	summaryError: string | null;
	isGeneratingSummary: boolean;
}

interface MemoActions {
	// Loading state management
	updateLoadingState: (key: keyof LoadingStates, value: boolean) => void;
	isAnyLoading: boolean;

	// Memo operations
	loadMemoData: (memoId: string) => Promise<void>;
	handleEditStart: () => void;
	handleSaveEdit: (memoId: string) => Promise<void>;
	handleCancelEdit: () => void;
	handlePinToggle: (memoId: string) => Promise<void>;

	// Audio operations
	getSignedUrl: (filePath: string) => Promise<string | null>;

	// Memory operations
	setMemories: React.Dispatch<React.SetStateAction<MemoryType[]>>;
	setLocalMemories: React.Dispatch<React.SetStateAction<any[]>>;

	// Memo operations
	setMemo: React.Dispatch<React.SetStateAction<MemoType | null>>;

	// Edit operations
	setEditTitle: (title: string) => void;
	setEditIntro: (intro: string) => void;
	setEditTranscript: (transcript: string) => void;
	setEditUtterances: (
		utterances: Array<{
			text: string;
			offset?: number;
			duration?: number;
			speakerId?: string;
		}> | null
	) => void;
	updateEditUtterance: (index: number, newText: string) => void;

	// Word replacement
	setWordToReplace: (word: string) => void;
	setReplacementWord: (word: string) => void;
	setSpeakerMappings: React.Dispatch<React.SetStateAction<Record<string, string>>>;

	// Summary operations
	setSummaryError: (error: string | null) => void;
	setIsGeneratingSummary: (generating: boolean) => void;
}

export function useMemoState(): MemoState & MemoActions {
	const { t } = useTranslation();

	// Core memo data
	const [memo, setMemo] = useState<MemoType | null>(null);
	const [memories, setMemories] = useState<MemoryType[]>([]);
	const [localMemories, setLocalMemories] = useState<any[]>([]);
	// Removed unused variable - memoryUpdateTimeouts
	// const memoryUpdateTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	// Memo properties
	const [isPinned, setIsPinned] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editIntro, setEditIntro] = useState('');
	const [editTranscript, setEditTranscript] = useState('');
	const [editUtterances, setEditUtterances] = useState<Array<{
		text: string;
		offset?: number;
		duration?: number;
		speakerId?: string;
	}> | null>(null);

	// Refs to capture latest values to prevent race conditions
	const editTranscriptRef = useRef('');
	const editUtterancesRef = useRef<Array<{
		text: string;
		offset?: number;
		duration?: number;
		speakerId?: string;
	}> | null>(null);

	// Audio and media
	const [audioUrl, setAudioUrl] = useState<string | null>(null);

	// Loading states
	const [loadingStates, setLoadingStates] = useState<LoadingStates>({
		memo: true,
		question: false,
		memories: false,
		audio: false,
		critical: false,
	});

	// Word replacement
	const [wordToReplace, setWordToReplace] = useState('');
	const [replacementWord, setReplacementWord] = useState('');
	const [speakerMappings, setSpeakerMappings] = useState<Record<string, string>>({});

	// Summary and processing
	const [summaryError, setSummaryError] = useState<string | null>(null);
	const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

	// Loading state helper
	const updateLoadingState = useCallback((key: keyof LoadingStates, value: boolean) => {
		setLoadingStates((prev) => ({ ...prev, [key]: value }));
	}, []);

	const isAnyLoading = Object.values(loadingStates).some(Boolean);

	// Sync localMemories with memories when not editing
	useEffect(() => {
		if (!isEditMode) {
			setLocalMemories(memories);
		}
	}, [memories, isEditMode]);

	// Cleanup refs on unmount
	useEffect(() => {
		return () => {
			// Clear refs holding potentially large data
			editTranscriptRef.current = '';
			editUtterancesRef.current = null;
		};
	}, []);

	// Generate signed URL for files
	const getSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
		try {
			// Use authenticated client to ensure proper RLS policy enforcement
			const supabase = await getAuthenticatedClient();

			const { data, error } = await supabase.storage
				.from('user-uploads')
				.createSignedUrl(filePath, 60 * 60); // 1 hour expiration

			if (error) {
				debug('Error generating signed URL:', error.message);
				return null;
			}

			return data.signedUrl;
		} catch (error) {
			debug('Error in getSignedUrl:', error);
			return null;
		}
	}, []);

	// Load memo data with retry logic
	const loadMemoData = useCallback(
		async (memoId: string, retryCount = 0) => {
			// Validate memoId before proceeding
			if (!memoId || memoId === 'undefined' || memoId === 'null' || memoId.length === 0) {
				console.error('MemoState: Invalid memo ID provided:', memoId);
				updateLoadingState('memo', false);
				Alert.alert(t('common.error', 'Fehler'), t('memo.invalid_id', 'Ungültige Memo-ID.'));
				return;
			}

			try {
				debug(`MemoState: Fetching memo with id: ${memoId}, retry attempt: ${retryCount}`);
				updateLoadingState('memo', true);

				// Wait for valid token before proceeding
				const token = await tokenManager.getValidToken({ maxRetries: 3 });

				if (!token) {
					debug('MemoState: Unable to obtain valid authentication token');
					throw new Error('Authentication failed - unable to obtain valid token');
				}

				debug('MemoState: Valid token obtained, proceeding with memo fetch');
				const supabase = await getAuthenticatedClient();

				// Increment view count
				await supabase.rpc('increment_memo_view_count', {
					memo_id: memoId,
				});

				// Parallelize memo and memories loading
				const [memoResult, memoriesResult] = await Promise.all([
					// Load memo
					supabase.from('memos').select('*').eq('id', memoId).single(),
					// Load memories in parallel
					supabase
						.from('memories')
						.select('id, title, content, metadata')
						.eq('memo_id', memoId)
						.order('sort_order', { ascending: true })
						.order('created_at', { ascending: false }),
				]);

				const { data, error } = memoResult;

				if (error) {
					console.error('MemoState: Error fetching memo:', error.message, error);
					// Log more details about the error
					if (error.code) {
						console.error('MemoState: Error code:', error.code);
					}
					if (error.details) {
						console.error('MemoState: Error details:', error.details);
					}
					if (error.hint) {
						console.error('MemoState: Error hint:', error.hint);
					}

					// Check if this might be an authentication issue
					const tokenState = tokenManager.getTokenState();
					const isAuthRelatedError =
						(error.code === 'PGRST116' &&
							error.details?.includes('0 rows') &&
							tokenState !== 'valid') ||
						error.code === 'PGRST301' || // JWT expired
						error.message?.includes('JWT') ||
						error.message?.includes('token');

					// Retry logic for temporary failures and auth issues
					const isRetryableError =
						isAuthRelatedError ||
						error.code === '57014' || // Query canceled
						error.message?.includes('network') ||
						error.message?.includes('fetch');

					if (retryCount < 2 && isRetryableError) {
						debug(
							`MemoState: Retryable error (auth: ${isAuthRelatedError}), retrying in ${1000 * (retryCount + 1)}ms...`,
							error.code
						);
						updateLoadingState('memo', false); // Reset loading state for retry
						setTimeout(
							() => {
								loadMemoData(memoId, retryCount + 1);
							},
							1000 * (retryCount + 1)
						); // Exponential backoff: 1s, 2s (longer for auth issues)
						return;
					}

					// Show user-friendly error message based on error type
					if (
						error.code === 'PGRST116' &&
						error.details?.includes('0 rows') &&
						!isAuthRelatedError
					) {
						// Only show "not found" if we're sure it's not an auth issue
						Alert.alert(
							t('common.error', 'Fehler'),
							t(
								'memo.not_found',
								'Das Memo wurde nicht gefunden. Es wurde möglicherweise gelöscht.'
							)
						);
						// Clear the memo from the store to prevent showing stale data
						setMemo(null);
					} else if (error.message?.includes('permission') || error.code === '42501') {
						Alert.alert(
							t('common.error', 'Fehler'),
							t('memo.no_permission', 'Sie haben keine Berechtigung, dieses Memo anzuzeigen.')
						);
					} else {
						console.log('ERROR LOADING MEMO', error);
						Alert.alert(
							t('common.error', 'Fehler'),
							t('memo.could_not_load', 'Memo konnte nicht geladen werden.')
						);
					}
					return;
				}

				if (!data) {
					console.error('MemoState: No data returned for memo ID:', memoId);
					Alert.alert(
						t('common.error', 'Fehler'),
						t('memo.not_found', 'Das Memo wurde nicht gefunden.')
					);
					return;
				}

				console.log('[useMemoState] Fetched memo data:', data);
				console.log('[useMemoState] Location field in memo:', data.location);
				setMemo(data);
				setIsPinned(data.is_pinned || false);

				// Generate audio URL if audio_path exists
				debug('MemoState: Checking audio data - source.audio_path:', data?.source?.audio_path);
				if (data?.source?.audio_path) {
					updateLoadingState('audio', true);
					const audioPath = data.source.audio_path;
					debug('MemoState: Audio path found:', audioPath);
					if (audioPath) {
						debug('MemoState: Requesting signed URL for audio path:', audioPath);
						const signedUrl = await getSignedUrl(audioPath);
						if (signedUrl) {
							setAudioUrl(signedUrl);
							debug(
								'MemoState: Audio URL generated successfully:',
								signedUrl.substring(0, 100) + '...'
							);
						} else {
							debug('MemoState: Failed to generate audio URL for path:', audioPath);
						}
					} else {
						debug('MemoState: Audio path is empty or null');
					}
					updateLoadingState('audio', false);
				} else {
					debug('MemoState: No audio path found in memo source data');
					setAudioUrl(null);
				}

				// Handle memories result from parallel loading
				const { data: memoriesData, error: memoriesError } = memoriesResult;

				if (memoriesError) {
					debug('Error fetching memories:', memoriesError.message);
				} else if (memoriesData) {
					debug('Fetched memories count:', memoriesData.length);
					setMemories(memoriesData);
				}
			} catch (error: any) {
				debug('MemoState: Error in loadMemoData:', error);

				// Handle authentication errors specifically
				if (error.message?.includes('Authentication failed')) {
					// Don't show alert for auth failures - just retry silently
					if (retryCount < 2) {
						debug('MemoState: Authentication error, retrying...');
						updateLoadingState('memo', false);
						setTimeout(
							() => {
								loadMemoData(memoId, retryCount + 1);
							},
							1000 * (retryCount + 1)
						);
						return;
					}
				}

				// For other errors, show generic error message
				Alert.alert(
					t('common.error', 'Fehler'),
					t(
						'memo.load_error',
						'Das Memo konnte nicht geladen werden. Bitte versuchen Sie es später erneut.'
					)
				);
			} finally {
				updateLoadingState('memo', false);
			}
		},
		[getSignedUrl, updateLoadingState, t]
	);

	// Edit operations
	const handleEditStart = useCallback(() => {
		debug('handleEditStart called:', { isEditMode, hasMemo: !!memo });
		if (!isEditMode && memo) {
			const initialTitle = memo.title || '';
			const initialIntro = memo.intro || '';
			const initialTranscript = getTranscriptText(memo);

			// Handle utterances from different possible locations
			const initialUtterances = getUtterances(memo);

			debug('handleEditStart - Setting initial values:', {
				initialTitle,
				initialIntro,
				initialTranscript,
				initialUtterances,
			});

			setEditTitle(initialTitle);
			setEditIntro(initialIntro);
			setEditTranscript(initialTranscript);
			setEditUtterances(initialUtterances);

			// Also update refs
			editTranscriptRef.current = initialTranscript;
			editUtterancesRef.current = initialUtterances;

			setIsEditMode(true);
			debug('Edit mode activated');
		} else {
			debug('handleEditStart - Skipped, already in edit mode or no memo');
		}
	}, [isEditMode, memo]);

	// Debug memo changes during edit mode
	useEffect(() => {
		if (isEditMode) {
			debug('Memo changed during edit mode:', {
				memoId: memo?.id,
				memoTitle: memo?.title,
				memoTranscript: memo?.transcript || memo?.source?.transcript || memo?.metadata?.transcript,
				currentEditTranscript: editTranscript,
				currentEditUtterances: editUtterances?.length,
			});
		}
	}, [memo, isEditMode, editTranscript, editUtterances]);

	const handleSaveEdit = useCallback(
		async (memoId: string) => {
			if (!memo || !memoId) return;

			try {
				updateLoadingState('memo', true);
				const supabase = await getAuthenticatedClient();

				// Capture current edit values to prevent race conditions (use refs for reliable values)
				const currentEditTitle = editTitle;
				const currentEditIntro = editIntro;
				const currentEditTranscript = editTranscriptRef.current;
				const currentEditUtterances = editUtterancesRef.current;

				debug('handleSaveEdit - Captured current values:', {
					currentEditTitle,
					currentEditIntro,
					currentEditTranscript,
					currentEditUtterances,
					stateTranscript: editTranscript,
					refTranscript: editTranscriptRef.current,
				});

				// Prepare update data
				const updateData: Record<string, unknown> = {
					title: currentEditTitle,
					intro: currentEditIntro,
				};

				// Update transcript and utterances if they changed
				const originalTranscript = getTranscriptText(memo);
				const originalUtterances = getUtterances(memo);

				debug('handleSaveEdit - Checking for changes:', {
					currentEditTranscript,
					originalTranscript,
					currentEditUtterances,
					originalUtterances,
					transcriptChanged: currentEditTranscript !== originalTranscript,
					utterancesChanged:
						JSON.stringify(currentEditUtterances) !== JSON.stringify(originalUtterances),
				});

				if (
					currentEditTranscript !== originalTranscript ||
					JSON.stringify(currentEditUtterances) !== JSON.stringify(originalUtterances)
				) {
					// Determine the utterances to save
					let utterancesToSave = currentEditUtterances;

					// When transcript changes but we have no utterances or just one, create/update the single utterance
					if (
						currentEditTranscript !== originalTranscript &&
						(!currentEditUtterances || currentEditUtterances.length <= 1)
					) {
						// If transcript changed and we have no utterances or just one, create a single utterance
						utterancesToSave = [
							{
								text: currentEditTranscript,
								speakerId: currentEditUtterances?.[0]?.speakerId || 'default',
								offset: currentEditUtterances?.[0]?.offset || 0,
								duration: currentEditUtterances?.[0]?.duration || 0,
							},
						];
					}

					// Update source with utterances only (no transcript field)
					if (memo.source && utterancesToSave) {
						const updatedSource = {
							...memo.source,
							utterances: utterancesToSave,
						};

						// Remove any legacy transcript fields
						delete updatedSource.transcript;
						delete updatedSource.content;
						delete updatedSource.transcription;

						updateData.source = updatedSource;
					}

					// Also remove transcript from top level if it exists
					updateData.transcript = null;
				}

				const { data, error } = await supabase
					.from('memos')
					.update(updateData)
					.eq('id', memoId)
					.select('id, title, intro, created_at, source, metadata, is_pinned')
					.single();

				if (error) {
					debug('Error updating memo:', error.message);
					Alert.alert(
						t('common.error', 'Fehler'),
						t('memo.update_error', 'Das Memo konnte nicht aktualisiert werden.')
					);
					return;
				}

				debug('Memo updated successfully:', data);
				debug('New memo utterances:', data.source?.utterances);
				debug('New memo transcript:', data.source?.transcript || data.metadata?.transcript);
				debug('New memo speakerMap:', (data.source as any)?.speakerMap);
				debug('Full new memo source:', data.source);
				debug('Full new memo metadata:', data.metadata);
				setMemo(data);

				// Clear edit states when leaving edit mode
				setEditTranscript('');
				setEditUtterances(null);
				editTranscriptRef.current = '';
				editUtterancesRef.current = null;

				setIsEditMode(false);
			} catch (error) {
				debug('Error in handleSaveEdit:', error);
				Alert.alert(
					t('common.error', 'Fehler'),
					t('common.unexpected_error', 'Ein unerwarteter Fehler ist aufgetreten.')
				);
			} finally {
				updateLoadingState('memo', false);
			}
		},
		[memo, editTitle, editIntro, updateLoadingState, t]
	);

	const handleCancelEdit = useCallback(() => {
		setIsEditMode(false);
		debug('Edit mode canceled');
	}, []);

	// Pin toggle operation
	const handlePinToggle = useCallback(
		async (memoId: string) => {
			if (!memoId) return;

			const newPinnedState = !isPinned;

			try {
				updateLoadingState('memo', true);
				const supabase = await getAuthenticatedClient();

				const { error } = await supabase
					.from('memos')
					.update({ is_pinned: newPinnedState })
					.eq('id', memoId);

				if (error) {
					debug('Error updating pin status:', error.message);
					Alert.alert(
						t('common.error', 'Fehler'),
						t('memo.pin_error', 'Der Pin-Status konnte nicht aktualisiert werden.')
					);
					return;
				}

				setIsPinned(newPinnedState);
				debug('Pin status updated successfully');
			} catch (error) {
				debug('Error in handlePinToggle:', error);
			} finally {
				updateLoadingState('memo', false);
			}
		},
		[isPinned, updateLoadingState, t]
	);

	// Helper function to update individual utterance
	const updateEditUtterance = useCallback(
		(index: number, newText: string) => {
			debug('updateEditUtterance called:', { index, newText, hasEditUtterances: !!editUtterances });
			if (!editUtterances) return;

			const updatedUtterances = [...editUtterances];
			if (updatedUtterances[index]) {
				updatedUtterances[index] = {
					...updatedUtterances[index],
					text: newText,
				};
				debug('Setting updated utterances:', updatedUtterances);
				setEditUtterances(updatedUtterances);
				// Also update ref
				editUtterancesRef.current = updatedUtterances;
			}
		},
		[editUtterances]
	);

	// Custom setEditTranscript that also updates ref
	const setEditTranscriptWithRef = useCallback((transcript: string) => {
		debug('setEditTranscriptWithRef called:', transcript);
		setEditTranscript(transcript);
		editTranscriptRef.current = transcript;
	}, []);

	return {
		// State
		memo,
		memories,
		localMemories,
		isPinned,
		isEditMode,
		editTitle,
		editIntro,
		editTranscript,
		editUtterances,
		audioUrl,
		loadingStates,
		wordToReplace,
		replacementWord,
		speakerMappings,
		summaryError,
		isGeneratingSummary,

		// Actions
		updateLoadingState,
		isAnyLoading,
		loadMemoData,
		handleEditStart,
		handleSaveEdit,
		handleCancelEdit,
		handlePinToggle,
		getSignedUrl,
		setMemories,
		setLocalMemories,
		setMemo,
		setEditTitle,
		setEditIntro,
		setEditTranscript: setEditTranscriptWithRef,
		setEditUtterances,
		updateEditUtterance,
		setWordToReplace,
		setReplacementWord,
		setSpeakerMappings,
		setSummaryError,
		setIsGeneratingSummary,
	};
}
