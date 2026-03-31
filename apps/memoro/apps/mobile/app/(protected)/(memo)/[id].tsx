import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
	StyleSheet,
	View,
	ScrollView,
	Alert,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	Keyboard,
	NativeSyntheticEvent,
	NativeScrollEvent,
} from 'react-native';
// import MemoScrollView from '~/components/molecules/MemoScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateTimeForAudio } from '~/utils/date';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import { useHeader } from '~/features/menus/HeaderContext';
import Toolbar from '~/components/molecules/Toolbar';
import PromptBar from '~/components/molecules/PromptBar';
import { useSearchProvider, useGlobalSearchStore } from '~/features/search';
import { getMemoLocation } from '~/features/location/utils/locationHelpers';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import { useSpaceStore } from '~/features/spaces/store/spaceStore';
import { useAuth } from '~/features/auth/contexts/AuthContext';
import { tokenManager } from '~/features/auth/services/tokenManager';
import { useTranslation } from 'react-i18next';
import LoadingOverlay from '~/components/atoms/LoadingOverlay';
import { useModalState } from '~/features/memos/hooks/useModalState';
import { useMemoState } from '~/features/memos/hooks/useMemoState';
import { useMemoSearch } from '~/features/memos/hooks/useMemoSearch';
import { useSpeakerLabels } from '~/features/memos/hooks/useSpeakerLabels';
import { useMemoProcessing } from '~/features/memos/hooks/useMemoProcessing';
import { creditService } from '~/features/credits/creditService';
import { useCredits } from '~/features/credits/CreditContext';
import { DEBOUNCE_DELAYS } from '~/utils/sharedConstants';
import {
	getTranscriptText,
	isCombinedMemo,
	getCombinedMemoRecordings,
} from '~/features/memos/utils/transcriptUtils';
import tagEvents from '~/features/tags/tagEvents';
import { useToast } from '~/features/toast/contexts/ToastContext';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';
import PhotoGallery from '~/components/organisms/PhotoGallery';
import { usePhotoUpload } from '~/features/storage/hooks/usePhotoUpload';
import MemoBottomBar from '~/components/molecules/MemoBottomBar';
import { useMemoUpdates } from '~/features/memos/contexts/MemoRealtimeContext';
import { MemoDetailSkeleton } from '~/components/skeletons/MemoDetailSkeleton';
import MemoHeader from './components/MemoHeader';
import MemoModals from './components/MemoModals';
import MemoTranscript from './components/MemoTranscript';
import MemoMemories from './components/MemoMemories';
import MemoAudio from './components/MemoAudio';
import {
	handleReplaceWordInMemo,
	handleDeleteMemo,
	handleTranslateMemo,
	handleReprocessMemo,
	handleQuestionMemo,
} from './actions/memoActions';
import { useAnalytics, trackError, trackPerformance } from '~/features/analytics';
import { useBottomBar } from '~/features/bottomBar';

// -------------------------------------------------
// Debug utility (only logs in development)
// -------------------------------------------------
const debug = __DEV__ ? console.debug : () => {};

// -------------------------------------------------
// Main Component: MemoPage
// -------------------------------------------------
// Create scroll ref outside component to avoid recreation
const globalScrollRef = React.createRef<ScrollView>();

export default function MemoPage() {
	const { isDark, themeVariant } = useTheme();
	const { t, i18n } = useTranslation();
	const currentLanguage = i18n.language;
	const { showSuccess } = useToast();
	const { showPageOnboardingToast } = usePageOnboarding();
	const { refreshCredits } = useCredits();
	const insets = useSafeAreaInsets();
	const { track } = useAnalytics();

	// Router und Params
	const params = useLocalSearchParams<{ id: string; translated?: string }>();
	const id = params.id;
	const translated = params.translated;

	// Validate ID parameter
	const isValidId = id && id !== 'undefined' && id !== 'null' && id.length > 0;

	// State for modals and credits
	const [isTranslateModalVisible, setIsTranslateModalVisible] = useState(false);
	const [isCreateMemoryModalVisible, setIsCreateMemoryModalVisible] = useState(false);
	const [isReprocessModalVisible, setIsReprocessModalVisible] = useState(false);
	const [isReprocessing, setIsReprocessing] = useState(false);
	const [isTranslating, setIsTranslating] = useState(false);

	// Scroll state for dynamic header title
	const [scrollY, setScrollY] = useState(0);
	const [showHeaderTitle, setShowHeaderTitle] = useState(false);

	// Ref to track current showHeaderTitle value to avoid closure issues in throttled handler
	const showHeaderTitleRef = React.useRef(showHeaderTitle);

	// Update ref when showHeaderTitle changes
	React.useEffect(() => {
		showHeaderTitleRef.current = showHeaderTitle;
	}, [showHeaderTitle]);

	// Modal state management
	const {
		isSpaceSelectorVisible,
		isShareModalVisible,
		isReplaceWordModalVisible,
		isSpeakerLabelModalVisible,
		isTagSelectorVisible,
		setSpaceSelectorVisible,
		setIsShareModalVisible,
		setIsReplaceWordModalVisible,
		setIsSpeakerLabelModalVisible,
		setIsTagSelectorVisible,
	} = useModalState();

	// Memo state management
	const {
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
		setEditTranscript,
		setEditUtterances,
		updateEditUtterance,
		setWordToReplace,
		setReplacementWord,
		setSpeakerMappings,
		setSummaryError,
		setIsGeneratingSummary,
	} = useMemoState();

	// Memo processing hook for consistent status display
	const { displayTitle } = useMemoProcessing({ memo: memo || { id: '' } });

	// Search functionality
	const {
		isSearchMode,
		searchQuery,
		searchResults,
		currentSearchIndex,
		scrollViewRef,
		setSearchQuery,
		handleSearchPress,
		performSearch,
		navigateToNextSearchResult,
		navigateToPreviousSearchResult,
		closeSearch,
	} = useMemoSearch(memo, memories);

	// Register global search provider
	const globalSearchActive = useGlobalSearchStore((s) => s.isActive);

	useSearchProvider({
		id: 'memo-detail',
		placeholder: t('memo.search_placeholder', 'Memo durchsuchen...'),
		onSearch: (query: string) => {
			setSearchQuery(query);
			performSearch(query);
		},
		onClose: closeSearch,
		currentIndex: currentSearchIndex + 1,
		totalResults: searchResults.length,
		onNext: navigateToNextSearchResult,
		onPrevious: navigateToPreviousSearchResult,
	});

	// Sync local search state with global search state
	useEffect(() => {
		if (!globalSearchActive && isSearchMode) {
			closeSearch();
		} else if (globalSearchActive && !isSearchMode) {
			handleSearchPress();
		}
	}, [globalSearchActive, isSearchMode, closeSearch, handleSearchPress]);

	// Speaker labels functionality
	const { getSpeakerIds, handleLabelSpeakersPress, handleUpdateSpeakerLabels } = useSpeakerLabels({
		memo,
		memoId: id,
		speakerMappings,
		setSpeakerMappings,
		setMemo,
		setIsSpeakerLabelModalVisible,
		updateLoadingState,
		onSuccess: () => {
			// Show success toast instead of system alert
			showSuccess(t('memo.speakers_updated_success', 'Sprecher erfolgreich benannt!'));
		},
	});
	const [showPromptBar, setShowPromptBar] = useState(false);
	const [promptValue, setPromptValue] = useState('');
	const [promptInputFocus, setPromptInputFocus] = useState(false);
	const promptInputRef = React.useRef<TextInput | null>(null);
	const [translationToastShown, setTranslationToastShown] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	// Local ref for memory editing timeouts
	const memoryUpdateTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	// Photo upload functionality
	const {
		photos,
		uploading: photosUploading,
		selectAndUploadPhotos,
		uploadSelectedPhotos,
		deletePhoto,
		loadPhotos: loadMemoPhotos,
	} = usePhotoUpload(isValidId ? id : '');

	// Memoized location calculation to prevent infinite loop
	const memoLocation = useMemo(() => {
		if (!memo) return null;
		return getMemoLocation(memo);
	}, [memo?.id, memo?.location, memo?.metadata?.address]);

	// Memoized transcript data calculation for performance
	const memoizedTranscriptData = useMemo(() => {
		if (!memo) return null;

		// Check if this is a combined memo
		if (isCombinedMemo(memo)) {
			const recordings = getCombinedMemoRecordings(memo);

			// For combined memos, we need to format the data differently
			const combinedTranscriptData = {
				audio_path: memo.source?.audio_path,
				type: memo.source?.type,
				languages: memo.source?.languages || [],
				primary_language: memo.source?.primary_language,
				transcript: '', // Combined memos don't have a single transcript
				transcription_parts: recordings.map((recording) => ({
					title: recording.title,
					transcript: recording.transcript,
					created_at: recording.timestamp,
					index: recording.index,
					// Include speaker data from each recording
					utterances: recording.utterances,
					speakers: recording.speakers,
				})),
			};

			return combinedTranscriptData;
		}

		// Original logic for non-combined memos
		const originalTranscript = getTranscriptText(memo);

		const transcriptData = {
			audio_path: memo.source?.audio_path,
			type: memo.source?.type,
			languages: memo.source?.languages,
			transcript: isEditMode && editTranscript ? editTranscript : originalTranscript,
		};

		// Process structured speaker data
		if (memo.source?.speakers || memo.source?.utterances) {
			let utterances: Array<{
				speakerId: string;
				text: string;
				offset: number;
				duration: number;
			}> = [];

			if (memo.source?.utterances && Array.isArray(memo.source.utterances)) {
				utterances = memo.source.utterances.map((u: any) => ({
					speakerId: u.speakerId || 'unknown',
					text: u.text || '',
					offset: u.offset || 0,
					duration: u.duration || 0,
				}));
			} else if (memo.source?.speakers) {
				// Legacy structure handling
				const speakersArray = memo.source.speakers;
				if (speakersArray && typeof Object.values(speakersArray)[0] !== 'string') {
					Object.entries(speakersArray).forEach(([speakerId, speakerUtterances]) => {
						if (Array.isArray(speakerUtterances)) {
							speakerUtterances.forEach((utterance) => {
								utterances.push({
									speakerId,
									text: utterance.text || '',
									offset: utterance.offset || 0,
									duration: utterance.duration || 0,
								});
							});
						}
					});
					utterances.sort((a, b) => a.offset - b.offset);
				}
			}

			// Handle edit mode utterances
			const finalUtterances =
				isEditMode && editUtterances
					? editUtterances.map((u) => ({
							speakerId: u.speakerId || 'default',
							text: u.text || '',
							offset: u.offset || 0,
							duration: u.duration || 0,
						}))
					: utterances;

			// Create speaker mapping with proper names
			const speakerMapping: Record<string, any> = {};

			// First, populate with any existing speaker names from metadata
			if (memo.metadata?.speakerLabels) {
				Object.entries(memo.metadata.speakerLabels).forEach(([id, label]) => {
					if (typeof label === 'string') {
						speakerMapping[id] = label;
					}
				});
			}

			// Then check if we need utterance arrays instead
			const needsUtteranceArrays =
				memo.source?.speakers && typeof Object.values(memo.source.speakers)[0] !== 'string';

			if (needsUtteranceArrays) {
				// Reset to empty object for utterance arrays
				Object.keys(speakerMapping).forEach((key) => {
					speakerMapping[key] = [];
				});

				// Add utterances to speaker mapping
				finalUtterances.forEach((utterance) => {
					if (!speakerMapping[utterance.speakerId]) {
						speakerMapping[utterance.speakerId] = [];
					}
					speakerMapping[utterance.speakerId].push({
						text: utterance.text,
						offset: utterance.offset,
						duration: utterance.duration,
					});
				});
			} else {
				// First, copy existing speaker names from source if they exist
				if (memo.source?.speakers && typeof Object.values(memo.source.speakers)[0] === 'string') {
					Object.entries(memo.source.speakers).forEach(([id, name]) => {
						if (typeof name === 'string') {
							speakerMapping[id] = name;
						}
					});
				}

				// Then ensure all speakers have names (for any missing ones)
				finalUtterances.forEach((utterance) => {
					if (!speakerMapping[utterance.speakerId]) {
						// Generate default speaker name
						const speakerNum =
							utterance.speakerId.replace(/\D/g, '') || Object.keys(speakerMapping).length + 1;
						speakerMapping[utterance.speakerId] =
							`${t('memo.speaker_default', 'Sprecher')} ${speakerNum}`;
					}
				});
			}

			return {
				...transcriptData,
				utterances: finalUtterances,
				speakers: speakerMapping,
			};
		} else if (transcriptData.transcript) {
			// Simple text transcript
			return {
				...transcriptData,
				utterances:
					isEditMode && editUtterances
						? editUtterances
						: [
								{
									speakerId: 'default',
									text: transcriptData.transcript,
									offset: 0,
									duration: 0,
								},
							],
			};
		} else if (transcriptData.path) {
			// Audio file but no transcript yet
			return {
				...transcriptData,
				utterances: [
					{
						speakerId: 'default',
						text: t('memo.transcription_pending', 'Die Transkription läuft...'),
						offset: 0,
						duration: 0,
					},
				],
			};
		}

		return transcriptData;
	}, [memo, isEditMode, editTranscript, editUtterances, t]);

	// Memoized date formatter for audio with language support
	const formatDateTimeForAudioWithLang = useCallback(
		(dateString: string, durationSeconds?: number): string => {
			return formatDateTimeForAudio(dateString, durationSeconds, i18n.language);
		},
		[i18n.language]
	);

	// Throttled scroll handler for performance
	const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		// Extract the value immediately before the event is reused
		const currentScrollY = event.nativeEvent.contentOffset.y;
		setScrollY(currentScrollY);

		// Update header title visibility
		const shouldShowTitle = currentScrollY > 100;
		const currentShowHeaderTitle = showHeaderTitleRef.current;

		if (shouldShowTitle !== currentShowHeaderTitle) {
			setShowHeaderTitle(shouldShowTitle);
		}
	}, []); // Empty dependencies - we use ref to get current value

	// Note: Cleanup for throttled function is handled internally by the throttle implementation

	// Stable modal handlers to prevent re-renders
	const modalHandlers = useMemo(
		() => ({
			openShareModal: () => setIsShareModalVisible(true),
			closeShareModal: () => setIsShareModalVisible(false),
			openTagSelector: () => setIsTagSelectorVisible(true),
			closeTagSelector: () => setIsTagSelectorVisible(false),
			openSpaceSelector: () => setSpaceSelectorVisible(true),
			closeSpaceSelector: () => setSpaceSelectorVisible(false),
			openReplaceWord: () => setIsReplaceWordModalVisible(true),
			closeReplaceWord: () => setIsReplaceWordModalVisible(false),
			openSpeakerLabel: () => setIsSpeakerLabelModalVisible(true),
			closeSpeakerLabel: () => setIsSpeakerLabelModalVisible(false),
			openTranslateModal: () => setIsTranslateModalVisible(true),
			closeTranslateModal: () => setIsTranslateModalVisible(false),
			openCreateMemoryModal: () => setIsCreateMemoryModalVisible(true),
			closeCreateMemoryModal: () => setIsCreateMemoryModalVisible(false),
			openReprocessModal: () => setIsReprocessModalVisible(true),
			closeReprocessModal: () => setIsReprocessModalVisible(false),
		}),
		[]
	);

	// Initialize localMemories when entering edit mode
	useEffect(() => {
		if (isEditMode && localMemories.length === 0) {
			setLocalMemories(memories);
		}
	}, [isEditMode, memories]);

	// Comprehensive cleanup on unmount
	useEffect(() => {
		return () => {
			// Clear all timeouts in the Map
			memoryUpdateTimeouts.current.forEach((timeout) => clearTimeout(timeout));
			memoryUpdateTimeouts.current.clear();

			// Note: editTranscriptRef and editUtterancesRef are in useMemoState hook
			// They will be cleaned up when the hook is unmounted
		};
	}, []);

	// Debounced memory update function
	const debouncedMemoryUpdate = useCallback(
		async (memoryId: string, field: 'title' | 'content', newValue: string) => {
			// Add size limit check to prevent unbounded growth
			if (memoryUpdateTimeouts.current.size > 50) {
				// Clear oldest entries (first 10)
				const entries = Array.from(memoryUpdateTimeouts.current.entries());
				entries.slice(0, 10).forEach(([key, timeout]) => {
					clearTimeout(timeout);
					memoryUpdateTimeouts.current.delete(key);
				});
			}

			// Clear existing timeout for this memory
			const existingTimeout = memoryUpdateTimeouts.current.get(memoryId);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			// Set new timeout
			const timeout = setTimeout(async () => {
				try {
					const supabase = await getAuthenticatedClient();

					const updateData = { [field]: newValue };
					const { error } = await supabase.from('memories').update(updateData).eq('id', memoryId);

					if (error) {
						debug(`Error updating memory ${field}:`, error.message);
						Alert.alert(
							t('common.error', 'Fehler'),
							t('memo.memory_delete_error', 'Die Erinnerung konnte nicht aktualisiert werden.')
						);
						return;
					}

					// Update the main memories state
					setMemories((prev) =>
						prev.map((m) => (m.id === memoryId ? { ...m, [field]: newValue } : m))
					);

					debug(`Memory ${field} updated successfully:`, memoryId);
				} catch (error) {
					debug(`Error in debouncedMemoryUpdate:`, error);
					Alert.alert(
						t('common.error', 'Fehler'),
						t('common.unexpected_error', 'Ein unerwarteter Fehler ist aufgetreten.')
					);
				} finally {
					memoryUpdateTimeouts.current.delete(memoryId);
				}
			}, DEBOUNCE_DELAYS.SLOW);

			memoryUpdateTimeouts.current.set(memoryId, timeout);
		},
		[]
	);

	// Update local memory state immediately for smooth UI
	const updateLocalMemory = useCallback(
		(memoryId: string, field: 'title' | 'content', newValue: string) => {
			setLocalMemories((prev) =>
				prev.map((m) => (m.id === memoryId ? { ...m, [field]: newValue } : m))
			);

			// Trigger debounced database update
			debouncedMemoryUpdate(memoryId, field, newValue);
		},
		[debouncedMemoryUpdate]
	);

	// Manage memo tags and space data with the hook
	const spaces = useSpaceStore((state) => state.spaces);
	const { user } = useAuth(); // Real auth context instead of mock

	// Memoized helper function to convert tags to TagItems
	const convertTagToTagItem = useCallback(
		(tag: any): { id: string; text: string; color: string } => {
			const tagColor = tag.style?.color || '#cccccc';

			return {
				id: tag.id,
				text: tag.name,
				color: tagColor,
			};
		},
		[]
	);

	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [tagItems, setTagItems] = useState<Array<{ id: string; text: string; color: string }>>([]);
	const [isTagsLoading, setIsTagsLoading] = useState(false);

	// Optimized parallel tag loading
	const loadTags = useCallback(async () => {
		if (!isValidId) return;

		try {
			setIsTagsLoading(true);
			const supabase = await getAuthenticatedClient();

			// Load tags and memo tags in parallel
			const [tagsResult, memoTagsResult] = await Promise.all([
				// Load all tags
				supabase
					.from('tags')
					.select('*')
					.order('is_pinned', { ascending: false })
					.order('sort_order', { ascending: true })
					.order('created_at', { ascending: false }),

				// Load memo's tag associations
				supabase.from('memo_tags').select('tag_id').eq('memo_id', id),
			]);

			if (tagsResult.error) {
				console.error('Error loading tags:', tagsResult.error);
				return;
			}

			if (memoTagsResult.error) {
				console.error('Error loading memo tags:', memoTagsResult.error);
				return;
			}

			// Convert tags to TagItems
			const items = (tagsResult.data || []).map(convertTagToTagItem);
			setTagItems(items);

			// Extract tag IDs
			const tagIds = (memoTagsResult.data || []).map((item) => item.tag_id);
			setSelectedTagIds(tagIds);
		} catch (error) {
			console.error('Error loading tags:', error);
		} finally {
			setIsTagsLoading(false);
		}
	}, [isValidId, id, convertTagToTagItem]);

	// Event listeners for tag changes (no initial load needed - handled in main effect)
	useEffect(() => {
		// Event-Listener für Tag-Änderungen einrichten
		const tagPinnedUnsubscribe = tagEvents.onTagPinned(({ tagId, isPinned }) => {
			debug('Memo detail page: Tag pinned event received', { tagId, isPinned });
			// Tags neu laden, um die neue Reihenfolge zu berücksichtigen
			loadTags();
		});

		const tagOrderChangedUnsubscribe = tagEvents.onTagOrderChanged(({ reorderedTagIds }) => {
			debug('Memo detail page: Tag order changed event received', { reorderedTagIds });
			// Tags neu laden, um die neue Reihenfolge zu berücksichtigen
			loadTags();
		});

		const tagCreatedUnsubscribe = tagEvents.onTagCreated(({ tagId, tag }) => {
			debug('Memo detail page: Tag created event received', { tagId, tag });
			// Tags neu laden, um den neuen Tag anzuzeigen
			loadTags();
		});

		// Cleanup beim Unmounten
		return () => {
			tagPinnedUnsubscribe();
			tagOrderChangedUnsubscribe();
			tagCreatedUnsubscribe();
		};
	}, [loadTags]);

	// Handler für Tag-Auswahl
	const handleTagSelect = async (tagId: string) => {
		try {
			const supabase = await getAuthenticatedClient();
			const isSelected = selectedTagIds.includes(tagId);

			// Optimistische Aktualisierung
			if (isSelected) {
				// Tag lokal entfernen
				setSelectedTagIds((prevIds) => prevIds.filter((id) => id !== tagId));

				// Tag aus der Datenbank entfernen
				await supabase.from('memo_tags').delete().eq('memo_id', id).eq('tag_id', tagId);

				// Event emittieren für andere Komponenten
				tagEvents.emitTagRemoved(id!, tagId);
			} else {
				// Tag lokal hinzufügen
				setSelectedTagIds((prevIds) => [...prevIds, tagId]);

				// Tag zur Datenbank hinzufügen
				await supabase.rpc('add_tag_to_memo', {
					p_memo_id: id,
					p_tag_id: tagId,
				});

				// Event emittieren für andere Komponenten
				tagEvents.emitTagAdded(id!, tagId);
			}
		} catch (error) {
			console.error('Fehler bei der Tag-Auswahl:', error);
			// Bei Fehler Tags neu laden
			loadTags();
		}
	};

	// Handler für Tag-Erstellung
	const handleCreateTag = async (name: string, color: string) => {
		try {
			setIsTagsLoading(true);
			const supabase = await getAuthenticatedClient();

			// Neuen Tag in der Datenbank erstellen
			const { data, error } = await supabase
				.from('tags')
				.insert({
					name: name,
					style: { color },
					user_id: user?.id,
				})
				.select()
				.single();

			if (error) {
				console.error('Fehler beim Erstellen des Tags:', error);
				return;
			}

			// Tags neu laden
			await loadTags();
		} catch (error) {
			console.error('Fehler bei der Tag-Erstellung:', error);
		} finally {
			setIsTagsLoading(false);
		}
	};

	// Tag-Selector Handler
	const handleOpenTagSelector = () => {
		modalHandlers.openTagSelector();
	};

	const handleCloseTagSelector = () => {
		modalHandlers.closeTagSelector();
	};

	// Handler für den Klick auf "Add Tag" in der TagList
	const handleAddTagPress = () => {
		handleOpenTagSelector();
	};

	// Load memo data when component mounts or ID changes
	useEffect(() => {
		if (isValidId) {
			debug('MemoPage: Loading memo data for ID:', id);

			// Track memo viewed
			track('memo_viewed', {
				memo_id: id,
				source: 'direct_navigation',
				is_translated: !!translated,
			});

			// Load memo data and tags in parallel for better performance
			const startTime = Date.now();
			Promise.all([
				loadMemoData(id),
				loadTags(),
				// Add photo loading here if needed
			])
				.then(() => {
					const loadTime = Date.now() - startTime;
					debug(`MemoPage: All data loaded in ${loadTime}ms`);

					// Track performance metric
					trackPerformance(track, 'memo_load_time', loadTime, {
						memo_id: id,
					});
				})
				.catch((error) => {
					debug('MemoPage: Error loading data:', error);
					trackError(track, error, {
						screen: 'memo_detail',
						action: 'load_memo_data',
						memo_id: id,
					});
				});
		} else if (id !== undefined) {
			// ID is present but invalid
			console.error('MemoPage: Invalid memo ID:', id);
			Alert.alert(t('common.error', 'Fehler'), t('memo.invalid_id', 'Ungültige Memo-ID.'));
			router.back();
		}
	}, [id, isValidId, track, translated]);

	// Create refs for functions that don't need to trigger re-subscriptions
	const showSuccessRef = useRef(showSuccess);
	const tRef = useRef(t);

	// Update refs when functions change
	useEffect(() => {
		showSuccessRef.current = showSuccess;
		tRef.current = t;
	}, [showSuccess, t]);

	// Stable callback for real-time updates
	const handleRealtimeUpdate = useCallback(
		(payload: any) => {
			if (payload.event === 'UPDATE' && payload.new) {
				debug('MemoPage: Received real-time update for memo:', payload.new.id);

				// Check if additional_recordings were updated
				const oldRecordings = payload.old?.source?.additional_recordings || [];
				const newRecordings = payload.new?.source?.additional_recordings || [];

				if (
					newRecordings.length !== oldRecordings.length ||
					JSON.stringify(newRecordings) !== JSON.stringify(oldRecordings)
				) {
					debug('MemoPage: Additional recordings updated, refreshing memo data');

					// Update the memo state with the new data
					setMemo(payload.new);

					// Find the latest recording that was just completed
					const latestRecording = newRecordings[newRecordings.length - 1];
					if (latestRecording?.status === 'completed') {
						// Use ref to access current value without causing re-subscription
						showSuccessRef.current(
							tRef.current(
								'memo.additional_recording_completed',
								'Zusätzliche Aufnahme erfolgreich transkribiert!'
							)
						);
					}
				} else {
					// Update memo for any other changes
					setMemo(payload.new);
				}
			}
		},
		[setMemo]
	); // Only depend on setMemo which is stable

	// Subscribe to real-time updates for this memo
	// The hook internally handles callback stability, so we don't need to pass deps
	useMemoUpdates(isValidId ? id : null, handleRealtimeUpdate);

	// Navigate back if memo is not found (cleared by error handler)
	useEffect(() => {
		// Give the loading state and retries more time to resolve
		const timer = setTimeout(() => {
			if (!loadingStates.memo && !memo && isValidId) {
				debug('MemoPage: Memo not found after 3s, navigating back');
				router.back();
			}
		}, 3000); // Increased from 1000ms to 3000ms to allow for retries

		return () => clearTimeout(timer);
	}, [memo, loadingStates.memo, isValidId]);

	// Show success toast if this is a translated memo (only once)
	useEffect(() => {
		if (translated === 'true' && !translationToastShown) {
			setTranslationToastShown(true);
			// Small delay to ensure the page is loaded
			const timer = setTimeout(() => {
				showSuccess(t('memo.translated_success', 'Memo erfolgreich übersetzt!'));
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [translated, translationToastShown, showSuccess]);

	// Show onboarding toast for memo detail page
	useEffect(() => {
		if (memo && !loadingStates.memo) {
			// Small delay to ensure the page is fully loaded
			const timer = setTimeout(() => {
				showPageOnboardingToast('memo_detail');
			}, DEBOUNCE_DELAYS.SLOW);

			return () => clearTimeout(timer);
		}
	}, [memo, loadingStates.memo, showPageOnboardingToast]);

	// Keyboard height tracking nur für PromptBar
	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
			setKeyboardHeight(e.endCoordinates.height);
		});
		const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
			setKeyboardHeight(0);
		});

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	// Handler für den Share-Button im Header
	const handleSharePress = useCallback(() => {
		debug('Share pressed');
		track('memo_shared', {
			memo_id: id,
			has_transcript: !!memo?.transcript || !!memo?.utterances,
			has_memories: memories?.length > 0,
		});
		modalHandlers.openShareModal();
	}, [modalHandlers, id, memo, memories, track]);

	// Zugriff auf den zentralisierten Recording Store
	const { startRecording, setRecordingInfo } = useRecordingStore();

	// Zugriff auf den Header-Context
	const { updateConfig } = useHeader();

	// Handler für den Aufnahme-Button im Header
	const handleAddRecording = useCallback(() => {
		debug('Neue Aufnahme zu Memo hinzufügen:', id);
		// Setze Aufnahme-Informationen und starte die Aufnahme direkt
		// Wichtig: Wir übergeben die memoId, damit die Aufnahme später diesem Memo zugeordnet werden kann
		setRecordingInfo({
			title: `${memo?.title || 'Memo'} - Zusatz`,
			spaceId: useSpaceStore.getState().currentSpaceId,
			blueprintId: null,
			memoId: id, // Die ID des aktuellen Memos für die Zuordnung
		});
		startRecording();
	}, [id, memo, setRecordingInfo, startRecording]);

	// Handler für das Ende der Aufnahme (wird vom RecordingStore aufgerufen)
	const handleRecordingComplete = useCallback(
		async (
			result: string,
			title?: string,
			spaceId?: string | null,
			blueprintId?: string | null,
			memoId?: string | null
		) => {
			debug('Aufnahme abgeschlossen:', { result, title, memoId: id, spaceId, blueprintId });

			// Hier folgt die Logik, um die neue Aufnahme direkt im source-Feld des bestehenden Memos zu speichern
			if (id && result && memo) {
				try {
					// Zeige Lade-Indikator
					updateLoadingState('critical', true);

					// Hole den authentifizierten Supabase-Client
					const supabase = await getAuthenticatedClient();

					// Aktualisiere das bestehende Memo mit der neuen Aufnahme
					// Wir fügen die neue Aufnahme direkt im source-Feld hinzu
					const updatedSource = {
						...memo.source,
						// Wenn es bereits ein additional_recordings-Array gibt, fügen wir die neue Aufnahme hinzu
						// Ansonsten erstellen wir ein neues Array mit der neuen Aufnahme
						additional_recordings: [
							...(memo.source?.additional_recordings || []),
							{
								path: result,
								type: 'audio',
								timestamp: new Date().toISOString(),
								status: 'processing',
							},
						],
					};

					// Aktualisiere das Memo in der Datenbank
					const { error: updateError } = await supabase
						.from('memos')
						.update({
							source: updatedSource,
							updated_at: new Date().toISOString(),
						})
						.eq('id', id);

					if (updateError) {
						debug('Fehler beim Aktualisieren des Memos:', updateError.message);
						Alert.alert(
							t('common.error', 'Fehler'),
							t('memo.recording_save_error', 'Die Aufnahme konnte nicht gespeichert werden.')
						);
						return;
					}

					debug('Memo erfolgreich mit neuer Aufnahme aktualisiert');

					// Rufe die spezielle Append-Transkriptions-Edge-Function auf
					let transcriptionResponse: Response | undefined;
					try {
						// Berechne den Index der neuen Aufnahme
						const recordingIndex = (memo.source?.additional_recordings?.length || 0) - 1;

						// Verwende die fetch API direkt, um die Edge Function aufzurufen
						// Wir verwenden die neue append-transcription Funktion, die speziell für diesen Fall optimiert ist
						const token = await tokenManager.getValidToken();

						if (!token) {
							throw new Error('Kein gültiges Auth-Token gefunden');
						}

						// Get recording languages from AsyncStorage
						let recordingLanguages = ['auto'];
						try {
							const stored = await AsyncStorage.getItem('memoro_recording_languages');
							if (stored) {
								recordingLanguages = JSON.parse(stored);
							}
						} catch (error) {
							debug('Error loading recording languages, using default:', error);
						}

						// Get the memoro service URL
						const memoroServiceUrl = (
							process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL || 'http://localhost:3001'
						).replace(/\/$/, '');

						transcriptionResponse = await fetch(`${memoroServiceUrl}/memoro/append-transcription`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${token}`,
							},
							body: JSON.stringify({
								memoId: id, // Die ID des bestehenden Memos
								filePath: result, // Der Pfad zur hochgeladenen Datei
								duration: 0, // We don't have the actual duration here, backend will handle it
								recordingLanguages: recordingLanguages,
								enableDiarization: true, // Default to true for append recordings
								recordingIndex: recordingIndex, // Der Index der Aufnahme im additional_recordings Array
							}),
						});

						if (!transcriptionResponse.ok) {
							const errorText = await transcriptionResponse.text();
							debug('Fehler beim Aufrufen der Append-Transkriptionsfunktion:', {
								status: transcriptionResponse.status,
								statusText: transcriptionResponse.statusText,
								error: errorText,
							});

							// Don't handle 402 errors here - let the global interceptor handle them
							// The global interceptor will show the insufficient credits modal
						} else {
							debug('Append-Transkriptionsfunktion erfolgreich aufgerufen');
							const responseData = await transcriptionResponse.json();
							debug('Antwort der Append-Transkriptionsfunktion:', responseData);
						}
					} catch (functionError) {
						debug('Fehler beim Aufrufen der Transkriptionsfunktion:', functionError);
						// Wir zeigen keinen Fehler an, da die Aufnahme bereits gespeichert wurde
					}

					// Aktualisiere das lokale Memo mit der neuen Aufnahme
					setMemo({
						...memo,
						source: updatedSource,
					});

					// Erfolgsbenachrichtigung anzeigen (nur wenn keine Insufficient Credits)
					if (transcriptionResponse && transcriptionResponse.ok) {
						Alert.alert(
							t('common.success', 'Erfolg'),
							t(
								'memo.recording_added_success',
								'Die Aufnahme wurde erfolgreich hinzugefügt. Die Transkription wird in Kürze verfügbar sein.'
							)
						);
					}

					// Refresh credits after 3 seconds since transcription consumes credits
					setTimeout(() => {
						refreshCredits();
					}, 3000);
				} catch (error) {
					debug('Fehler bei der Verarbeitung der Aufnahme:', error);
					Alert.alert(
						t('common.error', 'Fehler'),
						t(
							'memo.recording_processing_error',
							'Bei der Verarbeitung der Aufnahme ist ein Fehler aufgetreten.'
						)
					);
				} finally {
					updateLoadingState('critical', false);
				}
			}
		},
		[id, memo]
	);

	const handleEditIconPress = useCallback(() => {
		handleEditStart();
	}, [handleEditStart]);

	const handleSaveEditWrapper = useCallback(async () => {
		if (id) {
			await handleSaveEdit(id);

			// Show success toast after saving
			showSuccess(t('memo.saved_success', 'Memo erfolgreich gespeichert!'));
		}
	}, [id, handleSaveEdit, showSuccess]);

	const handlePinPressWrapper = useCallback(async () => {
		if (id) {
			const wasPinnedBefore = isPinned;
			await handlePinToggle(id);

			// Track pin/unpin action
			track(wasPinnedBefore ? 'memo_unpinned' : 'memo_pinned', {
				memo_id: id,
			});

			// Show success toast after pin toggle
			if (wasPinnedBefore) {
				showSuccess(t('memo.unpinned_success', 'Memo erfolgreich abgeheftet!'));
			} else {
				showSuccess(t('memo.pinned_success', 'Memo erfolgreich angeheftet!'));
			}
		}
	}, [id, handlePinToggle, isPinned, showSuccess, track]);

	const handleEditPress = useCallback(() => {
		debug('Memo bearbeiten:', id);
		if (memo) {
			setEditTitle(memo.title || '');
			setEditIntro(memo.intro || '');
			handleEditStart(); // Using the function from useMemoState hook
		}
	}, [id, memo, setEditTitle, setEditIntro, handleEditStart]);

	const handleDeletePress = useCallback(async () => {
		track('memo_deleted', {
			memo_id: id,
			has_transcript: !!memo?.transcript || !!memo?.utterances,
			duration_seconds: memo?.source?.duration,
		});

		await handleDeleteMemo({
			memoId: id,
			memo,
			updateLoadingState,
			showSuccess,
			t,
			onSuccess: () => router.back(),
		});
	}, [id, memo, updateLoadingState, showSuccess, t, track]);

	const handleCopyTranscriptPress = async () => {
		track('transcript_copied', {
			memo_id: id,
			transcript_length: getTranscriptText(memo)?.length || 0,
		});
		debug('Transkript kopieren:', id);

		try {
			// Get the transcript text from memoizedTranscriptData
			const transcriptText = memoizedTranscriptData?.transcript;

			if (!transcriptText) {
				// Show error if no transcript available
				Alert.alert(
					t('common.error', 'Fehler'),
					t('memo.no_transcript_available', 'Kein Transkript verfügbar.')
				);
				return;
			}

			// Copy to clipboard
			await Clipboard.setStringAsync(transcriptText);

			// Show success toast only after successful copy
			showSuccess(t('memo.transcript_copied_success', 'Transkript erfolgreich kopiert!'));
		} catch (error) {
			debug('Fehler beim Kopieren des Transkripts:', error);
			Alert.alert(
				t('common.error', 'Fehler'),
				t('memo.copy_error', 'Das Transkript konnte nicht kopiert werden.')
			);
		}
	};

	const handleManageSpacesPress = () => {
		debug('Managing spaces for memo:', id);
		modalHandlers.openSpaceSelector();
	};

	const handleReplaceWordPress = () => {
		debug('Opening replace word modal for memo:', id);
		setWordToReplace('');
		setReplacementWord('');
		modalHandlers.openReplaceWord();
	};

	/**
	 * Sammelt alle Sprecher-IDs aus dem Memo, sowohl aus dem Haupttranskript als auch aus additional_recordings
	 */

	// Translate functionality
	const handleTranslatePress = () => {
		debug('Opening translate modal for memo:', id);
		setIsTranslateModalVisible(true);
	};

	const handleReprocessPress = () => {
		debug('Opening reprocess modal for memo:', id);
		setIsReprocessModalVisible(true);
	};

	const handleReprocess = async (
		language?: string,
		blueprint?: any,
		recordingDate?: Date
	): Promise<void> => {
		if (!memo || isReprocessing) {
			return;
		}

		setIsReprocessing(true);
		try {
			await handleReprocessMemo({
				memoId: id,
				memo,
				language,
				blueprint,
				recordingDate,
				updateLoadingState,
				showSuccess,
				t,
				refreshCredits,
				loadMemoData,
			});
		} finally {
			setIsReprocessing(false);
		}
	};

	// Refs for scroll targets
	const titleRef = React.useRef<View>(null);
	const audioRef = React.useRef<View>(null);
	const transcriptRef = React.useRef<View>(null);

	// Create a local ref that we control
	const localScrollRef = React.useRef<ScrollView>(null);

	// Track if component is mounted
	const isMountedRef = React.useRef(false);

	React.useEffect(() => {
		isMountedRef.current = true;
		console.log('Component mounted, isMountedRef set to true');

		return () => {
			isMountedRef.current = false;
			console.log('Component unmounting');
		};
	}, []);

	// Sync local ref to both scrollViewRef and globalScrollRef
	React.useLayoutEffect(() => {
		if (localScrollRef.current) {
			if (scrollViewRef) {
				scrollViewRef.current = localScrollRef.current;
			}
			(globalScrollRef as any).current = localScrollRef.current;
			console.log('Synced localScrollRef to scrollViewRef and globalScrollRef');
		}
	});

	// Table of Contents scroll functions using scrollViewRef directly
	const scrollToTop = useCallback(() => {
		console.log('scrollToTop called');
		console.log('scrollViewRef.current:', scrollViewRef.current);
		console.log('localScrollRef.current:', localScrollRef.current);

		// Try localScrollRef first, then scrollViewRef
		const ref = localScrollRef.current || scrollViewRef.current;

		if (ref) {
			console.log(
				'Using ref:',
				ref === localScrollRef.current ? 'localScrollRef' : 'scrollViewRef'
			);
			ref.scrollTo({ y: 0, animated: true });
		} else {
			console.log('ERROR: Both refs are null in scrollToTop');
		}
	}, [scrollViewRef]);

	// Memoized scroll position calculation with better estimates
	const calculateScrollPosition = React.useCallback(
		(memoryIndex: number, sectionType: 'memory' | 'audio' | 'transcript') => {
			// More accurate height estimates based on actual component sizes
			const headerHeight = 400; // MemoHeader with tags, buttons etc
			const memoryItemHeight = 250; // Memory component expanded height
			const audioSectionHeight = 200; // Audio player section
			const buttonRowHeight = 80; // Action buttons row

			switch (sectionType) {
				case 'memory':
					// Scroll to specific memory: header + buttons + previous memories
					return headerHeight + buttonRowHeight + memoryIndex * memoryItemHeight;
				case 'audio':
					// Scroll to audio: header + buttons + all memories + spacing
					return headerHeight + buttonRowHeight + (memories?.length || 0) * memoryItemHeight + 50;
				case 'transcript':
					// Scroll to transcript: header + buttons + all memories + audio section
					return (
						headerHeight +
						buttonRowHeight +
						(memories?.length || 0) * memoryItemHeight +
						audioSectionHeight +
						50
					);
				default:
					return 0;
			}
		},
		[memories?.length]
	);

	const scrollToMemoryByIndex = useCallback(
		(memoryIndex: number) => {
			console.log('scrollToMemoryByIndex called with index:', memoryIndex);
			console.log('Total memories:', memories?.length);
			console.log('scrollViewRef.current:', scrollViewRef.current);
			console.log('localScrollRef.current:', localScrollRef.current);

			// Calculate estimated position for memory
			const estimatedPosition = calculateScrollPosition(memoryIndex, 'memory');
			console.log('Scrolling to estimated position:', estimatedPosition);

			// Try localScrollRef first, then scrollViewRef
			const ref = localScrollRef.current || scrollViewRef.current;

			if (ref) {
				console.log(
					'Using ref:',
					ref === localScrollRef.current ? 'localScrollRef' : 'scrollViewRef'
				);
				ref.scrollTo({ y: estimatedPosition, animated: true });
				console.log('Scroll command sent');
			} else {
				console.log('ERROR: Both refs are null!');
			}
		},
		[calculateScrollPosition, memories?.length, scrollViewRef]
	);

	const scrollToAudio = useCallback(() => {
		console.log('scrollToAudio called');
		console.log('scrollViewRef.current:', scrollViewRef.current);
		console.log('localScrollRef.current:', localScrollRef.current);

		const estimatedPosition = calculateScrollPosition(0, 'audio');
		console.log('Scrolling to audio at position:', estimatedPosition);

		// Try localScrollRef first, then scrollViewRef
		const ref = localScrollRef.current || scrollViewRef.current;

		if (ref) {
			console.log(
				'Using ref:',
				ref === localScrollRef.current ? 'localScrollRef' : 'scrollViewRef'
			);
			ref.scrollTo({ y: estimatedPosition, animated: true });
		} else {
			console.log('ERROR: Both refs are null in scrollToAudio');
		}
	}, [calculateScrollPosition, scrollViewRef]);

	const scrollToTranscript = useCallback(() => {
		console.log('scrollToTranscript called');
		console.log('scrollViewRef.current:', scrollViewRef.current);
		console.log('localScrollRef.current:', localScrollRef.current);
		console.log('globalScrollRef.current:', globalScrollRef.current);

		const estimatedPosition = calculateScrollPosition(0, 'transcript');
		console.log('Scrolling to transcript at position:', estimatedPosition);

		// Try all three refs
		const ref = localScrollRef.current || globalScrollRef.current || scrollViewRef.current;

		if (ref && ref.scrollTo) {
			const refName =
				ref === localScrollRef.current
					? 'localScrollRef'
					: ref === globalScrollRef.current
						? 'globalScrollRef'
						: 'scrollViewRef';
			console.log('Using ref:', refName);
			try {
				ref.scrollTo({ y: estimatedPosition, animated: true });
				console.log('Scroll command executed successfully');
			} catch (error) {
				console.log('Error scrolling:', error);
			}
		} else {
			console.log('ERROR: All refs are null in scrollToTranscript');
		}
	}, [calculateScrollPosition, scrollViewRef]);

	// Create table of contents items - don't memoize to ensure fresh refs
	const tableOfContentsItems = React.useMemo(() => {
		const items = [
			{
				id: 'title',
				title: t('memo.toc_title', 'Titel'),
				icon: 'text-outline',
				onPress: () => {
					console.log('Title pressed, calling scrollToTop');
					scrollToTop();
				},
			},
		];

		// Add individual memory items instead of grouped section
		if (memories && Array.isArray(memories) && memories.length > 0) {
			memories.forEach((memory, index) => {
				items.push({
					id: `memory-${memory.id}`,
					title: memory.title || t('memo.memory_untitled', `Memory ${index + 1}`),
					icon: 'reader-outline',
					onPress: () => {
						console.log(`Memory ${index} pressed, calling scrollToMemoryByIndex`);
						scrollToMemoryByIndex(index);
					},
				});
			});
		}

		// Always add audio section
		items.push({
			id: 'audio',
			title: t('memo.toc_audio', 'Audio'),
			icon: 'play-outline',
			onPress: () => {
				console.log('Audio pressed, calling scrollToAudio');
				scrollToAudio();
			},
		});

		// Always add transcript section
		items.push({
			id: 'transcript',
			title: t('memo.toc_transcript', 'Transkript'),
			icon: 'document-outline',
			onPress: () => {
				console.log('Transcript pressed, calling scrollToTranscript');
				scrollToTranscript();
			},
		});

		return items;
	}, [memories, t, scrollToMemoryByIndex, scrollToAudio, scrollToTranscript, scrollToTop]);

	const handleTranslateConfirm = async (targetLanguage: string) => {
		if (!isValidId) {
			debug('No memo ID available for translation');
			return false;
		}

		setIsTranslating(true);
		setIsTranslateModalVisible(false); // Close modal immediately

		const success = await handleTranslateMemo({
			memoId: id,
			targetLanguage,
			t,
			onSuccess: (newMemoId) => {
				setIsTranslating(false);
				router.replace(`/(protected)/(memo)/${newMemoId}?translated=true`);
			},
		});

		if (!success) {
			setIsTranslating(false);
		}

		return success;
	};

	const handleTranslateCancel = () => {
		setIsTranslateModalVisible(false);
	};

	// Note: handleUpdateSpeakerLabels is now provided by the useSpeakerLabels hook

	// Wrapper for word replacement with parameters
	const handleReplaceWordInMemoWrapper = async (wordToReplace: string, replacementWord: string) => {
		await handleReplaceWordInMemo({
			memo,
			memories,
			wordToReplace,
			replacementWord,
			updateLoadingState,
			setMemo,
			setMemories,
			showSuccess,
			t,
		});
	};

	// Handler für die Zusammenfassungserstellung
	const handleCreateSummary = async () => {
		if (!memo?.id || !memo.source?.content) {
			setSummaryError('Kein Transkript vorhanden');
			return;
		}

		try {
			setIsGeneratingSummary(true);
			setSummaryError(null);

			// Note: Summary service has been removed
			setSummaryError('Zusammenfassungsfunktion ist derzeit nicht verfügbar');
		} catch (error) {
			debug('Error generating summary:', error);
			setSummaryError('Fehler bei der Erstellung der Zusammenfassung');
		} finally {
			setIsGeneratingSummary(false);
		}
	};

	// Handler for question submission
	const handleQuestionSubmit = async (question: string) => {
		await handleQuestionMemo({
			memoId: memo?.id,
			question,
			updateLoadingState,
			setMemories,
			showSuccess,
			t,
			refreshCredits,
			scrollToMemories: () => {
				scrollViewRef.current?.scrollTo({
					y: 400,
					animated: true,
				});
			},
		});
	};

	// Check if memo has structured transcript data
	const hasStructuredTranscript =
		!!(memo?.source?.speakers && Object.keys(memo.source.speakers).length > 0) ||
		!!memo?.source?.additional_recordings?.some(
			(recording) => recording.speakers && Object.keys(recording.speakers).length > 0
		);

	// Note: Header title visibility is now handled in the throttled scroll handler

	// Get page background color from tailwind config - memoized for performance
	const pageBackgroundColor = useMemo(() => {
		try {
			const tailwindConfig = require('~/tailwind.config.js');
			const colors = tailwindConfig.theme.extend.colors;

			if (isDark) {
				return colors.dark[themeVariant].contentPageBackground || '#121212';
			} else {
				return colors[themeVariant].contentPageBackground || '#FFFFFF';
			}
		} catch (error) {
			console.warn('Failed to get contentPageBackground from tailwind config, using fallback');
			return isDark ? '#121212' : '#FFFFFF';
		}
	}, [isDark, themeVariant]);

	// Aktualisiere die Header-Konfiguration, wenn die Komponente geladen wird
	useEffect(() => {
		// Nur Header-Konfiguration aktualisieren, wenn das Memo tatsächlich geladen ist
		if (memo?.title) {
			updateConfig({
				title: memo.title, // Use actual memo title only when loaded
				showTitle: showHeaderTitle, // Control visibility with showTitle prop
				showBackButton: true,
				rightIcons: [], // Remove all right icons since they're now in the bottom bar
				scrollableTitle: true, // Enable horizontal scrolling for long titles
				backgroundColor: pageBackgroundColor, // Use contentPageBackground for header on this page
			});
		} else {
			// Wenn das Memo noch nicht geladen ist, nur die anderen Eigenschaften setzen
			updateConfig({
				title: '', // Leerer Titel um Flackern zu vermeiden
				showTitle: false, // Titel nicht anzeigen bis Memo geladen ist
				showBackButton: true,
				rightIcons: [],
				scrollableTitle: true,
				backgroundColor: pageBackgroundColor, // Use contentPageBackground for header on this page
			});
		}

		// Keine Cleanup-Funktion - andere Seiten setzen ihre eigene Header-Konfiguration
		// Das verhindert das Aufblitzen beim Zurücknavigieren
	}, [id, isPinned, memo?.title, showHeaderTitle, pageBackgroundColor, isDark, themeVariant]);

	// Styles
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: pageBackgroundColor,
			position: 'relative',
		},
		// editToolbarContainer removed - now using inline styles with keyboard height
		contentContainer: {
			flex: 1,
			backgroundColor: pageBackgroundColor,
		},
		scrollContentContainer: {
			paddingBottom: 32,
		},
		content: {
			flex: 1,
			paddingTop: 8,
			paddingBottom: 20,
			paddingHorizontal: 20,
			maxWidth: 760, // 720px content + 40px margins
			alignSelf: 'center',
			width: '100%',
		},
		loadingContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 20,
		},
		loadingText: {
			fontSize: 16,
			color: isDark ? '#FFFFFF' : '#000000',
		},
		errorContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 20,
		},
		errorText: {
			fontSize: 16,
			color: isDark ? '#FFFFFF' : '#000000',
			textAlign: 'center',
		},
		sectionTitle: {
			fontSize: 18,
			fontWeight: 'bold',
			marginTop: 32,
			marginBottom: 16,
			color: isDark ? '#FFFFFF' : '#000000',
			borderBottomWidth: 1,
			borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
			paddingBottom: 8,
		},
		questionButtonContainer: {
			width: '100%',
			paddingHorizontal: 20,
			marginBottom: 12,
		},
		transcriptContainer: {
			marginBottom: 20,
			// marginHorizontal entfernt - Spacing wird intern in TranscriptDisplay gehandhabt
		},
		photoGalleryContainer: {
			marginBottom: 20,
			marginHorizontal: 20,
			maxWidth: 760, // 720px content + 40px margins
			alignSelf: 'center',
			width: '100%',
		},
		promptBarContainer: {
			width: '100%',
		},
		contentPadding: {
			paddingBottom: 70, // Add padding to account for the PromptBar height
		},
		// Modal Styles
		modalOverlay: {
			flex: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.7)',
			justifyContent: 'center',
			alignItems: 'center',
		},
		modalContent: {
			width: '90%',
			maxWidth: 400,
			backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
			borderRadius: 16,
			padding: 24,
			alignItems: 'center',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5,
		},
		closeButton: {
			position: 'absolute',
			top: 12,
			right: 12,
			padding: 8,
			zIndex: 10,
		},
		modalTitle: {
			fontSize: 20,
			fontWeight: 'bold',
			marginBottom: 8,
			color: isDark ? '#FFFFFF' : '#000000',
			textAlign: 'center',
		},
		modalSubtitle: {
			fontSize: 16,
			marginBottom: 24,
			color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
			textAlign: 'center',
		},
		recordingButtonContainer: {
			marginVertical: 24,
			alignItems: 'center',
		},
		locationContainer: {
			marginHorizontal: 20,
			marginBottom: 16,
		},
		tagListContainer: {
			marginBottom: 24,
		},
		actionButtonsContainer: {
			marginBottom: 16,
			maxWidth: 760, // 720px content + 40px margins
			alignSelf: 'center',
			width: '100%',
		},
		actionButtonsScrollContainer: {
			paddingHorizontal: 20,
			paddingRight: 20,
			gap: 12,
		},
		actionButton: {
			minWidth: 120,
			height: 40,
		},
	});

	// Register Edit Toolbar via BottomBar system
	const editToolbarContent = useMemo(
		() => (
			<Toolbar
				position="bottom"
				layout="row"
				onSave={handleSaveEditWrapper}
				onCancel={handleCancelEdit}
			/>
		),
		[handleSaveEditWrapper, handleCancelEdit]
	);

	useBottomBar(
		isEditMode
			? {
					id: 'memo-edit-toolbar',
					priority: 30,
					collapsedIcon: 'create-outline',
					collapsible: false,
					keyboardBehavior: 'dodge',
					content: editToolbarContent,
				}
			: null
	);

	// Register PromptBar via BottomBar system
	const promptBarContent = useMemo(
		() => (
			<PromptBar
				onSubmit={async (prompt) => {
					debug('Prompt submitted:', prompt);
					await handleQuestionSubmit(prompt);
					setPromptValue('');
					setShowPromptBar(false);
					setPromptInputFocus(false);
				}}
				placeholder={
					loadingStates.question
						? t('memo.generating_answer', 'Antwort wird generiert...')
						: t('memo.question_placeholder', 'Frage zu diesem Memo stellen...')
				}
				disabled={loadingStates.memo || !memo}
				initialValue={promptValue}
				autoFocus={promptInputFocus}
				inputRef={promptInputRef}
				isLoading={loadingStates.question}
				loadingText={t(
					'memo.processing_transcript',
					'Analysiere Transkript und erstelle Antwort...'
				)}
				onClose={() => {
					setShowPromptBar(false);
					setPromptInputFocus(false);
				}}
				showCloseButton={true}
				manaCost={creditService.getOperationCostSync('QUESTION_MEMO')}
				manaCostLabel={t('memo.mana_per_question', 'Mana pro Frage')}
			/>
		),
		[
			loadingStates.question,
			loadingStates.memo,
			memo,
			promptValue,
			promptInputFocus,
			t,
			handleQuestionSubmit,
		]
	);

	useBottomBar(
		showPromptBar
			? {
					id: 'memo-prompt-bar',
					priority: 50,
					collapsedIcon: 'chatbubble-outline',
					collapsible: false,
					keyboardBehavior: 'dodge',
					content: promptBarContent,
				}
			: null
	);

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
			>
				<View style={styles.container}>
					<View style={styles.contentContainer}>
						<ScrollView
							ref={(ref) => {
								// Set all refs
								localScrollRef.current = ref;
								if (scrollViewRef) {
									scrollViewRef.current = ref;
								}
								(globalScrollRef as any).current = ref;

								if (ref) {
									console.log('All refs set successfully!');
								}
							}}
							onLayout={(event) => {
								// WORKAROUND: Set refs in onLayout since ref callback might not fire
								// Get the ScrollView instance from the event target
								const scrollView = event.target as any;
								if (scrollView && !localScrollRef.current) {
									console.log('Setting refs from onLayout (ref callback never fired!)');
									localScrollRef.current = scrollView;
									if (scrollViewRef) {
										scrollViewRef.current = scrollView;
									}
									(globalScrollRef as any).current = scrollView;
									console.log('All refs set from onLayout!');
								}
							}}
							onScroll={handleScroll}
							scrollEventThrottle={16}
							contentContainerStyle={[
								styles.scrollContentContainer,
								styles.contentPadding,
								{ paddingBottom: 120 }, // Add padding for bottom bar
								isSearchMode && { paddingBottom: 400 }, // Add padding when search is active
								isEditMode && keyboardHeight > 0 && { paddingBottom: keyboardHeight + 100 }, // Add padding when keyboard is visible in edit mode
								// Removed top padding as edit toolbar is now at bottom
							]}
						>
							{loadingStates.memo ? (
								<MemoDetailSkeleton />
							) : !memo ? (
								<View style={styles.errorContainer}>
									<Text style={styles.errorText}>
										{t('memo.could_not_load', 'Memo konnte nicht geladen werden.')}
									</Text>
								</View>
							) : (
								<>
									<MemoHeader
										memoId={id}
										title={
											isEditMode
												? editTitle
												: displayTitle || t('memo.unnamed_memo', 'Unbenanntes Memo')
										}
										intro={memo?.intro}
										timestamp={memo ? new Date(memo.created_at) : undefined}
										duration={
											memo?.metadata?.stats?.audioDuration ||
											memo?.source?.duration ||
											memo?.source?.duration_seconds
										}
										viewCount={memo?.metadata?.stats?.viewCount || 0}
										wordCount={memo?.metadata?.stats?.wordCount}
										location={memoLocation}
										language={memo?.source?.primary_language}
										speakerCount={
											memo?.source?.speakers ? Object.keys(memo.source.speakers).length : 0
										}
										isPinned={isPinned}
										isEditMode={isEditMode}
										editTitle={editTitle}
										editIntro={editIntro}
										onTitleChange={setEditTitle}
										onIntroChange={setEditIntro}
										onSave={handleSaveEditWrapper}
										onCancel={handleCancelEdit}
										tags={tagItems}
										selectedTagIds={selectedTagIds}
										onTagPress={handleTagSelect}
										onAddTagPress={handleOpenTagSelector}
										isSearchMode={isSearchMode}
										searchQuery={searchQuery}
										currentSearchIndex={currentSearchIndex}
										searchResults={searchResults}
										onPinPress={handlePinPressWrapper}
									/>

									{/* Horizontal Action Buttons */}
									<View style={styles.actionButtonsContainer}>
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={styles.actionButtonsScrollContainer}
										>
											<Button
												variant="secondary"
												title={t('memo.question_button', 'Question')}
												iconName="chatbubble-outline"
												onPress={() => {
													if (showPromptBar) {
														setShowPromptBar(false);
														setPromptInputFocus(false);
													} else {
														setShowPromptBar(true);
														setPromptInputFocus(true);
													}
												}}
												style={styles.actionButton}
											/>

											<Button
												variant="secondary"
												title={
													photosUploading
														? t('common.uploading', 'Hochladen...')
														: t('memo.add_photos_button', 'Fotos hinzufügen')
												}
												iconName="image-outline"
												onPress={() => selectAndUploadPhotos()}
												disabled={photosUploading}
												style={styles.actionButton}
											/>

											<Button
												variant="secondary"
												title={t('memo.create_memory', 'Create Memory')}
												iconName="reader-outline"
												onPress={() => setIsCreateMemoryModalVisible(true)}
												style={styles.actionButton}
											/>

											<Button
												variant="secondary"
												title={t('memo.translate_button', 'Translate')}
												iconName="globe-outline"
												onPress={handleTranslatePress}
												style={styles.actionButton}
											/>
										</ScrollView>
									</View>

									{/* Photo Gallery - Only show when photos exist */}
									{photos.length > 0 && (
										<View style={styles.photoGalleryContainer}>
											<PhotoGallery
												memoId={id!}
												photos={photos}
												onPhotoDelete={deletePhoto}
												onAddPhotoPress={() => selectAndUploadPhotos()}
												editable={!isEditMode}
												showAddButton={false}
												loading={photosUploading}
											/>
										</View>
									)}

									{/* Reprocess button removed as it's no longer needed with the new approach */}

									<View style={styles.content}>
										{/* Memories Component */}
										<MemoMemories
											memoId={id}
											memories={memories}
											setMemories={setMemories}
											isEditMode={isEditMode}
											searchQuery={searchQuery}
											isSearchMode={isSearchMode}
											currentSearchIndex={currentSearchIndex}
											searchResults={searchResults}
											onEditStart={handleEditStart}
											onCreateMemory={() => setIsCreateMemoryModalVisible(true)}
											updateLoadingState={updateLoadingState}
											loadingStates={loadingStates}
										/>
										{/* Audio Section */}
										<View ref={audioRef}>
											<MemoAudio
												memo={memo}
												audioUrl={audioUrl}
												isEditMode={isEditMode}
												onAddRecording={handleAddRecording}
												onTranscriptUpdate={setEditTranscript}
												formatDateTimeForAudio={formatDateTimeForAudioWithLang}
												getSignedUrl={getSignedUrl}
											/>
										</View>

										{/* Transcript Section */}
										<MemoTranscript
											memo={memo}
											memoId={id}
											transcriptData={memoizedTranscriptData}
											isEditMode={isEditMode}
											editTranscript={editTranscript}
											editUtterances={editUtterances}
											searchQuery={searchQuery}
											searchResults={searchResults}
											currentSearchIndex={currentSearchIndex}
											isSearchMode={isSearchMode}
											onTranscriptChange={setEditTranscript}
											onUtteranceChange={updateEditUtterance}
											onUpdateSpeakerLabels={handleUpdateSpeakerLabels}
											onNameSpeakersPress={modalHandlers.openSpeakerLabel}
											transcriptRef={transcriptRef}
											audioUrl={audioUrl}
											formatDateTimeForAudio={formatDateTimeForAudioWithLang}
										/>
									</View>
								</>
							)}
						</ScrollView>
					</View>

					{/* All Modals */}
					<MemoModals
						memo={memo}
						memories={memories}
						audioUrl={audioUrl}
						currentLanguage={currentLanguage}
						transcriptData={memoizedTranscriptData}
						isSpaceSelectorVisible={isSpaceSelectorVisible}
						isShareModalVisible={isShareModalVisible}
						isReplaceWordModalVisible={isReplaceWordModalVisible}
						isSpeakerLabelModalVisible={isSpeakerLabelModalVisible}
						isTagSelectorVisible={isTagSelectorVisible}
						isTranslateModalVisible={isTranslateModalVisible}
						isCreateMemoryModalVisible={isCreateMemoryModalVisible}
						isReprocessModalVisible={isReprocessModalVisible}
						onCloseSpaceSelector={modalHandlers.closeSpaceSelector}
						onCloseShareModal={modalHandlers.closeShareModal}
						onCloseReplaceWordModal={modalHandlers.closeReplaceWord}
						onCloseSpeakerLabelModal={modalHandlers.closeSpeakerLabel}
						onCloseTagSelector={handleCloseTagSelector}
						onCloseTranslateModal={handleTranslateCancel}
						onCloseCreateMemoryModal={() => setIsCreateMemoryModalVisible(false)}
						onCloseReprocessModal={() => setIsReprocessModalVisible(false)}
						onSpaceSelect={() => {
							debug('Spaces updated for memo:', memo?.id);
						}}
						onReplaceWord={handleReplaceWordInMemoWrapper}
						onUpdateSpeakerLabels={handleUpdateSpeakerLabels}
						onTagSelect={handleTagSelect}
						onCreateTag={handleCreateTag}
						onTranslateConfirm={handleTranslateConfirm}
						onMemoryCreated={() => {}}
						onReprocess={handleReprocess}
						wordToReplace={wordToReplace}
						replacementWord={replacementWord}
						setWordToReplace={setWordToReplace}
						setReplacementWord={setReplacementWord}
						speakerIds={getSpeakerIds()}
						speakerMappings={memo?.metadata?.speakerLabels || speakerMappings}
						tagItems={tagItems}
						selectedTagIds={selectedTagIds}
						isTagsLoading={isTagsLoading}
						isReprocessing={isReprocessing}
						scrollViewRef={scrollViewRef}
						loadMemoData={loadMemoData}
						currentSpaceId={useSpaceStore.getState().currentSpaceId || undefined}
					/>

					{/* Bottom Bar with Header Icons */}
					<MemoBottomBar
						backgroundColor={pageBackgroundColor}
						onShare={handleSharePress}
						onAddRecording={handleAddRecording}
						onEdit={handleEditPress}
						isPinned={isPinned}
						onPin={handlePinPressWrapper}
						onCopyTranscript={handleCopyTranscriptPress}
						onManageSpaces={handleManageSpacesPress}
						onReplaceWord={handleReplaceWordPress}
						onLabelSpeakers={handleLabelSpeakersPress}
						onSearch={() => useGlobalSearchStore.getState().toggleSearch()}
						onTranslate={handleTranslatePress}
						onAskQuestion={() => {
							if (showPromptBar) {
								setShowPromptBar(false);
								setPromptInputFocus(false);
							} else {
								setShowPromptBar(true);
								setPromptInputFocus(true);
							}
						}}
						isEditMode={isEditMode}
						onCreateMemory={() => setIsCreateMemoryModalVisible(true)}
						onAddPhoto={() => selectAndUploadPhotos()}
						onReprocess={handleReprocessPress}
						onDelete={handleDeletePress}
						hasStructuredTranscript={hasStructuredTranscript}
						tableOfContentsItems={tableOfContentsItems}
					/>

					{/* Critical Loading Overlay */}
					<LoadingOverlay
						visible={loadingStates.critical}
						message={t('memo.processing', 'Wird verarbeitet...')}
					/>

					{/* Translation Loading Overlay */}
					<LoadingOverlay
						visible={isTranslating}
						message={t('memo.translating', 'Memo wird übersetzt...')}
						modal={true}
					/>
				</View>
			</KeyboardAvoidingView>

			{/* Edit Toolbar now managed via useBottomBar */}

			{/* PromptBar now managed via useBottomBar */}
		</>
	);
}
