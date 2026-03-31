import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { View, StyleSheet, Alert, Dimensions, Animated, Easing, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Text from '~/components/atoms/Text';
import { useTheme, useThemeUpdate } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import { useHeader } from '~/features/menus/HeaderContext';
import RecordingButton, { SatelliteButton } from '~/components/atoms/RecordingButton';

import MultiLanguageSelector from '~/components/molecules/MultiLanguageSelector';
import { useSpaceContext, useSpaceStore } from '~/features/spaces';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '~/features/i18n/LanguageContext';
import BlueprintSelector from '~/features/blueprints/components/BlueprintSelector';
import AdviceCarousel from '~/features/blueprints/components/AdviceCarousel';
import { STANDARD_BLUEPRINT_ID } from '~/features/blueprints/constants';
import Icon from '~/components/atoms/Icon';
import CircleIconButton from '~/components/atoms/CircleIconButton';
import { TIMEOUTS } from '~/utils/sharedConstants';
import MemoPreview from '~/components/molecules/MemoPreview';
import MemoPreviewSkeleton from '~/components/molecules/MemoPreviewSkeleton';
import HomePageSkeleton from '~/components/organisms/HomePageSkeleton';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { useMemoStore } from '~/features/memos/store/memoStore';
import { hasProcessingStatusChanged } from '~/utils/deepComparison';
import ShareModal from '~/components/molecules/ShareModal';
// InsufficientCreditsModal removed - using global interceptor in _layout.tsx
import PermissionDeniedModal from '~/components/molecules/PermissionDeniedModal';
import RecordingRecoveryModal from '~/components/molecules/RecordingRecoveryModal';
import MicrophoneSelector from '~/components/molecules/MicrophoneSelector';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';
import { useAllMemoUpdates } from '~/features/memos/contexts/MemoRealtimeContext';
import { useMemoPhotos } from '~/features/storage/hooks/useMemoPhotos';
import { useCredits } from '~/features/credits/CreditContext';
import { useUserSettings } from '~/features/settings/hooks/useUserSettings';
import MigrationNotificationModal from '~/features/migration/components/MigrationNotificationModal';
import { useSettingsStore } from '~/features/settings';
import { getTranscriptText, hasTranscript } from '~/features/memos/utils/transcriptUtils';
import { useAnalytics, useScreenTracking } from '~/features/analytics';
import { cloudStorageService } from '~/features/storage/cloudStorage.service';
import { triggerTranscription } from '~/features/storage/transcriptionUtils';
import { authService } from '~/features/auth/services/authService';
import { useRatingStore } from '~/features/rating/store/ratingStore';
import { RecordingStatus, useRecordingLanguage } from '~/features/audioRecordingV2';
import { useUploadStatusStore } from '~/features/storage/store/uploadStatusStore';
import { UploadStatus } from '~/features/storage/uploadStatus.types';
import { useBottomBar } from '~/features/bottomBar';
import ManaCounter from '~/features/subscription/ManaCounter';

export default function Home() {
	const { tw, isDark, themeVariant } = useTheme();
	const { t } = useTranslation();
	const { currentLanguage } = useLanguage();
	const { recordingLanguages, toggleRecordingLanguage, supportedAzureLanguages } =
		useRecordingLanguage();
	const { toggleTheme } = useThemeUpdate();
	const { spaces } = useSpaceContext();
	const { refreshCredits } = useCredits();
	const { settings, updateMemoroSettings } = useUserSettings();
	const { track } = useAnalytics();
	const { incrementMemoCount } = useRatingStore();

	// Track screen view - memoize the properties to avoid infinite loops
	const screenTrackingProps = useMemo(
		() => ({
			tab: 'home',
			has_spaces: spaces?.length > 0,
		}),
		[spaces?.length]
	);

	useScreenTracking('recording_screen', screenTrackingProps);

	// UI visibility settings
	const {
		showRecordingInstruction: showRecordingInstructionSetting,
		showLanguageButton,
		showMemoPreview: showMemoPreviewSetting,
		showBlueprints,
		showMicrophoneButton,
		preferredInputUid,
		preferredInputName,
		setPreferredInput,
		showManaBadge,
	} = useSettingsStore();

	// Microphone selector state
	const [isMicrophoneSelectorVisible, setIsMicrophoneSelectorVisible] = useState(false);
	const { availableInputs } = useRecordingStore();

	// State for recording instruction text with arrow
	const [showRecordingInstruction, setShowRecordingInstruction] = useState(false);
	const instructionOpacity = useRef(new Animated.Value(0)).current;

	// State for migration notification modal
	const [showMigrationModal, setShowMigrationModal] = useState(false);

	// Combined loading state for initial page load
	const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

	// Animation for content fade-in after skeleton
	const contentFadeAnim = useRef(new Animated.Value(0)).current;

	// Debug wrapper for language toggle
	const handleLanguageToggle = useCallback(
		(language: string) => {
			toggleRecordingLanguage(language);
		},
		[toggleRecordingLanguage]
	);

	// Responsive recording button size based on screen dimensions
	const screenDimensions = useMemo(() => Dimensions.get('window'), []);
	const recordingButtonSize = useMemo(() => {
		const { width, height } = screenDimensions;
		const minDimension = Math.min(width, height);

		// Responsive sizing for different device categories
		let calculatedSize;

		console.log('🔍 Screen dimensions:', { width, height, minDimension });

		if (minDimension <= 375) {
			// iPhone SE, 13 mini: 180px (increased from 160px)
			calculatedSize = 180;
		} else if (minDimension <= 390) {
			// iPhone 13/14/15: 190px (increased from 170px)
			calculatedSize = 190;
		} else if (minDimension <= 393) {
			// iPhone 14 Pro, 16: 195px (increased from 180px)
			calculatedSize = 195;
		} else if (minDimension <= 402) {
			// iPhone 16 Pro: 200px (increased from 198px)
			calculatedSize = 200;
		} else if (minDimension <= 428) {
			// iPhone 13/14 Pro Max: 210px
			calculatedSize = 210;
		} else if (minDimension <= 430) {
			// iPhone 15/16 Pro Max: 220px
			calculatedSize = 220;
		} else {
			// iPad & Tablets: 240px
			calculatedSize = 240;
		}

		console.log('🎯 Final button size:', calculatedSize);
		return calculatedSize;
	}, [screenDimensions]);

	// Onboarding toasts
	const {
		showPageOnboardingToast,
		cleanupPageToast,
		handleFirstRecordingCompleted,
		hasCompletedFirstRecording,
		hasSeenCompletionCelebration,
		pageOnboardingSeen,
		isLoading: isOnboardingLoading,
		resetOnboardingForTesting,
	} = usePageOnboarding();

	// DEBUG: One-time reset for testing (use manually in console)
	useEffect(() => {
		// Make reset function available globally for manual testing
		if (typeof window !== 'undefined') {
			(window as any).resetOnboarding = () => {
				console.debug('🧪 Manual onboarding reset triggered');
				resetOnboardingForTesting();
			};
			(window as any).checkOnboardingStatus = () => {
				console.debug('📊 Current onboarding status:', pageOnboardingSeen);
			};
		}
	}, [resetOnboardingForTesting, pageOnboardingSeen]);

	// Hole URL-Parameter
	const params = useLocalSearchParams<{ memoId?: string; mode?: string }>();
	// Verwende einen detaillierteren Status statt nur isRecording
	const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
	// State for recording time tracking
	const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
	const [recordingDuration, setRecordingDuration] = useState<number>(0);
	// Get selected space ID from Zustand store
	const selectedSpaceId = useSpaceStore((state) => state.currentSpaceId);
	const setCurrentSpaceId = useSpaceStore((state) => state.setCurrentSpaceId);
	// State for selected space and blueprint - default to standard blueprint
	const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(
		STANDARD_BLUEPRINT_ID
	);
	// State für das Memo, zu dem eine Aufnahme hinzugefügt werden soll
	const [appendToMemoId, setAppendToMemoId] = useState<string | null>(null);
	// State für die Sichtbarkeit der MemoPreview
	const [isMemoPreviewVisible, setIsMemoPreviewVisible] = useState<boolean>(true);

	// Animation value for fade-in effect
	const fadeAnim = useRef(new Animated.Value(1)).current; // Start at 1 (visible)
	// Track previous memo ID to detect new memos
	const previousMemoIdRef = useRef<string | null>(null);
	// State für das ShareModal
	const [isShareModalVisible, setIsShareModalVisible] = useState(false);
	const [selectedMemoForShare, setSelectedMemoForShare] = useState<any>(null);

	// Recording store for error tracking
	const insufficientCreditsError = useRecordingStore((state) => state.insufficientCreditsError);
	const clearInsufficientCreditsError = useRecordingStore(
		(state) => state.clearInsufficientCreditsError
	);
	const permissionDeniedError = useRecordingStore((state) => state.permissionDeniedError);
	const canAskAgainForPermission = useRecordingStore((state) => state.canAskAgainForPermission);
	const clearPermissionDeniedError = useRecordingStore((state) => state.clearPermissionDeniedError);
	const startRecording = useRecordingStore((state) => state.startRecording);
	const setRecordingInfo = useRecordingStore((state) => state.setRecordingInfo);
	const globalRecordingStatus = useRecordingStore((state) => state.status);
	const recordingStoreMemo = useRecordingStore((state) => state.memo);
	const recordingStoreDuration = useRecordingStore((state) => state.duration);

	// Recording recovery state
	const orphanedRecording = useRecordingStore((state) => state.orphanedRecording);
	const showRecoveryPrompt = useRecordingStore((state) => state.showRecoveryPrompt);
	const isRecoveringRecording = useRecordingStore((state) => state.isRecoveringRecording);
	const checkForOrphanedRecording = useRecordingStore((state) => state.checkForOrphanedRecording);
	const recoverOrphanedRecording = useRecordingStore((state) => state.recoverOrphanedRecording);
	const discardOrphanedRecording = useRecordingStore((state) => state.discardOrphanedRecording);
	const dismissRecoveryPrompt = useRecordingStore((state) => state.dismissRecoveryPrompt);

	// Photo status hook
	const { hasPhotos: checkHasPhotos, checkPhotoStatus } = useMemoPhotos();

	// Force re-render when photo status might change
	const [photoStatusVersion, setPhotoStatusVersion] = useState(0);

	// Debug: Log insufficient credits error state changes
	useEffect(() => {
		console.debug('InsufficientCreditsError state changed:', insufficientCreditsError);
	}, [insufficientCreditsError]);

	// Check for orphaned (interrupted) recordings on mount
	useEffect(() => {
		console.log('[Home] Checking for orphaned recordings on mount...');
		checkForOrphanedRecording();
	}, [checkForOrphanedRecording]);

	// Removed swipe animation code

	// Verwende den zentralen Memo-Store statt lokaler States
	const {
		latestMemo: latestMemoFromStore,
		isLoading: isLoadingMemo,
		loadLatestMemo,
		setLatestMemo,
		setLastViewedMemoId,
		incrementLocalViewCount,
	} = useMemoStore();

	// Use either store memo or recording store memo
	const latestMemo = latestMemoFromStore || recordingStoreMemo;

	// Effect to show recording instruction after 3 seconds
	useEffect(() => {
		// Only show if not currently recording
		if (recordingStatus === RecordingStatus.IDLE) {
			const timer = setTimeout(() => {
				console.debug('🎯 Showing recording instruction after 3 seconds');
				setShowRecordingInstruction(true);
				Animated.timing(instructionOpacity, {
					toValue: 1,
					duration: 500,
					easing: Easing.out(Easing.ease),
					useNativeDriver: true,
				}).start();
			}, 3000);

			return () => clearTimeout(timer);
		} else {
			// Hide instruction if recording starts
			if (showRecordingInstruction) {
				Animated.timing(instructionOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}).start(() => {
					setShowRecordingInstruction(false);
				});
			}
		}
	}, [recordingStatus, showRecordingInstruction, instructionOpacity]);

	// Create a reference to store the current memo ID for refreshing
	const currentMemoIdRef = useRef<string | null>(null);

	// Function to explicitly refresh the current memo
	const refreshCurrentMemo = useCallback(async () => {
		if (currentMemoIdRef.current) {
			console.debug('🔄 Explicitly refreshing current memo:', currentMemoIdRef.current);
			try {
				// Load the latest memo directly without clearing first to prevent flickering
				loadLatestMemo();
				setIsMemoPreviewVisible(true);
			} catch (error) {
				console.debug('Error refreshing memo:', error);
			}
		}
	}, [loadLatestMemo]);

	// Effekt, um den ausgewählten Blueprint aus dem AsyncStorage zu laden
	useEffect(() => {
		const loadSavedBlueprintId = async () => {
			try {
				const savedBlueprintId = await AsyncStorage.getItem('selectedBlueprintId');
				if (savedBlueprintId) {
					// Setze den ausgewählten Blueprint
					setSelectedBlueprintId(savedBlueprintId);
					// Entferne die ID aus dem AsyncStorage, damit sie nicht erneut geladen wird
					await AsyncStorage.removeItem('selectedBlueprintId');

					console.debug('Blueprint aus AsyncStorage geladen:', savedBlueprintId);
				}
			} catch (error) {
				console.debug('Fehler beim Laden des Blueprints aus AsyncStorage:', error);
			}
		};

		loadSavedBlueprintId();
	}, []);

	// Callback für Theme-Toggle
	const handleThemeToggle = useCallback(() => {
		toggleTheme();
	}, [toggleTheme]);

	// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration (konsistent mit Memos-Seite)
	const pageBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.pageBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.pageBackground;

	// Callback für den Start der Aufnahme
	const handleRecordingStart = useCallback(() => {
		setRecordingStatus(RecordingStatus.RECORDING);
		setRecordingStartTime(new Date());
		setRecordingDuration(0);

		// Track recording started
		track('recording_started', {
			blueprint_id: selectedBlueprintId,
			space_id: selectedSpaceId,
			languages: recordingLanguages,
			language_count: recordingLanguages.length,
			is_append: !!appendToMemoId,
			theme: isDark ? 'dark' : 'light',
		});
	}, [selectedBlueprintId, selectedSpaceId, recordingLanguages, appendToMemoId, isDark, track]);

	// Handle permission retry
	const handlePermissionRetry = useCallback(async () => {
		console.debug('Permission retry triggered');
		// Track permission retry
		track('recording_permission_retry', {
			blueprint_id: selectedBlueprintId,
			space_id: selectedSpaceId,
		});

		// Set recording info with current settings
		setRecordingInfo({
			title: 'Memo',
			spaceId: selectedSpaceId,
			blueprintId: selectedBlueprintId,
		});
		// Attempt to start recording again - this will re-check permissions
		await startRecording();
	}, [selectedSpaceId, selectedBlueprintId, setRecordingInfo, startRecording, track]);

	// Sync local recording status with global store
	useEffect(() => {
		if (globalRecordingStatus !== recordingStatus) {
			setRecordingStatus(globalRecordingStatus);
		}
	}, [globalRecordingStatus]);

	// Effect to update recording duration every second
	useEffect(() => {
		let interval: ReturnType<typeof setInterval>;

		if (recordingStatus === RecordingStatus.RECORDING && recordingStartTime) {
			interval = setInterval(() => {
				const elapsed = Math.floor((new Date().getTime() - recordingStartTime.getTime()) / 1000);
				setRecordingDuration(elapsed);
			}, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [recordingStatus, recordingStartTime]);

	// Effekt, um automatisch mit der Aufnahme zu beginnen, wenn der mode-Parameter auf 'append' gesetzt ist
	useEffect(() => {
		if (params.mode === 'append' && params.memoId) {
			console.debug('Starte Aufnahme für bestehendes Memo:', params.memoId);
			setAppendToMemoId(params.memoId);
			// Kurze Verzögerung, um sicherzustellen, dass die UI vollständig geladen ist
			const timer = setTimeout(() => {
				if (isMountedRef.current) {
					setRecordingStatus(RecordingStatus.RECORDING);
					setRecordingStartTime(new Date());
					setRecordingDuration(0);
				}
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [params.mode, params.memoId]);

	// Track the current memo ID we're subscribed to
	const [subscribedMemoId, setSubscribedMemoId] = useState<string | null>(null);
	const memoSubscriptionRef = useRef<(() => void) | null>(null);

	// Store polling timeout reference for cleanup
	const pollingTimeoutRef = useRef<NodeJS.Timeout>();
	const isMountedRef = useRef(true);

	// Track if we're waiting for a new memo INSERT event
	const waitingForNewMemoRef = useRef<string | null>(null);

	// Track component mount state
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Subscribe to specific memo when it's created
	useEffect(() => {
		if (
			latestMemo?.id &&
			latestMemo.id !== 'recording-temp' &&
			latestMemo.id !== subscribedMemoId &&
			!latestMemo.isPlaceholder // Don't subscribe to placeholders - they don't exist in DB yet
		) {
			console.log('🎯 Setting up memo-specific subscription for:', latestMemo.id);
			console.log('Current memo state:', {
				title: latestMemo.title,
				metadata: latestMemo.metadata,
				source: latestMemo.source,
			});

			// Clean up previous subscription
			if (memoSubscriptionRef.current) {
				console.log('Cleaning up previous subscription');
				memoSubscriptionRef.current();
			}

			// Small delay to ensure the memo is properly created in the database
			const setupSubscription = async () => {
				// Check if component is still mounted
				if (!isMountedRef.current) {
					console.log('Component unmounted, skipping subscription setup');
					return;
				}

				// First verify the memo exists before subscribing
				try {
					const supabase = await getAuthenticatedClient();
					const { data: memoExists, error } = await supabase
						.from('memos')
						.select('id')
						.eq('id', latestMemo.id)
						.single();

					if (!isMountedRef.current) return;

					if (error || !memoExists) {
						console.log(`Memo ${latestMemo.id} no longer exists, skipping subscription setup`);
						// Clear the memo from store if it doesn't exist
						if (error?.code === 'PGRST116' && isMountedRef.current) {
							useMemoStore.getState().setLatestMemo(null);
							// Don't load if we're waiting for a new memo INSERT event
							if (!waitingForNewMemoRef.current) {
								loadLatestMemo();
							}
						}
						return;
					}
				} catch (error) {
					console.error('Error checking memo existence:', error);
					return;
				}

				// Subscribe to this specific memo
				const { memoRealtimeService } = require('~/features/memos/services/memoRealtimeService');

				// Ensure the realtime service is initialized
				const status = memoRealtimeService.getStatus();
				console.log('Realtime service status:', status);

				if (!status.isInitialized) {
					console.log('Realtime service not initialized, initializing now...');
					await memoRealtimeService.initialize();
					console.log('Realtime service initialized');
				}

				// Check again before subscribing
				if (!isMountedRef.current) return;

				// Use subscribeToMemoWithInitialData to get current state first
				memoSubscriptionRef.current = await memoRealtimeService.subscribeToMemoWithInitialData(
					latestMemo.id,
					(memo: any, isInitial?: boolean) => {
						// Skip updates if component is unmounted
						if (!isMountedRef.current) return;

						console.log('📨 Memo update received:', {
							isInitial,
							memoId: memo.id,
							title: memo.title,
							transcriptionStatus: memo.metadata?.processing?.transcription?.status,
							headlineStatus: memo.metadata?.processing?.headline_and_intro?.status,
							hasTranscript: hasTranscript(memo),
							fullMetadata: JSON.stringify(memo.metadata, null, 2),
							fullSource: JSON.stringify(memo.source, null, 2),
						});

						// Update the memo in the store
						const updatedMemo = {
							id: memo.id,
							title: memo.title,
							timestamp: latestMemo.timestamp, // Keep original timestamp
							is_pinned: memo.is_pinned || false,
							source: memo.source,
							metadata: memo.metadata,
							tags: memo.tags || [],
							space: memo.space || null,
						};

						console.log('🔄 Updating memo in store with:', updatedMemo);
						if (isMountedRef.current) {
							useMemoStore.getState().setLatestMemo(updatedMemo);
						}
					},
					{
						includeInitialFetch: true, // This ensures we get the current state immediately
					}
				);

				setSubscribedMemoId(latestMemo.id);
				console.log('✅ Memo subscription established');

				// Check again before setting up broadcast
				if (!isMountedRef.current) {
					// Clean up the subscription we just created
					if (memoSubscriptionRef.current) {
						memoSubscriptionRef.current();
						memoSubscriptionRef.current = null;
					}
					return;
				}

				// Subscribe to a broadcast channel for this specific memo
				// This works around the RLS limitation with service_role updates
				const broadcastChannel = memoRealtimeService.subscribeToBroadcastChannel(
					`memo-updates-${latestMemo.id}`,
					async (payload) => {
						// Skip updates if component is unmounted
						if (!isMountedRef.current) return;

						console.log('📡 Broadcast update received:', payload);

						// Handle the nested payload structure from broadcast
						const broadcastData = payload.payload || payload;

						if (broadcastData.type === 'memo-updated' && broadcastData.memoId === latestMemo.id) {
							// Fetch fresh data when broadcast is received
							const freshData = await memoRealtimeService.getCurrentMemoData(latestMemo.id);
							if (freshData && isMountedRef.current) {
								const updatedMemo = {
									id: freshData.id,
									title: freshData.title,
									timestamp: latestMemo.timestamp,
									is_pinned: freshData.is_pinned || false,
									source: freshData.source,
									metadata: freshData.metadata,
									tags: freshData.tags || [],
									space: freshData.space || null,
								};

								console.log('🔄 Updating memo from broadcast:', updatedMemo);
								if (isMountedRef.current) {
									useMemoStore.getState().setLatestMemo(updatedMemo);
								}
							}
						}
					}
				);

				// Store cleanup for broadcast channel
				if (memoSubscriptionRef.current) {
					const originalCleanup = memoSubscriptionRef.current;
					memoSubscriptionRef.current = () => {
						originalCleanup();
						broadcastChannel();
					};
				}
			};

			// Store subscription setup timeout for cleanup
			const setupTimeout = setTimeout(() => {
				setupSubscription();
			}, 500);

			// Clean up timeout on unmount
			return () => {
				clearTimeout(setupTimeout);
			};
		}

		// Cleanup on unmount or when dependencies change
		return () => {
			if (memoSubscriptionRef.current) {
				console.log('🧹 Cleaning up memo subscription');
				memoSubscriptionRef.current();
				memoSubscriptionRef.current = null;
			}
			setSubscribedMemoId(null);
		};
	}, [latestMemo?.id]);

	// Handle real-time memo updates using centralized service
	useAllMemoUpdates(
		(payload) => {
			if (payload.event === 'INSERT') {
				console.debug('Neues Memo erkannt:', payload.new.id);
				console.debug('Neue Memo-Metadaten:', payload.new.metadata);
				console.debug('Neuer Memo-Titel:', payload.new.title);

				// Check if this is the memo we're waiting for
				const isExpectedMemo = waitingForNewMemoRef.current === payload.new.id;
				const currentMemo = useMemoStore.getState().latestMemo;
				const shouldReplace = currentMemo?.isPlaceholder || !currentMemo || isExpectedMemo;

				if (shouldReplace) {
					console.debug('Replacing placeholder with new memo:', payload.new.id);

					// Clear the waiting ref
					if (isExpectedMemo) {
						console.debug('Received expected memo INSERT event:', payload.new.id);
						waitingForNewMemoRef.current = null;
					}

					// Use recording start time if available, otherwise use created_at
					const timestamp = payload.new.metadata?.recordingStartedAt
						? new Date(payload.new.metadata.recordingStartedAt)
						: new Date(payload.new.created_at);

					// Preserve audioDuration from placeholder if the new memo doesn't have it yet
					const preservedStats = {
						...(payload.new.metadata?.stats || {}),
						viewCount: payload.new.metadata?.stats?.viewCount || 0,
						shareCount: payload.new.metadata?.stats?.shareCount || 0,
						editCount: payload.new.metadata?.stats?.editCount || 0,
						// Preserve audioDuration from placeholder if database doesn't have it yet
						...(!payload.new.metadata?.stats?.audioDuration &&
							currentMemo?.metadata?.stats?.audioDuration && {
								audioDuration: currentMemo.metadata.stats.audioDuration,
							}),
					};

					// Directly set the new memo instead of calling loadLatestMemo()
					// This ensures we show the NEWLY created memo, not an old one
					useMemoStore.getState().setLatestMemo({
						id: payload.new.id,
						title: payload.new.title || 'Unbenanntes Memo',
						timestamp: timestamp,
						is_pinned: payload.new.is_pinned || false,
						source: payload.new.source,
						metadata: {
							...payload.new.metadata,
							stats: preservedStats,
						},
						tags: payload.new.tags || [],
						space: payload.new.space || null,
					});

					console.debug(
						'INSERT: Preserved audioDuration from placeholder:',
						preservedStats.audioDuration
					);
				}
			} else if (payload.event === 'DELETE') {
				console.debug('🗑️ REALTIME DELETE: Memo gelöscht', payload.old.id);

				// Prüfe, ob dies das aktuell angezeigte Memo ist
				const currentMemo = useMemoStore.getState().latestMemo;
				const isCurrentMemo = currentMemo && currentMemo.id === payload.old.id;

				if (isCurrentMemo) {
					console.debug('🗑️ REALTIME DELETE: Das gelöschte Memo ist das aktuell angezeigte Memo');
					// Lösche das Memo aus dem Store und lade das nächste
					useMemoStore.getState().setLatestMemo(null);
					setIsMemoPreviewVisible(false);
					// Lade das nächste verfügbare Memo
					setTimeout(() => {
						loadLatestMemo();
					}, 100);
				}
			} else if (payload.event === 'UPDATE') {
				console.debug('🔔 REALTIME UPDATE: Memo aktualisiert', {
					id: payload.new.id,
					title: payload.new.title,
				});

				console.debug(
					'📃 REALTIME UPDATE: Metadaten Details',
					JSON.stringify(payload.new.metadata, null, 2)
				);
				console.debug(
					'📃 REALTIME UPDATE: Source Details',
					JSON.stringify(payload.new.source, null, 2)
				);

				// Prüfe, ob dies das aktuell angezeigte Memo ist
				const currentMemo = useMemoStore.getState().latestMemo;
				const isCurrentMemo = currentMemo && currentMemo.id === payload.new.id;

				console.debug(
					`🔎 REALTIME UPDATE: ${isCurrentMemo ? 'Dies ist' : 'Dies ist NICHT'} das aktuell angezeigte Memo`
				);

				// Check if this is the current memo or if processing status has changed
				const processingStateChanged = hasProcessingStatusChanged(
					currentMemo?.metadata,
					payload.new.metadata
				);

				// Always update the UI in these cases:
				if (
					isCurrentMemo ||
					processingStateChanged ||
					payload.new.metadata?.processing?.transcription?.status === 'completed' ||
					payload.new.metadata?.processing?.headline?.status === 'completed' ||
					payload.new.metadata?.processing?.headline_and_intro?.status === 'completed' ||
					currentMemo?.id === payload.new.id
				) {
					console.debug('🔄 REALTIME UPDATE: Aktualisiere latestMemo im Store');

					// Preserve the existing timestamp if created_at is not provided in the update
					const existingMemo = useMemoStore.getState().latestMemo;

					// Use recording start time if available, otherwise preserve existing or use created_at
					let timestamp: Date;
					if (payload.new.metadata?.recordingStartedAt) {
						timestamp = new Date(payload.new.metadata.recordingStartedAt);
					} else if (payload.new.created_at) {
						timestamp = new Date(payload.new.created_at);
					} else if (existingMemo && existingMemo.id === payload.new.id) {
						timestamp = existingMemo.timestamp;
					} else {
						timestamp = new Date();
					}

					// Debug logging for timestamp handling
					console.debug('🕐 REALTIME UPDATE: Timestamp handling', {
						memoId: payload.new.id,
						payloadCreatedAt: payload.new.created_at,
						existingTimestamp: existingMemo?.timestamp,
						finalTimestamp: timestamp,
						isPreservingExisting: !payload.new.created_at && existingMemo?.id === payload.new.id,
					});

					useMemoStore.getState().setLatestMemo({
						id: payload.new.id,
						title: payload.new.title,
						timestamp: timestamp,
						is_pinned: payload.new.is_pinned ?? existingMemo?.is_pinned ?? false,
						source: payload.new.source,
						metadata: payload.new.metadata,
						// Preserve other fields that might exist
						tags: payload.new.tags || existingMemo?.tags,
						space: payload.new.space || existingMemo?.space,
					});

					// Prüfe den Status nach der Aktualisierung
					setTimeout(() => {
						console.debug('🔎 REALTIME UPDATE: Store nach Update', {
							id: useMemoStore.getState().latestMemo?.id,
							title: useMemoStore.getState().latestMemo?.title,
							metadata: useMemoStore.getState().latestMemo?.metadata
								? JSON.stringify(useMemoStore.getState().latestMemo?.metadata, null, 2)
								: null,
						});

						// Check if headline_and_intro status is completed and refresh UI if needed
						if (payload.new.metadata?.processing?.headline_and_intro?.status === 'completed') {
							console.debug('✅ REALTIME UPDATE: Headline generation completed, forcing refresh');
							refreshCurrentMemo();

							// Check if this is the user's first completed recording
							if (!hasCompletedFirstRecording && !hasSeenCompletionCelebration) {
								console.debug('🎉 First recording completed! Showing celebration toast');
								handleFirstRecordingCompleted();
							}
						}
					}, 0);

					// Always ensure the MemoPreview is visible after update
					if (!isMemoPreviewVisible) {
						console.debug('🔄 REALTIME UPDATE: Making MemoPreview visible');
						setIsMemoPreviewVisible(true);
						fadeAnim.setValue(1);
					} else {
						console.debug('🔄 REALTIME UPDATE: Updating MemoPreview in-place');
						// Preserve the existing timestamp if created_at is not provided in the update
						const existingMemo = useMemoStore.getState().latestMemo;

						// Use recording start time if available, otherwise preserve existing or use created_at
						let timestamp: Date;
						if (payload.new.metadata?.recordingStartedAt) {
							timestamp = new Date(payload.new.metadata.recordingStartedAt);
						} else if (payload.new.created_at) {
							timestamp = new Date(payload.new.created_at);
						} else if (existingMemo && existingMemo.id === payload.new.id) {
							timestamp = existingMemo.timestamp;
						} else {
							timestamp = new Date();
						}

						// Debug logging for timestamp handling
						console.debug('🕐 REALTIME UPDATE (in-place): Timestamp handling', {
							memoId: payload.new.id,
							payloadCreatedAt: payload.new.created_at,
							existingTimestamp: existingMemo?.timestamp,
							finalTimestamp: timestamp,
							isPreservingExisting: !payload.new.created_at && existingMemo?.id === payload.new.id,
						});

						const updatedMemo = {
							...existingMemo,
							id: payload.new.id,
							title: payload.new.title,
							timestamp: timestamp,
							is_pinned: payload.new.is_pinned ?? existingMemo?.is_pinned ?? false,
							source: payload.new.source,
							metadata: payload.new.metadata,
							// Tags and space might be updated too
							tags: payload.new.tags || existingMemo?.tags,
							space: payload.new.space || existingMemo?.space,
						};

						useMemoStore.getState().setLatestMemo(updatedMemo);
					}
				}

				const hasCompletedTranscription =
					payload.new.metadata?.processing?.transcription?.status === 'completed';
				const hasCompletedHeadline =
					payload.new.metadata?.processing?.headline_and_intro?.status === 'completed';

				if (hasCompletedTranscription || hasCompletedHeadline) {
					console.debug('✅ Headline-Generierung abgeschlossen, Status: COMPLETED');
				}
			}
		},
		[loadLatestMemo, hasCompletedFirstRecording, hasSeenCompletionCelebration, refreshCurrentMemo]
	);

	// Load initial memo
	useEffect(() => {
		loadLatestMemo();
	}, [loadLatestMemo]);

	// Effect to mark initial load as complete when all critical data is ready
	useEffect(() => {
		// Check if all critical data is loaded
		const isMemoReady = !isLoadingMemo || latestMemo !== null;
		const isOnboardingReady = !isOnboardingLoading;

		// Set load complete immediately when data is ready (no artificial delay)
		if (isMemoReady && isOnboardingReady && !isInitialLoadComplete) {
			console.debug('🎉 Initial load complete - showing content');
			setIsInitialLoadComplete(true);
		}
	}, [isLoadingMemo, latestMemo, isOnboardingLoading, isInitialLoadComplete]);

	// Fade in content after skeleton disappears
	useEffect(() => {
		if (isInitialLoadComplete) {
			Animated.timing(contentFadeAnim, {
				toValue: 1,
				duration: 400,
				easing: Easing.out(Easing.ease),
				useNativeDriver: true,
			}).start();
		}
	}, [isInitialLoadComplete, contentFadeAnim]);

	// Check photo status when latest memo changes
	useEffect(() => {
		if (latestMemo?.id) {
			checkPhotoStatus([latestMemo.id]).then(() => {
				// Force re-render after photo status check
				setPhotoStatusVersion((prev) => prev + 1);
			});
		}
	}, [latestMemo?.id, checkPhotoStatus]);

	// Lade das zuletzt erstellte Memo, wenn die Seite fokussiert wird
	useFocusEffect(
		useCallback(() => {
			// Don't load if we're waiting for a new memo INSERT event
			if (waitingForNewMemoRef.current) {
				console.debug(
					'Skipping loadLatestMemo - waiting for INSERT event:',
					waitingForNewMemoRef.current
				);
				return;
			}

			// Check if we have a lastViewedMemoId that needs updating
			const { lastViewedMemoId } = useMemoStore.getState();

			if (lastViewedMemoId) {
				// Longer delay when returning from memo detail to ensure DB is updated
				const timeoutId = setTimeout(() => {
					// Check again before loading
					if (!waitingForNewMemoRef.current) {
						loadLatestMemo();
					}
					// Clear the lastViewedMemoId after loading
					useMemoStore.getState().setLastViewedMemoId(null);
				}, 500);

				return () => clearTimeout(timeoutId);
			} else {
				// Normal load without delay
				loadLatestMemo();
			}
		}, [loadLatestMemo])
	);

	// Removed animateDismiss function

	// Effekt, der die MemoPreview automatisch wieder anzeigt, wenn eine neue Memo erstellt wird
	useEffect(() => {
		if (latestMemo) {
			// Update the current memo ID reference
			currentMemoIdRef.current = latestMemo.id;

			// Check if this is a new memo (different ID)
			const isNewMemo = previousMemoIdRef.current !== latestMemo.id;
			const isFirstLoad = previousMemoIdRef.current === null;

			// Update previous memo ID reference
			previousMemoIdRef.current = latestMemo.id;

			// Wenn eine neue Memo geladen wird oder sich die Memo ändert, setze die Sichtbarkeit auf true
			setIsMemoPreviewVisible(true);

			// Only start fade-in animation for new memos or first load
			if (isNewMemo && !isFirstLoad) {
				// Start fade-in animation only for new memos (not first load)
				fadeAnim.setValue(0);
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					easing: Easing.out(Easing.ease),
					useNativeDriver: true,
				}).start();

				// Increment rating counter for new memos
				// This tracks user engagement for automatic rating prompts
				incrementMemoCount();
			} else if (isFirstLoad) {
				// For first load, set opacity to 1 immediately
				fadeAnim.setValue(1);
			}

			console.debug('🔔 Neue oder aktualisierte Memo erkannt, zeige MemoPreview an');

			// Polling für Statusaktualisierungen, wenn die Memo in Verarbeitung ist
			const isProcessing =
				latestMemo.metadata?.transcriptionStatus === 'processing' ||
				latestMemo.metadata?.processing?.transcription?.status === 'processing' ||
				latestMemo.metadata?.processing?.headline_and_intro?.status === 'processing';

			if (isProcessing) {
				console.debug('🔔 Memo ist in Verarbeitung, starte Polling...');

				// Verwende eine Referenz, um den letzten Memo-Status zu verfolgen und unnötige Updates zu vermeiden
				const lastMemoStatusRef = {
					transcription: latestMemo.metadata?.processing?.transcription?.status,
					headline: latestMemo.metadata?.processing?.headline_and_intro?.status,
				};

				// Use progressive polling intervals: start at 5s, increase to 10s, then 15s
				let pollCount = 0;
				let pollDelay = 5000; // Start with 5 seconds

				const pollForUpdates = () => {
					pollCount++;

					// Increase delay progressively
					if (pollCount > 3) {
						pollDelay = 10000; // 10 seconds after 3 polls
					}
					if (pollCount > 6) {
						pollDelay = 15000; // 15 seconds after 6 polls
					}

					// Stop polling after 20 attempts (about 3-4 minutes total)
					if (pollCount > 20) {
						console.debug('🔔 Polling: Stopped after maximum attempts');
						return;
					}

					// Check if status has changed before triggering a new load
					const currentMemo = useMemoStore.getState().latestMemo;
					if (currentMemo) {
						const currentTranscriptionStatus =
							currentMemo.metadata?.processing?.transcription?.status;
						const currentHeadlineStatus =
							currentMemo.metadata?.processing?.headline_and_intro?.status;

						// Only load if status has changed or still processing
						if (
							currentTranscriptionStatus === 'processing' ||
							currentHeadlineStatus === 'processing' ||
							currentTranscriptionStatus !== lastMemoStatusRef.transcription ||
							currentHeadlineStatus !== lastMemoStatusRef.headline
						) {
							// Update status
							lastMemoStatusRef.transcription = currentTranscriptionStatus;
							lastMemoStatusRef.headline = currentHeadlineStatus;

							console.debug(
								`🔔 Polling: Loading latest memo (attempt ${pollCount}, delay: ${pollDelay}ms)`
							);

							// Don't load if we're waiting for a new memo INSERT event
							if (!waitingForNewMemoRef.current) {
								loadLatestMemo();
							} else {
								console.debug(
									'Skipping polling loadLatestMemo - waiting for INSERT:',
									waitingForNewMemoRef.current
								);
							}

							// Continue polling if still processing
							if (
								currentTranscriptionStatus === 'processing' ||
								currentHeadlineStatus === 'processing'
							) {
								pollingTimeoutRef.current = setTimeout(pollForUpdates, pollDelay);
							} else {
								console.debug('🔔 Polling: Completed - memo fully processed');
							}
						} else {
							// Continue polling if still processing
							if (
								currentTranscriptionStatus === 'processing' ||
								currentHeadlineStatus === 'processing'
							) {
								pollingTimeoutRef.current = setTimeout(pollForUpdates, pollDelay);
							}
						}
					}
				};

				// Start polling
				pollingTimeoutRef.current = setTimeout(pollForUpdates, pollDelay);

				// Cleanup timeout when component unmounts or memo changes
				return () => {
					if (pollingTimeoutRef.current) {
						clearTimeout(pollingTimeoutRef.current);

						console.debug('🔔 Polling stopped');
					}
				};
			}
		}
	}, [latestMemo]); // Entferne loadLatestMemo aus den Abhängigkeiten, um unnötige Re-Renders zu vermeiden

	// Upload audio recording to cloud storage
	const uploadAudioRecording = useCallback(
		async (
			filePath: string,
			title: string,
			spaceId: string | null,
			blueprintId: string | null,
			durationSeconds?: number, // Pass duration explicitly to avoid store reset issue
			audioFileId?: string // Audio file ID for status tracking
		) => {
			const uploadStatusStore = useUploadStatusStore.getState();

			try {
				console.debug('Starting audio upload:', {
					filePath,
					title,
					spaceId,
					blueprintId,
					durationSeconds,
					audioFileId,
				});

				// Get user data for upload (need this before creating placeholder)
				const userData = await authService.getUserFromToken();
				if (!userData) {
					Alert.alert(
						t('common.error', 'Error'),
						t('audio_archive.login_required', 'You must be logged in to upload audio files.')
					);
					return;
				}

				// Generate memoId (UUID v4) and filename with timestamp
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
				// Generate a proper UUID v4
				const memoId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
					const r = (Math.random() * 16) | 0;
					const v = c === 'x' ? r : (r & 0x3) | 0x8;
					return v.toString(16);
				});
				const fileName = `${memoId}/audio_${timestamp}.m4a`;

				// Set UPLOADING status and create placeholder memo if audioFileId is provided
				if (audioFileId) {
					await uploadStatusStore.updateStatus(audioFileId, UploadStatus.UPLOADING, {
						lastAttemptAt: Date.now(),
						memoId: memoId,
					});
					console.debug(`[Upload] Set status to UPLOADING for ${audioFileId}`);

					// Create placeholder memo card to show upload in progress
					setLatestMemo({
						id: memoId,
						title: title || 'New Recording',
						timestamp: new Date(),
						isPlaceholder: true,
						source: {
							type: 'audio',
						},
						metadata: {
							audioFileId,
							transcriptionStatus: 'uploading',
							blueprintId: blueprintId,
							stats: {
								viewCount: 0,
								shareCount: 0,
								editCount: 0,
								audioDuration: durationSeconds || 0, // Add duration for MemoPreview to display
							},
						},
						...(spaceId && {
							space: {
								id: spaceId,
								name: '', // Will be populated by MemoPreview
							},
						}),
					});
					console.debug(`[Upload] Created placeholder memo card for ${memoId}`);
				}

				// Use passed duration or fallback to 0 (duration should always be passed)
				const finalDurationMs = durationSeconds ? durationSeconds * 1000 : 0;

				// Upload to cloud storage
				const uploadResult = await cloudStorageService.uploadAudioForProcessing({
					userId: userData.id,
					filePath: filePath,
					fileName: fileName,
					durationMillis: finalDurationMs,
					title: title,
					spaceId: spaceId,
					blueprintId: blueprintId,
				});

				console.debug('Upload result:', uploadResult);

				if (uploadResult.success) {
					// Trigger the transcription process
					const transcriptionResult = await triggerTranscription({
						userId: userData.id,
						fileName: fileName,
						duration: durationSeconds || 0, // Use passed duration in seconds
						memoId: memoId,
						showAlerts: true,
						t,
						title: title,
						spaceId: spaceId,
						blueprintId: blueprintId,
					});

					if (transcriptionResult.success) {
						console.debug('Transcription triggered successfully');

						// Set SUCCESS status if audioFileId is provided
						if (audioFileId) {
							await uploadStatusStore.updateStatus(audioFileId, UploadStatus.SUCCESS, {
								uploadedAt: Date.now(),
								memoId: memoId,
							});
							console.debug(
								`[Upload] Set status to SUCCESS for ${audioFileId} with memoId ${memoId}`
							);
						}

						// Clear recording store memo to prevent preview showing stale/placeholder data
						// This ensures the preview will show fresh data from the database via realtime subscription
						useRecordingStore.getState().reset();

						// Mark that we're waiting for this specific memo's INSERT event
						// This prevents loadLatestMemo() from replacing the placeholder prematurely
						waitingForNewMemoRef.current = memoId;
						console.debug(`[Upload] Waiting for realtime INSERT event for memo ${memoId}`);

						// Safety timeout: If INSERT event doesn't arrive within 30 seconds, clear the ref and load
						setTimeout(() => {
							if (waitingForNewMemoRef.current === memoId) {
								console.debug(`[Upload] INSERT event timeout for memo ${memoId}, loading manually`);
								waitingForNewMemoRef.current = null;
								loadLatestMemo();
							}
						}, 30000);
					} else {
						console.error('Failed to trigger transcription:', transcriptionResult.error);

						// Set FAILED status if audioFileId is provided
						if (audioFileId) {
							await uploadStatusStore.updateStatus(audioFileId, UploadStatus.FAILED, {
								lastError: transcriptionResult.userMessage || transcriptionResult.error,
								isNetworkError: transcriptionResult.isNetworkError,
							});
							console.debug(
								`[Upload] Set status to FAILED for ${audioFileId}: Transcription failed`
							);
						}
					}
				} else {
					// Upload failed - set status to FAILED
					if (audioFileId) {
						await uploadStatusStore.updateStatus(audioFileId, UploadStatus.FAILED, {
							lastError: uploadResult.userMessage || 'Upload failed',
							isNetworkError: uploadResult.isNetworkError,
						});
						console.debug(`[Upload] Set status to FAILED for ${audioFileId}: Upload failed`);
					}

					// Show error to user with archive hint for network errors
					const errorMessage = uploadResult.isNetworkError
						? t(
								'audio_archive.upload_failed_with_archive_hint',
								'Upload failed. Your recording is safely stored in the Audio Archive where you can retry the upload later.'
							)
						: uploadResult.userMessage || t('upload.failed', 'Failed to upload audio');

					Alert.alert(t('common.error', 'Error'), errorMessage);
				}
			} catch (error) {
				console.error('Error uploading audio:', error);

				// Set FAILED status if audioFileId is provided
				if (audioFileId) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const isNetworkError =
						errorMessage.toLowerCase().includes('network') ||
						errorMessage.toLowerCase().includes('connection');
					await uploadStatusStore.updateStatus(audioFileId, UploadStatus.FAILED, {
						lastError: errorMessage,
						isNetworkError,
					});
					console.debug(`[Upload] Set status to FAILED for ${audioFileId}: ${errorMessage}`);

					// Show error with archive hint for network errors
					const catchErrorMessage = isNetworkError
						? t(
								'audio_archive.upload_failed_with_archive_hint',
								'Upload failed. Your recording is safely stored in the Audio Archive where you can retry the upload later.'
							)
						: t('upload.unexpected_error', 'An unexpected error occurred during upload');

					Alert.alert(t('common.error', 'Error'), catchErrorMessage);
				} else {
					// No audioFileId, show generic error
					Alert.alert(
						t('common.error', 'Error'),
						t('upload.unexpected_error', 'An unexpected error occurred during upload')
					);
				}

				// Clear waiting ref on error
				waitingForNewMemoRef.current = null;
			}
		},
		[t, loadLatestMemo, setLatestMemo]
	);

	// Callback für das Ende der Aufnahme - wird nur aufgerufen, wenn die Aufnahme tatsächlich gestoppt wurde
	const handleRecordingComplete = useCallback(
		(
			result: string,
			title?: string,
			spaceId?: string | null,
			blueprintId?: string | null,
			durationSeconds?: number,
			audioFileId?: string
		) => {
			// Use passed duration or fallback to local state (though passed is more accurate)
			const finalDuration = durationSeconds || recordingDuration;

			// Track recording stopped
			track('recording_stopped', {
				duration_seconds: finalDuration,
				reason: 'manual',
				blueprint_id: blueprintId || selectedBlueprintId,
				space_id: spaceId || selectedSpaceId,
				has_result: !!result,
			});

			// Setze Status zurück auf IDLE
			setRecordingStatus(RecordingStatus.IDLE);
			setRecordingStartTime(null);
			setRecordingDuration(0);

			// Die übergebenen Parameter haben Vorrang vor den lokalen States
			const finalSpaceId = spaceId !== undefined ? spaceId : selectedSpaceId;
			const finalBlueprintId = blueprintId !== undefined ? blueprintId : selectedBlueprintId;

			// Debugging-Informationen ausgeben
			console.debug('Recording completed with:', {
				result,
				title,
				spaceId: finalSpaceId,
				blueprintId: finalBlueprintId,
				appendToMemoId,
				durationSeconds: finalDuration,
			});

			// Die tatsächliche Backend-Verarbeitung - pass duration and audioFileId explicitly
			uploadAudioRecording(
				result,
				title || 'Memo',
				finalSpaceId,
				finalBlueprintId,
				finalDuration,
				audioFileId
			);

			// Wenn wir eine Aufnahme zu einem bestehenden Memo hinzufügen, navigieren wir zurück zum Memo
			if (appendToMemoId) {
				console.debug('Navigiere zurück zum Memo:', appendToMemoId);
				// Setze den State zurück
				setAppendToMemoId(null);
				// Navigiere zurück zum Memo
				router.push({
					pathname: '/(protected)/(memo)/[id]',
					params: { id: appendToMemoId },
				});
			}
			// Hinweis: Wir müssen hier nicht mehr manuell das neueste Memo laden,
			// da das Realtime-Abonnement dies automatisch erledigt, sobald das neue Memo
			// in der Datenbank erstellt wurde

			// Refresh credits after 3 seconds since transcription consumes credits
			setTimeout(() => {
				refreshCredits();
			}, 3000);
		},
		[
			selectedSpaceId,
			selectedBlueprintId,
			appendToMemoId,
			refreshCredits,
			recordingDuration,
			track,
			uploadAudioRecording,
		]
	);

	// Handle sharing a memo
	const handleShareMemo = async (memo: any) => {
		try {
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
		}
	};

	// Header-Konfiguration mit dem useHeader-Hook aktualisieren
	const { updateConfig, headerHeight } = useHeader();
	const textColor = isDark ? '#FFFFFF' : '#000000';

	const pageTitleComponent = useMemo(
		() => (
			<View style={{ alignItems: 'center', paddingBottom: 0, marginTop: headerHeight - 20 }}>
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
					Memoro
				</Text>
				{showManaBadge && (
					<View style={{ marginTop: 8 }}>
						<ManaCounter />
					</View>
				)}
			</View>
		),
		[textColor, headerHeight, showManaBadge]
	);

	// Handle blueprint selection
	const handleBlueprintSelect = useCallback(
		(blueprintId: string | null) => {
			setSelectedBlueprintId(blueprintId);
			console.debug('Selected blueprint ID:', blueprintId);

			// Track blueprint selection
			track('blueprint_selected', {
				blueprint_id: blueprintId,
				is_standard: blueprintId === STANDARD_BLUEPRINT_ID,
				space_id: selectedSpaceId,
			});
		},
		[selectedSpaceId, track]
	);

	// Update header when blueprint selection changes
	useEffect(() => {
		if (selectedBlueprintId && selectedBlueprintId !== STANDARD_BLUEPRINT_ID) {
			// Find the blueprint name to display in the header
			const findBlueprintName = async () => {
				try {
					const supabase = await getAuthenticatedClient();

					const { data } = await supabase
						.from('blueprints')
						.select('name')
						.eq('id', selectedBlueprintId)
						.single();

					if (data) {
						const lang = currentLanguage.startsWith('de') ? 'de' : 'en';
						const blueprintName =
							data.name?.[lang] || data.name?.en || data.name?.de || 'Blueprint';
						console.debug('Blueprint name for header:', blueprintName, 'from data:', data);

						// Update header with selected blueprint
						updateConfig({
							title: '',
							showTitle: false,
							showBackButton: false,
							backgroundColor: 'transparent',
							rightIcons: [],
							selectedTags: [{ id: selectedBlueprintId, name: blueprintName, color: '#f8d62b' }],
							onTagRemove: (tagId) => {
								if (tagId === selectedBlueprintId) {
									setSelectedBlueprintId(null);
								}
							},
							isHomePage: true,
						});
					}
				} catch (error) {
					console.debug('Error fetching blueprint name:', error);
				}
			};

			findBlueprintName();
		} else {
			// Reset header when no blueprint is selected or standard blueprint is selected
			updateConfig({
				title: '',
				showTitle: false,
				showBackButton: false,
				backgroundColor: 'transparent',
				rightIcons: [],
				selectedTags: [],
				isHomePage: true,
			});
		}
	}, [selectedBlueprintId]);

	// Check for migration notification when component mounts and settings are loaded
	useEffect(() => {
		if (settings?.migration?.showMigratedNotification === true) {
			console.debug('Migration notification flag detected, showing modal');
			setShowMigrationModal(true);
		}
	}, [settings?.migration?.showMigratedNotification]);

	// Handle closing the migration modal
	const handleCloseMigrationModal = useCallback(async () => {
		setShowMigrationModal(false);
		try {
			// Update the setting to false so it doesn't show again
			// Only update if migration settings exist
			if (settings?.migration) {
				await updateMemoroSettings({
					migration: {
						...settings.migration,
						showMigratedNotification: false,
					},
				});
				console.debug('Migration notification flag cleared');
			}
		} catch (error) {
			console.error('Failed to update migration notification setting:', error);
		}
	}, [updateMemoroSettings, settings?.migration]);

	// Reset header configuration when page is focused
	useFocusEffect(
		useCallback(() => {
			// Show onboarding toast for record page
			console.debug('🏠 HOME: useFocusEffect called, calling showPageOnboardingToast for record');
			const result = showPageOnboardingToast('record');
			console.debug('🏠 HOME: showPageOnboardingToast result:', result);

			// IMMEDIATELY reset header to prevent icon flickering
			// Set a clean header state first, then update with blueprint if needed
			updateConfig({
				title: '',
				showTitle: false,
				showBackButton: false,
				backgroundColor: 'transparent',
				rightIcons: [], // Clear icons immediately
				selectedTags: [], // Clear tags immediately
				isHomePage: true,
			});

			// Then handle blueprint updates asynchronously if needed
			if (selectedBlueprintId && selectedBlueprintId !== STANDARD_BLUEPRINT_ID) {
				// Find and set the blueprint in header
				const findBlueprintName = async () => {
					try {
						const supabase = await getAuthenticatedClient();

						const { data } = await supabase
							.from('blueprints')
							.select('name')
							.eq('id', selectedBlueprintId)
							.single();

						if (data) {
							const lang = currentLanguage.startsWith('de') ? 'de' : 'en';
							const blueprintName =
								data.name?.[lang] || data.name?.en || data.name?.de || 'Blueprint';

							// Update header with selected blueprint
							updateConfig({
								title: '',
								showTitle: false,
								showBackButton: false,
								backgroundColor: 'transparent',
								rightIcons: [], // Keep icons cleared
								selectedTags: [{ id: selectedBlueprintId, name: blueprintName, color: '#f8d62b' }],
								onTagRemove: (tagId) => {
									if (tagId === selectedBlueprintId) {
										setSelectedBlueprintId(null);
									}
								},
								isHomePage: true,
							});
						}
					} catch (error) {
						console.debug('Error fetching blueprint name:', error);
					}
				};

				findBlueprintName();
			}

			// Cleanup when leaving home page
			return () => {
				cleanupPageToast('record');
			};
		}, [selectedBlueprintId])
	);

	// Satellite-Buttons für das radiale Layout um den Recording-Button
	const micIconColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.text
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.text;

	const satelliteButtons: SatelliteButton[] = useMemo(() => {
		const buttons: SatelliteButton[] = [];
		if (showLanguageButton) {
			buttons.push({
				key: 'language',
				showWhen: 'always',
				element: (
					<MultiLanguageSelector
						buttonMode={true}
						size={46}
						languages={supportedAzureLanguages}
						selectedLanguages={recordingLanguages}
						onToggleLanguage={handleLanguageToggle}
						title={t('language.select_recording_language', 'Aufnahmesprache auswählen')}
					/>
				),
			});
		}
		if (showMicrophoneButton) {
			buttons.push({
				key: 'microphone',
				icon: 'mic-outline',
				onPress: () => setIsMicrophoneSelectorVisible(true),
				showWhen: 'always',
			});
		}
		return buttons;
	}, [
		showLanguageButton,
		showMicrophoneButton,
		supportedAzureLanguages,
		recordingLanguages,
		handleLanguageToggle,
		t,
		micIconColor,
	]);

	// Register BlueprintSelector via BottomBar system
	const blueprintSelectorContent = useMemo(
		() =>
			showBlueprints ? (
				<BlueprintSelector
					selectedBlueprintId={selectedBlueprintId}
					onSelectBlueprint={handleBlueprintSelect}
				/>
			) : null,
		[showBlueprints, selectedBlueprintId, handleBlueprintSelect]
	);

	useBottomBar(
		showBlueprints
			? {
					id: 'home-blueprints',
					priority: 0,
					collapsedIcon: 'rectangle-dashed',
					collapsible: true,
					content: blueprintSelectorContent,
				}
			: null
	);

	// Register AdviceCarousel via BottomBar system
	const adviceCarouselContent = useMemo(
		() => (
			<AdviceCarousel
				blueprintId={selectedBlueprintId!}
				language={currentLanguage.startsWith('de') ? 'de' : 'en'}
			/>
		),
		[selectedBlueprintId, currentLanguage]
	);

	useBottomBar(
		selectedBlueprintId && showBlueprints
			? {
					id: 'home-advice',
					priority: 10,
					collapsedIcon: 'bulb-outline',
					collapsible: false,
					content: adviceCarouselContent,
				}
			: null
	);

	// Register compact MemoPreview via BottomBar system
	const handleMemoPreviewPress = useCallback(async () => {
		if (latestMemo && latestMemo.id) {
			try {
				const supabase = await getAuthenticatedClient();
				const { data, error } = await supabase
					.from('memos')
					.select('id')
					.eq('id', latestMemo.id)
					.single();
				if (error || !data) {
					loadLatestMemo();
					return;
				}
			} catch (error) {
				console.debug('Error checking memo existence:', error);
			}
			setLastViewedMemoId(latestMemo.id);
			if (latestMemo.metadata?.stats?.viewCount === 0) {
				incrementLocalViewCount(latestMemo.id);
			}
			router.push(`/(protected)/(memo)/${latestMemo.id}`);
		}
	}, [latestMemo, loadLatestMemo, incrementLocalViewCount]);

	const memoPreviewContent = useMemo(() => {
		const barTextColor = isDark ? '#FFFFFF' : '#000000';
		const subtextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

		if (recordingStatus === RecordingStatus.RECORDING && recordingStartTime) {
			const mins = Math.floor(recordingDuration / 60);
			const secs = recordingDuration % 60;
			const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
			return (
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 16,
						paddingVertical: 10,
					}}
				>
					<Icon name="radio-button-on" size={16} color="#FF3B30" />
					<Text
						style={{ fontSize: 15, fontWeight: '600', color: barTextColor, marginLeft: 8, flex: 1 }}
						numberOfLines={1}
					>
						{t('memo.status.recording_in_progress')}
					</Text>
					<Text style={{ fontSize: 13, color: subtextColor }}>{durationStr}</Text>
				</View>
			);
		}
		if (latestMemo && isMemoPreviewVisible) {
			const title = latestMemo.title || t('memo.untitled', 'Untitled');
			const viewCount = latestMemo.metadata?.stats?.viewCount ?? 0;
			const label =
				viewCount === 0 ? t('memo.new_memo', 'Neue Memo:') : t('memo.last_memo', 'Letzte Memo:');
			return (
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 16,
						paddingVertical: 10,
					}}
				>
					<Pressable onPress={handleMemoPreviewPress}>
						<Icon
							name="document-text-outline"
							size={16}
							color={barTextColor}
							style={{ opacity: 0.5 }}
						/>
					</Pressable>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={{ marginLeft: 8, flex: 1 }}
					>
						<Pressable onPress={handleMemoPreviewPress}>
							<Text style={{ fontSize: 15, fontWeight: '500', color: barTextColor }}>
								<Text style={{ color: subtextColor, fontWeight: '400' }}>{label} </Text>
								{title}
							</Text>
						</Pressable>
					</ScrollView>
				</View>
			);
		}
		return null;
	}, [
		recordingStatus,
		recordingStartTime,
		recordingDuration,
		latestMemo,
		isMemoPreviewVisible,
		isDark,
		t,
		handleMemoPreviewPress,
	]);

	const showMemoPreviewBar =
		(recordingStatus === RecordingStatus.RECORDING && recordingStartTime) ||
		(latestMemo && isMemoPreviewVisible);

	useBottomBar(
		showMemoPreviewBar && showMemoPreviewSetting
			? {
					id: 'home-memo-preview',
					priority: 20,
					collapsedIcon: 'document-text-outline',
					collapsible: true,
					content: memoPreviewContent,
				}
			: null
	);

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<View style={[styles.container, { backgroundColor: pageBackgroundColor }]}>
				{/* Show skeleton loader during initial load */}
				{!isInitialLoadComplete ? (
					<HomePageSkeleton
						recordingButtonSize={recordingButtonSize}
						showLanguageButton={showLanguageButton}
					/>
				) : (
					<Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>
						{pageTitleComponent}
						{/* Recording Button mit absoluter Positionierung - bleibt immer zentriert */}
						<View
							style={[
								styles.buttonContainer,
								{
									transform: [{ translateY: -(recordingButtonSize / 2 + 10) }], // Zentriert basierend auf Button-Größe + padding
								},
							]}
						>
							<View style={styles.buttonWrapper}>
								<View style={styles.buttonBackground}>
									<RecordingButton
										size={recordingButtonSize}
										onPress={handleRecordingStart}
										onRecordingComplete={handleRecordingComplete}
										title="Memo"
										spaceId={selectedSpaceId}
										blueprintId={selectedBlueprintId}
										satelliteButtons={satelliteButtons}
									/>
								</View>

								{/* Recording instruction with arrow */}
								{showRecordingInstructionSetting && showRecordingInstruction && (
									<Animated.View
										style={[styles.recordingInstructionContainer, { opacity: instructionOpacity }]}
									>
										<View style={[styles.instructionArrow, { opacity: 0.6 }]}>
											<Icon
												name="chevron-up-outline"
												size={24}
												color={
													isDark
														? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.text
														: (colors as any).theme?.extend?.colors?.[themeVariant]?.text
												}
											/>
										</View>
										<Text
											variant="body"
											style={[
												styles.instructionText,
												{
													color: isDark
														? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.text
														: (colors as any).theme?.extend?.colors?.[themeVariant]?.text,
												},
											]}
										>
											{t('recording.start_recording')}
										</Text>
									</Animated.View>
								)}
							</View>
						</View>

						{/* MemoPreview now managed via useBottomBar */}

						{/* BlueprintSelector and AdviceCarousel now managed via useBottomBar */}

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
								transcript={getTranscriptText(selectedMemoForShare)}
								audioUrl={selectedMemoForShare.audioUrl}
							/>
						)}

						{/* Insufficient Credits Modal - Removed in favor of global interceptor */}

						{/* Microphone Selector Modal */}
						<MicrophoneSelector
							isVisible={isMicrophoneSelectorVisible}
							onClose={() => setIsMicrophoneSelectorVisible(false)}
							inputs={availableInputs}
							selectedInputUid={preferredInputUid}
							onSelectInput={setPreferredInput}
						/>

						{/* Permission Denied Modal */}
						<PermissionDeniedModal
							isVisible={permissionDeniedError}
							onClose={clearPermissionDeniedError}
							canAskAgain={canAskAgainForPermission}
							onRetry={handlePermissionRetry}
						/>

						{/* Recording Recovery Modal - shown when an interrupted recording is detected */}
						<RecordingRecoveryModal
							isVisible={showRecoveryPrompt}
							onClose={dismissRecoveryPrompt}
							orphanedRecording={orphanedRecording}
							onRecover={recoverOrphanedRecording}
							onDiscard={discardOrphanedRecording}
							isRecovering={isRecoveringRecording}
						/>
					</Animated.View>
				)}

				{/* Migration Notification Modal - always rendered */}
				<MigrationNotificationModal
					isVisible={showMigrationModal}
					onClose={handleCloseMigrationModal}
					subscriptionPlanId={settings?.migration?.subscription_plan_id}
					isActiveSubscription={settings?.migration?.is_active_subscription}
					migrationStats={
						settings?.migration
							? (() => {
									// Debug: Log migration settings
									console.log('🎯 Index - Full migration settings:', settings.migration);
									console.log('🏷️ Index - tags_count value:', settings.migration.tags_count);

									const stats = {
										memos_count: settings.migration.memos_count || 0,
										memories_count: settings.migration.memories_count || 0,
										images_count: settings.migration.images_count || 0,
										tags_count: settings.migration.tags_count || 0,
										migrated_at: settings.migration.migrated_at || new Date().toISOString(),
									};

									console.log('📦 Index - Prepared stats for modal:', stats);
									return stats;
								})()
							: undefined
					}
				/>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
	},
	buttonContainer: {
		position: 'absolute',
		top: '50%',
		left: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 30, // Höherer z-index als alle anderen Elemente (MemoPreview hat 20)
	},
	buttonWrapper: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 30, // Höherer z-index als alle anderen Elemente
		// Dynamische Zentrierung mit transform basierend auf Button-Größe
		// wird zur Laufzeit mit recordingButtonSize berechnet
	},
	buttonBackground: {
		padding: 10,
		borderRadius: 100,
		zIndex: 30, // Höherer z-index als alle anderen Elemente
	},
	spaceSelectorContainer: {
		position: 'absolute',
		left: -71,
		top: '50%',
		transform: [{ translateY: -25 }],
		zIndex: 10,
	},
	spaceSelectorCircle: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	// Language und Mic Buttons werden jetzt als satelliteButtons an RecordingButton übergeben
	settingsButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center',
	},
	// Add button styles removed

	blueprintSelectorContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 10,
		minHeight: 60, // Feste Mindesthöhe verhindert Layout-Shift
	},
	adviceCarouselContainer: {
		width: '100%',
		marginTop: 30,
		alignItems: 'center',
		justifyContent: 'center',
	},
	adviceCarouselContainerAbsolute: {
		position: 'absolute',
		bottom: 60, // Direkt über dem Blueprint-Selector
		left: 0,
		right: 0,
		zIndex: 40, // Höher als der Recording-Button (zIndex: 30)
		minHeight: 80, // Feste Mindesthöhe verhindert Layout-Shift
	},
	// memoPreviewContainerAbsolute and memoPreviewTouchable removed - MemoPreview now in BottomBar
	recordingInstructionContainer: {
		position: 'absolute',
		top: '100%',
		left: 0,
		right: 0,
		marginTop: 12,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 35, // Higher than all other elements to ensure visibility
	},
	instructionArrow: {
		marginBottom: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	instructionText: {
		fontSize: 16,
		fontWeight: '500',
		textAlign: 'center',
		opacity: 0.7,
	},
});
