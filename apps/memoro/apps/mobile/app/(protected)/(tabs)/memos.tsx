import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { View, StyleSheet, Alert } from 'react-native';
import MemoList from '~/components/molecules/MemoList';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { useTheme } from '~/features/theme/ThemeProvider';
import tagEvents from '~/features/tags/tagEvents';
import * as DocumentPicker from 'expo-document-picker';
import { fileStorageService } from '~/features/storage/fileStorage.service';
import { useAuth } from '~/features/auth/contexts/AuthContext';
import { tokenManager } from '~/features/auth/services/tokenManager';
import { creditService } from '~/features/credits/creditService';
import { useCredits } from '~/features/credits/CreditContext';
import LoadingOverlay from '~/components/atoms/LoadingOverlay';
import { extractMediaDuration } from '~/utils/mediaUtils';
import colors from '~/tailwind.config.js';
import { useHeader } from '~/features/menus/HeaderContext';
import TagPillFilter from '~/features/tags/components/PillFilter';
import PillFilter from '~/components/molecules/PillFilter';
import { useSpaceContext } from '~/features/spaces';
import SpaceSelectorModal from '~/components/molecules/SpaceSelectorModal';
import TagSelectorModal from '~/features/tags/TagSelectorModal';
import CombineMemosModal from '~/components/molecules/CombineMemosModal';
import ShareModal from '~/components/molecules/ShareModal';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';
import { TIMEOUTS } from '~/utils/sharedConstants';
import { useToast } from '~/features/toast/contexts/ToastContext';
// InsufficientCreditsModal removed - using global interceptor in _layout.tsx
import UploadModal from '~/components/molecules/UploadModal';
import { useLanguage } from '~/features/i18n/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useSearchProvider, useGlobalSearchStore } from '~/features/search';
import Text from '~/components/atoms/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTranscriptText } from '~/features/memos/utils/transcriptUtils';
import { useAnalytics, useScreenTracking } from '~/features/analytics';
import { useBottomBar, useBottomBarInset } from '~/features/bottomBar';

// Tag-Schnittstelle entsprechend der Struktur in der Anwendung
interface TagModel {
	id: string;
	name: string;
	style: { color?: string; [key: string]: any };
	description?: { [key: string]: any };
	user_id: string;
	created_at: string;
	updated_at: string;
	is_pinned?: boolean;
	sort_order?: number;
}

// Vereinfachte Tag-Schnittstelle für die interne Verwendung
interface TagItem {
	id: string;
	text: string;
	color: string;
}

export default function Memos() {
	const { isDark, themeVariant, tw } = useTheme();
	const { t } = useTranslation();
	const { refreshCredits } = useCredits();
	const params = useLocalSearchParams<{
		autoUpload?: string;
		selectedTagIds?: string;
		openUploadModal?: string;
	}>();
	const { track } = useAnalytics();

	// Track screen view
	useScreenTracking('memos_list', {
		tab: 'memos',
		auto_upload: !!params.autoUpload,
	});

	// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
	const pageBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.pageBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.pageBackground;
	const [isUploading, setIsUploading] = useState(false);
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>([]);

	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [isTagSelectorVisible, setIsTagSelectorVisible] = useState(false);
	const [tags, setTags] = useState<TagModel[]>([]);
	const [tagItems, setTagItems] = useState<TagItem[]>([]);
	const [selectedTagForBulk, setSelectedTagForBulk] = useState<string | null>(null);
	const [isTagsLoading, setIsTagsLoading] = useState(false);
	const { user } = useAuth();
	const { spaces, linkMemoToSpace } = useSpaceContext();
	const { currentLanguage } = useLanguage();
	const [isSpaceSelectorVisible, setIsSpaceSelectorVisible] = useState(false);
	const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
	const [isCombineModalVisible, setIsCombineModalVisible] = useState(false);
	const [combiningMessage, setCombiningMessage] = useState('');
	const [isShareModalVisible, setIsShareModalVisible] = useState(false);
	const [selectedMemoForShare, setSelectedMemoForShare] = useState<any>(null);
	// Removed - using global insufficient credits interceptor
	const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

	// Search state
	const [isSearchVisible, setIsSearchVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [allMemos, setAllMemos] = useState<any[]>([]);
	const insets = useSafeAreaInsets();

	// Page onboarding
	const { showPageOnboardingToast, cleanupPageToast } = usePageOnboarding();
	const { showSuccess } = useToast();
	// const [promptValue, setPromptValue] = useState(''); // Entfernt

	// Handle audio file upload from modal
	const handleAudioUpload = async (
		file: any,
		language?: string,
		blueprint?: any,
		recordingDate?: Date,
		duration?: number
	) => {
		try {
			// Check if user is authenticated
			if (!user || !user.id) {
				Alert.alert('Fehler', 'Du musst angemeldet sein, um Audio-/Videodateien hochzuladen.');
				return;
			}

			if (!file) {
				Alert.alert('Fehler', 'Keine Datei ausgewählt.');
				return;
			}

			setIsUploading(true);
			setCombiningMessage(t('memos.status.uploading_file'));

			// Process the file with the selected settings
			await processUploadedFile(file, language, blueprint, recordingDate, duration);
		} catch (error: any) {
			console.debug('Error uploading audio:', error);
			// Don't check for 402 errors - let the global interceptor handle them
			Alert.alert('Fehler', 'Beim Hochladen der Datei ist ein Fehler aufgetreten.');
			setIsUploading(false);
			setCombiningMessage('');
		}
	};

	// Handle direct audio file upload (for autoUpload case)
	const handleDirectAudioUpload = async () => {
		try {
			// Check if user is authenticated
			if (!user || !user.id) {
				Alert.alert('Fehler', 'Du musst angemeldet sein, um Audio-/Videodateien hochzuladen.');
				return;
			}

			setIsUploading(true);

			// Pick an audio or video file
			const result = await DocumentPicker.getDocumentAsync({
				type: [
					// Audio formats
					'audio/mpeg',
					'audio/mp4',
					'audio/x-m4a',
					'audio/m4a',
					// Video formats
					'video/mp4',
					'video/quicktime',
					'video/x-m4v',
					'video/*',
				],
				copyToCacheDirectory: true,
			});

			// Check if the user canceled the picker
			if (result.canceled) {
				setIsUploading(false);
				return;
			}

			const file = result.assets[0];

			// Set upload message
			setCombiningMessage(t('memos.status.uploading_file'));

			// Process the file with default settings
			await processUploadedFile(file);
		} catch (error: any) {
			console.debug('Error uploading audio:', error);
			// Don't check for 402 errors - let the global interceptor handle them
			Alert.alert('Fehler', 'Beim Hochladen der Datei ist ein Fehler aufgetreten.');
			setIsUploading(false);
			setCombiningMessage('');
		}
	};

	// Helper function to prepare language codes for uploadForTranscription
	const mapLanguageToAzureLocales = async (language?: string): Promise<string[]> => {
		if (!language || language === 'auto') {
			return []; // Empty array for auto-detection
		}

		// Return the original language code, not the Azure locale
		// The fileStorage.service.ts will handle the mapping to Azure locales
		console.debug(`Using language code '${language}' for upload override`);
		return [language];
	};

	// Process uploaded file (shared logic)
	const processUploadedFile = async (
		file: any,
		language?: string,
		blueprint?: any,
		recordingDate?: Date,
		durationMillis?: number
	) => {
		try {
			console.debug('Selected file:', file.name, file.uri);
			console.debug('Language:', language, 'Blueprint:', blueprint);
			console.debug('Recording date:', recordingDate?.toISOString() || 'not provided');

			// Validate file type
			const fileExtension = file.name.split('.').pop()?.toLowerCase();
			const audioExtensions = ['mp3', 'm4a', 'wav', 'aac', 'flac', 'ogg', 'wma', 'opus'];
			const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp'];

			if (
				!fileExtension ||
				(!audioExtensions.includes(fileExtension) && !videoExtensions.includes(fileExtension))
			) {
				Alert.alert('Fehler', 'Bitte wähle eine gültige Audio- oder Videodatei aus.');
				setIsUploading(false);
				return;
			}

			const isVideo = videoExtensions.includes(fileExtension);

			// Use the duration passed from UploadModal, or extract it here if not provided
			let duration = durationMillis;
			if (!duration) {
				try {
					duration = await extractMediaDuration(file);
					console.log('Duration extracted:', duration, 'ms');
				} catch (error) {
					console.error('Failed to extract duration:', error);
					Alert.alert(
						'Error',
						'Media duration could not be determined. Please try a different file.',
						[{ text: 'OK' }]
					);
					setIsUploading(false);
					return;
				}
			}

			// Save audio file to local storage first
			const audioFile = await fileStorageService.saveRecording(file.uri, file.name);
			if (!audioFile) {
				Alert.alert('Fehler', 'Die Datei konnte nicht gespeichert werden.');
				setIsUploading(false);
				return;
			}

			// Set the extracted duration on the audioFile object (convert ms to seconds)
			audioFile.duration = Math.floor(duration / 1000);

			// Map the selected language to Azure locale codes
			const recordingLanguages = await mapLanguageToAzureLocales(language);
			console.debug('Using recording languages for upload:', recordingLanguages);

			// Use the uploadForTranscription method which handles both uploading and transcription
			const transcriptionResult = await fileStorageService.uploadForTranscription(
				audioFile,
				undefined, // memoId
				undefined, // spaceId
				blueprint?.id || null, // blueprintId
				recordingLanguages, // recordingLanguagesOverride
				recordingDate, // recordingStartedAt - pass the selected date/time
				undefined, // enableDiarization - use default
				undefined, // skipOfflineQueue - use default
				false, // appendToMemo
				isVideo ? 'video' : 'audio' // mediaType
			);

			console.debug('Transcription result:', transcriptionResult);

			if (transcriptionResult) {
				const successMessage = isVideo
					? 'Videodatei hochgeladen und wird transkribiert'
					: 'Audiodatei hochgeladen und wird transkribiert';
				showSuccess(successMessage);

				// Refresh credits after 3 seconds since transcription consumes credits
				setTimeout(() => {
					refreshCredits();
				}, 3000);
			} else {
				Alert.alert('Fehler', 'Beim Hochladen der Datei ist ein Fehler aufgetreten.');
			}
		} catch (error: any) {
			console.debug('Error processing uploaded file:', error);
			// Don't check for 402 errors - let the global interceptor handle them
			Alert.alert('Fehler', 'Beim Verarbeiten der Datei ist ein Fehler aufgetreten.');
		} finally {
			setIsUploading(false);
			setCombiningMessage('');
		}
	};

	// Auto-upload when navigated from menu
	useEffect(() => {
		if (params.autoUpload === 'true') {
			// Clear the parameter to prevent re-triggering
			router.replace('/(protected)/(tabs)/memos');
			// Trigger upload after a short delay to ensure UI is ready
			setTimeout(() => {
				handleDirectAudioUpload();
			}, 500);
		}
	}, [params.autoUpload]);

	// Open upload modal when navigated from header menu
	useEffect(() => {
		console.log('Memos: params changed', params);
		if (params.openUploadModal === 'true') {
			console.log('Memos: Opening upload modal from params');
			// Open upload modal after a short delay to ensure UI is ready
			setTimeout(() => {
				setIsUploadModalVisible(true);
				// Clear the parameter after opening modal to prevent re-triggering
				router.replace('/(protected)/(tabs)/memos');
			}, 500);
		}
	}, [params.openUploadModal]);

	// Auto-select tag when navigated from tags page
	useEffect(() => {
		if (params.selectedTagIds && tags.length > 0) {
			const tagId = params.selectedTagIds;
			// Check if the tag exists in the loaded tags
			const tagExists = tags.some((tag) => tag.id === tagId);

			if (tagExists && !selectedTagIds.includes(tagId)) {
				// Add this tag to the selected tags
				const newSelectedTagIds = [tagId];
				setSelectedTagIds(newSelectedTagIds);
				setRefreshTrigger((prev) => prev + 1);

				// Update header immediately with the selected tag
				updateHeaderWithSelectedTags(newSelectedTagIds);

				// Clear the parameter to prevent re-triggering
				router.replace('/(protected)/(tabs)/memos');
			}
		}
	}, [params.selectedTagIds, tags, selectedTagIds]);

	// Hilfsfunktion zum Konvertieren von Tags in TagItems
	const convertTagToTagItem = (tag: TagModel): TagItem => {
		// Verwende die Farbe direkt aus dem style-Objekt
		const tagColor = tag.style?.color || '#cccccc';

		return {
			id: tag.id,
			text: tag.name,
			color: tagColor,
		};
	};

	// Laden aller Tags
	const loadTags = async () => {
		try {
			setIsTagsLoading(true);
			// Authentifizierten Client holen
			const supabase = await getAuthenticatedClient();

			const { data, error } = await supabase
				.from('tags')
				.select('*')
				.order('is_pinned', { ascending: false })
				.order('sort_order', { ascending: true })
				.order('created_at', { ascending: false });

			if (error) {
				// Removed debug log for tag loading error
				throw error;
			}

			setTags(data || []);

			// Tags in TagItems konvertieren
			const items = (data || []).map(convertTagToTagItem);
			setTagItems(items);
		} catch (error) {
			console.debug('Fehler beim Laden der Tags:', error);
			Alert.alert('Fehler', 'Tags konnten nicht geladen werden.');
		} finally {
			setIsTagsLoading(false);
		}
	};

	// Tags beim ersten Laden abrufen
	useEffect(() => {
		loadTags();
	}, []);

	// Refresh memo list when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			// Don't automatically refresh when returning to the screen
			// This maintains scroll position when navigating back
			// Only refresh if there's a specific need (e.g., after recording)
		}, [])
	);

	// Handle tag selection für Filter
	const handleTagSelect = (tagIds: string[]) => {
		// Removed debug log for tag selection change
		setSelectedTagIds(tagIds);

		// Track filter applied
		track('memo_list_filtered', {
			filter_type: 'tags',
			tag_count: tagIds.length,
			tag_ids: tagIds,
		});

		// Trigger a refresh of the memo list when tag selection changes
		setRefreshTrigger((prev) => prev + 1);

		// Update header with selected tags
		updateHeaderWithSelectedTags(tagIds);
	};

	// Handle removing a tag from selection
	const handleTagRemove = (tagId: string) => {
		const updatedTagIds = selectedTagIds.filter((id) => id !== tagId);
		setSelectedTagIds(updatedTagIds);
		setRefreshTrigger((prev) => prev + 1);
		updateHeaderWithSelectedTags(updatedTagIds);
	};

	// Funktion zum Aktualisieren des Headers mit ausgewählten Tags
	const updateHeaderWithSelectedTags = (tagIds: string[]) => {
		// Convert selected tags to the format expected by the Header component
		const selectedTagItems = tags
			.filter((tag) => tagIds.includes(tag.id))
			.map((tag) => ({
				id: tag.id,
				name: tag.name,
				color: tag.style?.color || '#808080',
			}));

		// Update header configuration - title is now in the scrollable list
		updateConfig({
			title: '',
			showTitle: false,
			showBackButton: false,
			rightIcons: [],
			selectedTags: selectedTagItems,
			onTagRemove: handleTagRemove,
			backgroundColor: 'transparent',
		});
	};

	// Filter memos based on search query
	const filteredMemos = useMemo(() => {
		if (!searchQuery.trim()) {
			return allMemos;
		}

		const query = searchQuery.toLowerCase();
		return allMemos.filter((memo) => {
			// Search in title
			if (memo.title?.toLowerCase().includes(query)) return true;
			// Search in intro
			if (memo.intro?.toLowerCase().includes(query)) return true;
			// Search in transcript
			const transcript = getTranscriptText(memo);
			if (transcript?.toLowerCase().includes(query)) return true;
			// Search in tags
			if (memo.tags?.some((tag: any) => tag.name.toLowerCase().includes(query))) return true;
			return false;
		});
	}, [allMemos, searchQuery]);

	// Handle search
	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);

			// Track search when query is not empty
			if (query) {
				track('memo_searched', {
					query_length: query.length,
					has_results: true, // Will be updated when results are shown
				});
			}
		},
		[track]
	);

	// Toggle search via global store
	const handleToggleSearch = useCallback(() => {
		useGlobalSearchStore.getState().toggleSearch();
	}, []);

	// Close search handler
	const handleCloseSearch = useCallback(() => {
		setSearchQuery('');
		setIsSearchVisible(false);
	}, []);

	// Sync global search active state to local
	const globalSearchActive = useGlobalSearchStore((s) => s.isActive);
	useEffect(() => {
		setIsSearchVisible(globalSearchActive);
		if (!globalSearchActive) {
			setSearchQuery('');
		}
	}, [globalSearchActive]);

	// Register search provider
	useSearchProvider({
		id: 'memos',
		placeholder: t('memo.searchPlaceholder', 'Memos durchsuchen...'),
		onSearch: handleSearch,
		onClose: handleCloseSearch,
	});

	// Callback when memos are loaded from MemoList
	const handleMemosLoaded = useCallback((memos: any[]) => {
		setAllMemos(memos);
	}, []);

	// Öffnen des Tag-Selectors
	const handleOpenTagSelector = () => {
		// Lade Tags, wenn sie noch nicht geladen wurden
		if (tagItems.length === 0) {
			loadTags();
		}
		setIsTagSelectorVisible(true);
	};

	// Öffnen des Space-Selectors
	const handleOpenSpaceSelector = () => {
		setIsSpaceSelectorVisible(true);
	};

	// Funktion zum Hinzufügen der ausgewählten Memos zu einem Space
	const handleAddMemosToSpace = async (spaceId: string) => {
		if (selectedMemoIds.length === 0) return;

		try {
			setIsUploading(true); // Verwende den vorhandenen Loading-State
			// Removed debug log for adding memos to space

			// Für jedes ausgewählte Memo den Space zuweisen
			let successCount = 0;
			for (const memoId of selectedMemoIds) {
				try {
					const success = await linkMemoToSpace(memoId, spaceId);
					if (success) {
						successCount++;
					}
				} catch (error) {
					// Removed debug log for error adding memo to space
				}
			}

			// Space-Selector schließen
			setIsSpaceSelectorVisible(false);
			setSelectedSpaceId(null);

			// Erfolgsmeldung anzeigen
			showSuccess(`${successCount} von ${selectedMemoIds.length} Memos zu Space hinzugefügt`);

			// Auswahlmodus beenden und Auswahl zurücksetzen
			setIsSelectionMode(false);
			setSelectedMemoIds([]);
		} catch (error) {
			// Removed debug log for error adding memos to space
			Alert.alert('Error', 'An error occurred while adding memos to the space.');
		} finally {
			setIsUploading(false);
		}
	};

	// Schließen des Tag-Selektors
	const handleCloseTagSelector = () => {
		setIsTagSelectorVisible(false);
		setSelectedTagForBulk(null);
	};

	// Auswahl eines Tags für Bulk-Tagging
	const handleTagSelectForBulk = (tagId: string) => {
		setSelectedTagForBulk(tagId);
		setIsTagSelectorVisible(false);

		// Track bulk tag action
		track('memo_bulk_action', {
			action: 'add_tag',
			memo_count: selectedMemoIds.length,
			tag_id: tagId,
		});

		// Direkt Tags hinzufügen, wenn ein Tag ausgewählt wurde
		addTagToSelectedMemos(tagId);
	};

	// Tags zu ausgewählten Memos hinzufügen
	const addTagToSelectedMemos = async (tagId: string) => {
		if (selectedMemoIds.length === 0) return;

		try {
			setIsUploading(true); // Verwende den vorhandenen Loading-State
			// Removed debug log for adding tag to memos

			// Authentifizierten Client holen
			const supabase = await getAuthenticatedClient();

			// Prüfen, ob der Tag existiert
			const { data: tagData, error: tagError } = await supabase
				.from('tags')
				.select('*')
				.eq('id', tagId)
				.single();

			if (tagError) {
				// Removed debug log for error fetching tag
				Alert.alert('Fehler', 'Der ausgewählte Tag konnte nicht gefunden werden.');
				return;
			}

			// Batch-Insert für alle Memos vorbereiten
			const tagsToInsert = selectedMemoIds.map((memoId) => ({
				memo_id: memoId,
				tag_id: tagId,
				created_at: new Date().toISOString(),
			}));

			// Batch-Insert durchführen
			const { error: insertError } = await supabase.from('memo_tags').upsert(tagsToInsert, {
				onConflict: 'memo_id,tag_id', // Verhindert Duplikate
				ignoreDuplicates: true, // Ignoriert Duplikate statt Fehler zu werfen
			});

			if (insertError) {
				// Removed debug log for error adding tags
				Alert.alert('Fehler', 'Beim Hinzufügen der Tags ist ein Fehler aufgetreten.');
				return;
			}

			// Removed debug log for successful tag addition

			// Lösung: Verwende das Event-System, um alle MemoPreview-Komponenten über die Änderung zu informieren
			// Dies ist eine elegante Lösung, die keine Seiten-Neuladen erfordert
			// Removed debug log for batch update event
			tagEvents.emitTagsBatchUpdated(selectedMemoIds, [tagId]);

			// Erfolgsmeldung anzeigen
			showSuccess(
				`Tag "${tagData.name || 'Ausgewählt'}" zu ${selectedMemoIds.length} Memos hinzugefügt`
			);

			// Refresh-Trigger setzen (vorher im Alert-Callback)
			setRefreshTrigger((prev) => prev + 1);
		} catch (error) {
			// Removed debug log for error adding tags
			Alert.alert('Error', 'An error occurred while adding tags.');
		} finally {
			setIsUploading(false);
		}
	};

	// Handle sharing a memo
	const handleShareMemo = async (memo: any) => {
		try {
			setIsUploading(true);

			// Get authenticated client
			const supabase = await getAuthenticatedClient();

			// Fetch complete memo data with memories
			const { data: fullMemo, error: memoError } = await supabase
				.from('memos')
				.select('*')
				.eq('id', memo.id)
				.single();

			if (memoError) {
				console.debug('Error fetching full memo:', memoError);
				Alert.alert('Fehler', 'Memo-Daten konnten nicht geladen werden.');
				return;
			}

			// Fetch memories for this memo
			const { data: memories, error: memoriesError } = await supabase
				.from('memories')
				.select('*')
				.eq('memo_id', memo.id)
				.order('sort_order', { ascending: true })
				.order('created_at', { ascending: false });

			if (memoriesError) {
				console.debug('Error fetching memories:', memoriesError);
				// Continue without memories
			}

			// Generate signed URL for audio if it exists
			let audioUrl = null;
			if (fullMemo.source?.audio_path) {
				try {
					const { data: urlData } = await supabase.storage
						.from('user-uploads')
						.createSignedUrl(fullMemo.source.audio_path, TIMEOUTS.SIGNED_URL_EXPIRY);

					if (urlData?.signedUrl) {
						audioUrl = urlData.signedUrl;
					}
				} catch (error) {
					console.debug('Error generating audio URL:', error);
					// Continue without audio URL
				}
			}

			// Prepare the memo data for sharing
			const shareData = {
				...fullMemo,
				memories: memories || [],
				audioUrl,
			};

			setSelectedMemoForShare(shareData);
			setIsShareModalVisible(true);
		} catch (error) {
			console.debug('Error in handleShareMemo:', error);
			Alert.alert('Fehler', 'Ein Fehler ist beim Laden der Memo-Daten aufgetreten.');
		} finally {
			setIsUploading(false);
		}
	};

	// Handle combining memos
	const handleCombineMemos = async (blueprintId: string, prompt?: string) => {
		if (selectedMemoIds.length === 0) return;

		// Track memo combination
		track('memos_combined', {
			memo_count: selectedMemoIds.length,
			blueprint_id: blueprintId,
			has_prompt: !!prompt,
		});

		try {
			setIsUploading(true);
			setCombiningMessage('Memos werden kombiniert...');

			// Update loading message
			setCombiningMessage('Blueprint wird verarbeitet...');

			// Call the memoro service directly (handles credit checks and consumption)
			const response = await fetch(
				`${process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL}/memoro/combine-memos`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${await tokenManager.getValidToken()}`,
					},
					body: JSON.stringify({
						memo_ids: selectedMemoIds,
						blueprint_id: blueprintId,
						custom_prompt: prompt,
						// spaceId removed - will be implemented later
					}),
				}
			);

			if (!response.ok) {
				console.log('Combine memos response not ok:', {
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
				});

				const errorData = await response.json().catch(() => ({}));
				console.log('Error data:', errorData);

				// For 402 errors, the global interceptor will handle it
				// Just return early without showing any alert
				if (response.status === 402) {
					return;
				}

				throw new Error(errorData.message || 'Request failed');
			}

			const data = await response.json();

			if (!data?.success) {
				console.error('Combine memos function failed:', data);
				Alert.alert('Fehler', 'Das Kombinieren der Memos ist fehlgeschlagen.');
				return;
			}

			// Notify credit system about consumption for UI updates
			if (data.creditsConsumed) {
				creditService.triggerCreditUpdate(data.creditsConsumed);
			}

			// Refresh credits after 3 seconds
			setTimeout(() => {
				refreshCredits();
			}, 3000);

			setCombiningMessage('Headline wird generiert...');

			// Wait a moment for headline generation to complete
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Navigate to the combined memo automatically
			setIsSelectionMode(false);
			setSelectedMemoIds([]);
			setRefreshTrigger((prev) => prev + 1);
			router.push(`/(protected)/(memo)/${data.memo_id}`);
		} catch (error: any) {
			console.error('Error combining memos:', error);
			// Only show alert for non-network errors
			// The global interceptor handles 402 errors
			if (error.message && !error.message.includes('Credit consumption failed')) {
				Alert.alert('Fehler', 'Ein Fehler ist beim Kombinieren der Memos aufgetreten.');
			}
		} finally {
			setIsUploading(false);
			setCombiningMessage('');
		}
	};

	// Toggle selection mode
	const toggleSelectionMode = () => {
		console.debug('🔍 toggleSelectionMode called, current state:', isSelectionMode);

		// Toggle the selection mode state
		const newMode = !isSelectionMode;
		setIsSelectionMode(newMode);

		console.debug('🔍 Selection mode changing to:', newMode);

		// Clear selections when exiting selection mode
		if (isSelectionMode) {
			console.debug('🔍 Clearing selected memo IDs');
			setSelectedMemoIds([]);
		}

		// Force update the header configuration to reflect the new selection mode
		updateHeaderWithSelectedTags(selectedTagIds);

		// Don't refresh the memo list - selection mode changes should maintain scroll position
		// setRefreshTrigger((prev) => prev + 1);
	};

	// Handle memo selection
	const handleMemoSelection = (memoId: string, selected: boolean) => {
		setSelectedMemoIds((prevSelected) => {
			if (selected) {
				return [...prevSelected, memoId];
			} else {
				return prevSelected.filter((id) => id !== memoId);
			}
		});
	};

	// Handle bulk delete
	const handleBulkDelete = () => {
		if (selectedMemoIds.length === 0) return;

		// Track bulk delete action
		track('memo_bulk_action', {
			action: 'delete',
			memo_count: selectedMemoIds.length,
		});

		Alert.alert(
			'Delete Memos',
			`Do you really want to delete ${selectedMemoIds.length} selected memos? This action cannot be undone.`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							setIsUploading(true); // Use the existing loading state
							// Removed debug log for starting bulk delete

							// Get authenticated supabase client
							const supabase = await getAuthenticatedClient();

							// Process each memo for deletion
							for (const memoId of selectedMemoIds) {
								// Removed debug log for processing memo deletion

								// Get the memo to check if it has audio
								const { data: memoData } = await supabase
									.from('memos')
									.select('source, title')
									.eq('id', memoId)
									.single();

								// Removed debug log for memo data

								// First, delete related memories
								const { error: memoriesError } = await supabase
									.from('memories')
									.delete()
									.eq('memo_id', memoId);

								if (memoriesError) {
									// Removed debug log for error deleting memories
									// Continue with other deletions even if this one fails
								}

								// If there's audio, delete it from storage
								if (memoData?.source?.audio_path) {
									const audioPath = memoData.source.audio_path;
									if (audioPath) {
										// Removed debug log for deleting audio file
										const { error: storageError } = await supabase.storage
											.from('user-uploads')
											.remove([audioPath]);

										if (storageError) {
											// Removed debug log for error deleting audio
											// Continue with memo deletion even if audio deletion fails
										}
									}
								}

								// Delete the memo itself
								const { error: memoError } = await supabase.from('memos').delete().eq('id', memoId);

								if (memoError) {
									// Removed debug log for error deleting memo
									// Continue with other deletions even if this one fails
								} else {
									// Removed debug log for successful memo deletion
								}
							}

							// Show success toast
							showSuccess(`${selectedMemoIds.length} Memos erfolgreich gelöscht`);

							// Trigger a refresh of the memo list
							setRefreshTrigger((prev) => prev + 1);

							// After deletion, exit selection mode
							setIsSelectionMode(false);
							setSelectedMemoIds([]);
						} catch (error) {
							// Removed debug log for error in bulk delete
							Alert.alert('Error', 'An error occurred while deleting the memos.');
						} finally {
							setIsUploading(false);
						}
					},
				},
			]
		);
	};

	// ...

	// Handle tag creation
	const handleCreateTag = async (name: string, color: string) => {
		try {
			setIsTagsLoading(true);

			// Get authenticated client
			const supabase = await getAuthenticatedClient();

			if (!user || !user.id) {
				Alert.alert('Error', 'You must be logged in to create tags.');
				return;
			}

			// Create new tag in database
			const { error } = await supabase.from('tags').insert({
				name: name,
				style: { color },
				user_id: user.id,
			});

			if (error) {
				console.debug('Error creating tag:', error);
				Alert.alert('Error', 'Failed to create tag.');
				return;
			}

			// Reload tags
			await loadTags();
		} catch (error) {
			console.debug('Error in handleCreateTag:', error);
			Alert.alert('Error', 'An unexpected error occurred while creating the tag.');
		} finally {
			setIsTagsLoading(false);
		}
	};

	// Tag-Selector Modal
	const renderTagSelector = () => {
		return (
			<TagSelectorModal
				isVisible={isTagSelectorVisible}
				onClose={handleCloseTagSelector}
				onTagSelect={handleTagSelectForBulk}
				selectedTagIds={selectedTagForBulk ? [selectedTagForBulk] : []}
				tagItems={tagItems}
				isLoading={isTagsLoading}
				title="Select Tag"
				onCreateTag={handleCreateTag}
			/>
		);
	};

	// Space-Selector Modal
	const renderSpaceSelector = () => {
		return (
			<SpaceSelectorModal
				visible={isSpaceSelectorVisible}
				onClose={() => setIsSpaceSelectorVisible(false)}
				spaces={spaces}
				onSelectSpace={handleAddMemosToSpace}
				selectedSpaceId={selectedSpaceId}
			/>
		);
	};

	const styles = StyleSheet.create({
		listContainer: {
			flex: 1,
		},
		uploadingContainer: {
			position: 'absolute',
			top: 10,
			left: 0,
			right: 0,
			zIndex: 100,
			alignItems: 'center',
			justifyContent: 'center',
			padding: 10,
			pointerEvents: 'box-none', // Allow mouse events to pass through
		},
		pillFilterContainer: {
			position: 'absolute',
			bottom: 0,
			left: 0,
			right: 0,
			zIndex: 10,
			pointerEvents: 'box-none', // Allow mouse events to pass through
		},
	});

	const bottomInset = useBottomBarInset();

	// Register TagPillFilter via BottomBar system
	const tagPillContent = useMemo(
		() => (
			<TagPillFilter
				selectedTagIds={selectedTagIds}
				onTagSelect={handleTagSelect}
				initialTags={tags}
			/>
		),
		[selectedTagIds, handleTagSelect, tags]
	);

	useBottomBar({
		id: 'memos-tags',
		priority: 0,
		collapsedIcon: 'pricetags-outline',
		content: tagPillContent,
		keyboardBehavior: 'hide',
	});

	// Register Action Buttons as pill slider via BottomBar system
	const actionPillItems = useMemo(() => {
		const items = [
			{
				id: 'select',
				label: t('common.select', 'Auswählen'),
				iconName: 'checkmark-circle-outline',
			},
			{ id: 'audio-archive', label: t('common.audio', 'Audio'), iconName: 'waveform' },
			{
				id: 'upload',
				label: isUploading
					? t('common.uploading', 'Hochladen...')
					: t('common.upload', 'Hochladen'),
				iconName: isUploading ? 'hourglass-outline' : 'cloud-upload-outline',
			},
			{ id: 'search', label: t('common.search', 'Suchen'), iconName: 'search-outline' },
		];
		return items;
	}, [t, isUploading]);

	const handleActionPillSelect = useCallback(
		(id: string) => {
			if (id === 'all') return;
			switch (id) {
				case 'select':
					toggleSelectionMode();
					break;
				case 'audio-archive':
					router.push('/(protected)/audio-archive');
					break;
				case 'upload':
					if (!isUploading) setIsUploadModalVisible(true);
					break;
				case 'search':
					handleToggleSearch();
					break;
			}
		},
		[toggleSelectionMode, isUploading, handleToggleSearch]
	);

	const actionButtonsContent = useMemo(
		() => (
			<PillFilter
				items={actionPillItems}
				selectedIds={isSearchVisible ? ['search'] : []}
				onSelectItem={handleActionPillSelect}
				showAllOption={false}
			/>
		),
		[actionPillItems, isSearchVisible, handleActionPillSelect]
	);

	const selectionPillItems = useMemo(
		() => [
			{ id: 'close', label: t('common.close', 'Schließen'), iconName: 'close-outline' },
			{ id: 'tag', label: t('common.tags', 'Tags'), iconName: 'pricetag-outline' },
			{ id: 'combine', label: t('memo.combine', 'Kombinieren'), iconName: 'git-merge-outline' },
			{ id: 'delete', label: t('common.delete', 'Löschen'), iconName: 'trash-outline' },
		],
		[t]
	);

	const handleSelectionPillSelect = useCallback(
		(id: string) => {
			switch (id) {
				case 'close':
					toggleSelectionMode();
					break;
				case 'tag':
					handleOpenTagSelector();
					break;
				case 'combine':
					setIsCombineModalVisible(true);
					break;
				case 'delete':
					handleBulkDelete();
					break;
			}
		},
		[toggleSelectionMode, handleOpenTagSelector, handleBulkDelete]
	);

	const selectionActionContent = useMemo(
		() => (
			<PillFilter
				items={selectionPillItems}
				selectedIds={['close']}
				onSelectItem={handleSelectionPillSelect}
				showAllOption={false}
			/>
		),
		[selectionPillItems, handleSelectionPillSelect]
	);

	useBottomBar(
		!isSelectionMode
			? {
					id: 'memos-action-buttons',
					priority: 40,
					collapsedIcon: 'ellipsis-horizontal',
					content: actionButtonsContent,
					keyboardBehavior: 'hide',
				}
			: {
					id: 'memos-action-buttons',
					priority: 40,
					collapsedIcon: 'close-outline',
					content: selectionActionContent,
					keyboardBehavior: 'hide',
				}
	);

	// Header-Konfiguration mit dem useHeader-Hook aktualisieren
	const { updateConfig, headerHeight } = useHeader();

	// Update header title with selection count in selection mode
	useEffect(() => {
		if (isSelectionMode) {
			updateConfig({
				title: `${selectedMemoIds.length} ${t('common.selected', 'ausgewählt')}`,
				showTitle: true,
				showBackButton: false,
				rightIcons: [],
				selectedTags: [],
				backgroundColor: 'transparent',
			});
		}
	}, [isSelectionMode, selectedMemoIds.length]);

	// Event-Listener für Tag- und Memo-Änderungen einrichten
	useEffect(() => {
		// Event-Listener für neu erstellte Tags
		const tagCreatedUnsubscribe = tagEvents.onTagCreated(({ tagId, tag }) => {
			console.debug('Memos page: Tag created event received', { tagId, tag });
			// Tags neu laden wenn ein neuer Tag erstellt wurde
			loadTags();
		});

		// Event-Listener für Tag-Pinning-Änderungen
		const tagPinnedUnsubscribe = tagEvents.onTagPinned(({ tagId, isPinned }) => {
			console.debug('Memos page: Tag pinned event received', { tagId, isPinned });
			// Tags neu laden, um die neue Reihenfolge zu berücksichtigen
			loadTags();
		});

		// Event-Listener für Tag-Reihenfolge-Änderungen
		const tagOrderChangedUnsubscribe = tagEvents.onTagOrderChanged(({ reorderedTagIds }) => {
			console.debug('Memos page: Tag order changed event received', { reorderedTagIds });
			// Tags neu laden, um die neue Reihenfolge zu berücksichtigen
			loadTags();
		});

		// Event-Listener für Memo-Pinning-Änderungen
		const memoPinnedUnsubscribe = tagEvents.onMemoPinned(({ memoId, isPinned }) => {
			console.debug('Memos page: Memo pinned event received', { memoId, isPinned });
			// Memo-Liste neu laden, um die neue Reihenfolge zu berücksichtigen
			setRefreshTrigger((prev) => prev + 1);
		});

		// Cleanup beim Unmounten
		return () => {
			tagCreatedUnsubscribe();
			tagPinnedUnsubscribe();
			tagOrderChangedUnsubscribe();
			memoPinnedUnsubscribe();
		};
	}, [loadTags]);

	// Header-Konfiguration aktualisieren und MemoList aktualisieren, wenn die Seite fokussiert wird
	useFocusEffect(
		useCallback(() => {
			console.debug('Memos page focused - refreshing memo list');
			console.log('Memos page focused, params:', params);

			// Check for openUploadModal parameter when page gets focus
			if (params.openUploadModal === 'true') {
				console.log('Opening upload modal from focus effect');
				setTimeout(() => {
					setIsUploadModalVisible(true);
					// Clear the parameter after opening modal
					router.replace('/(protected)/(tabs)/memos');
				}, 500);
			}

			// Show onboarding toast for memos page
			showPageOnboardingToast('memos');

			// Aktualisiere den Header basierend auf den ausgewählten Tags
			updateHeaderWithSelectedTags(selectedTagIds);

			// Don't automatically refresh to maintain scroll position
			// The real-time updates will handle any changes
			// setRefreshTrigger((prev) => prev + 1);

			// Header-Konfiguration zurücksetzen, wenn die Komponente unfokussiert wird
			return () => {
				// Cleanup page toast when leaving memos page
				cleanupPageToast('memos');

				// Tags zurücksetzen - NICHT die Header-Konfiguration überschreiben
				setSelectedTagIds([]);

				// IMPORTANT: Clear header icons immediately when leaving the memos page
				// This prevents icons from briefly appearing on the recording page
				updateConfig({
					rightIcons: [],
					selectedTags: [],
				});
			};
		}, [isSelectionMode, isUploading, params.openUploadModal])
	);

	// Determine the title text for the scrollable list header
	const listTitleText = useMemo(() => {
		if (selectedTagIds.length > 0) {
			const selectedTagNames = tags
				.filter((tag) => selectedTagIds.includes(tag.id))
				.map((tag) => tag.name);
			if (selectedTagNames.length > 0) return selectedTagNames.join(' & ');
		}
		return t('tabs.memos', 'Memos');
	}, [selectedTagIds, tags, t]);

	const textColor = isDark ? '#FFFFFF' : '#000000';

	const listHeaderComponent = useMemo(
		() => (
			<View style={{ alignItems: 'center', paddingBottom: 0, marginBottom: 24 }}>
				<Text
					style={{
						fontSize: 40,
						lineHeight: 40,
						fontWeight: '700',
						color: textColor,
						alignSelf: 'center',
					}}
					numberOfLines={1}
				>
					{listTitleText}
				</Text>
			</View>
		),
		[listTitleText, textColor]
	);

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<View style={{ flex: 1, backgroundColor: pageBackgroundColor, position: 'relative' }}>
				<View style={[styles.listContainer]}>
					<LoadingOverlay
						visible={isUploading}
						message={combiningMessage || 'Wird geladen...'}
						modal={false}
						style={{ pointerEvents: isUploading ? 'auto' : 'none' }}
					/>
					<MemoList
						showArchived={false}
						tagIds={selectedTagIds}
						selectionMode={isSelectionMode}
						selectedMemoIds={selectedMemoIds}
						onMemoSelection={handleMemoSelection}
						refreshTrigger={refreshTrigger}
						onShare={handleShareMemo}
						memos={searchQuery ? filteredMemos : undefined}
						onMemosLoaded={handleMemosLoaded}
						maintainScrollPosition={true}
						contentInsetTop={headerHeight - 20}
						contentInsetBottom={bottomInset + 20}
						ListHeaderComponent={listHeaderComponent}
					/>
				</View>

				{/* Toolbar now managed via useBottomBar */}

				{renderTagSelector()}
				{renderSpaceSelector()}

				<CombineMemosModal
					isVisible={isCombineModalVisible}
					onClose={() => setIsCombineModalVisible(false)}
					selectedMemoIds={selectedMemoIds}
					onCombine={handleCombineMemos}
				/>

				{/* Share Modal */}
				{selectedMemoForShare && (
					<ShareModal
						visible={isShareModalVisible}
						onClose={() => {
							setIsShareModalVisible(false);
							setSelectedMemoForShare(null);
						}}
						title={selectedMemoForShare.title || 'Untitled'}
						intro={selectedMemoForShare.intro}
						memories={selectedMemoForShare.memories || []}
						transcript={
							selectedMemoForShare.source?.content ||
							selectedMemoForShare.source?.transcription ||
							selectedMemoForShare.source?.transcript
						}
						audioUrl={selectedMemoForShare.audioUrl}
					/>
				)}

				{/* PromptBar vollständig entfernt */}

				{/* Insufficient Credits Modal - Removed in favor of global interceptor */}

				{/* Upload Modal */}
				<UploadModal
					isVisible={isUploadModalVisible}
					onClose={() => setIsUploadModalVisible(false)}
					onFileUpload={handleAudioUpload}
					currentLanguage={currentLanguage}
					isUploading={isUploading}
				/>

				{/* TagPillFilter, Action Buttons, and Selection close now managed via useBottomBar */}
			</View>

			{/* Search now handled by GlobalSearchOverlay via useSearchProvider */}
		</>
	);
}
