import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { TimeoutId } from '~/features/core/types/timer.types';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withSpring,
	withRepeat,
	withSequence,
	Easing,
	cancelAnimation,
	interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Alert from './Alert';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useThemeColors } from '~/features/theme/hooks/useThemeColors';
// Using centralized recording store for state management
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import { RecordingStatus } from '~/features/audioRecordingV2/types';
import MemoroLogo from './MemoroLogo';
import Text from './Text';
import Icon from './Icon';
import { useMemoStore } from '~/features/memos/store/memoStore';
import { useSettingsStore } from '~/features/settings';
import { useToastActions } from '~/features/toast';
import { useTranslation } from 'react-i18next';
import { recordingSoundManager } from '~/features/audioRecordingV2';

interface RecordingButtonProps {
	size?: number;
	onPress?: () => void;
	onRecordingComplete?: (
		result: string,
		title?: string,
		spaceId?: string | null,
		blueprintId?: string | null,
		durationSeconds?: number,
		audioFileId?: string
	) => void;
	maxSegmentDuration?: number;
	title?: string;
	spaceId?: string | null;
	blueprintId?: string | null;
}

/**
 * RecordingButton-Komponente
 *
 * Eine interaktive Schaltfläche für Audio-Aufnahmen mit verschiedenen Zuständen.
 *
 * Beispiel:
 * ```tsx
 * <RecordingButton
 *   size={120}
 *   onPress={() => console.log('Button gedrückt')}
 *   onRecordingComplete={(result) => console.log('Aufnahme beendet', result)}
 * />
 * ```
 */
function RecordingButton({
	size: propSize,
	onPress,
	onRecordingComplete,
	maxSegmentDuration = 60 * 1000, // 1 minute by default
	title = 'Memo',
	spaceId = null,
	blueprintId = null,
}: RecordingButtonProps) {
	// Calculate responsive size if not provided
	const responsiveSize = useMemo(() => {
		if (propSize) return propSize;

		const { width, height } = Dimensions.get('window');
		const minDimension = Math.min(width, height);

		// Calculate size based on screen size with reasonable constraints
		// Small devices (iPhone SE): ~320px -> 140px button
		// Medium devices (iPhone 13): ~390px -> 170px button
		// Large devices (iPhone Pro Max): ~430px -> 200px button
		const calculatedSize = Math.max(140, Math.min(220, minDimension * 0.44));

		return Math.round(calculatedSize);
	}, [propSize]);

	const size = responsiveSize;
	const { isDark, themeVariant } = useTheme();
	const { developerMode } = useSettingsStore();
	const { showSuccess, showInfo } = useToastActions();
	const { t } = useTranslation();

	// State for hover effect (web only)
	const [isHovered, setIsHovered] = useState(false);

	// Audio-Level-Überwachung
	const isWebPlatform = Platform.OS === 'web';

	// ✅ Track if we're canceling (to prevent upload)
	const isCancelingRef = useRef(false);

	// Get theme colors with proper typing
	const themeColors = useThemeColors();
	const contentBackgroundColor = themeColors.contentBackground;
	const contentBackgroundHoverColor = themeColors.contentBackgroundHover;

	// Get recording store values first (before using them in effects)
	const {
		status,
		startRecording,
		stopRecording,
		pauseRecording,
		resumeRecording,
		resetRecording,
		isRecording,
		isPaused,
		duration,
		metering: storeMeteringValue,
		setRecordingInfo,
		initialize,
		reinitialize,
		isInitialized,
	} = useRecordingStore();

	// (Keine Modal-States mehr nötig, da wir native Alerts verwenden)
	const rotationAnim = useSharedValue(0);
	const audioLevelAnim = useSharedValue(0);

	// Audio-Level Animation basierend auf Store-Metering
	useEffect(() => {
		if (!isWebPlatform && storeMeteringValue !== undefined && isRecording) {
			// Verbesserte Normalisierung für Audio-Level
			// expo-audio gibt Werte zwischen -160 (Stille) und 0 (Maximum) zurück
			// Wir normalisieren von -160dB bis 0dB zu 0 bis 1
			const normalizedLevel = Math.max(0, Math.min(1, (storeMeteringValue + 160) / 160));
			audioLevelAnim.value = withTiming(normalizedLevel, { duration: 100 });
		} else if (!isRecording) {
			// Reset animation when not recording
			audioLevelAnim.value = withTiming(0, { duration: 200 });
		}
	}, [storeMeteringValue, isRecording, isWebPlatform, audioLevelAnim]);

	// Haptic Feedback Funktionen
	const triggerStartHaptic = useCallback(async () => {
		try {
			// Kräftiges Feedback für Recording Start
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	}, []);

	const triggerPauseHaptic = useCallback(async () => {
		try {
			// Mittleres Feedback für Pause
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	}, []);

	const triggerStopHaptic = useCallback(async () => {
		try {
			// Success-Notification für erfolgreiches Beenden
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	}, []);

	const triggerResumeHaptic = useCallback(async () => {
		try {
			// Leichtes Feedback für Resume
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	}, []);

	const triggerCancelHaptic = useCallback(async () => {
		try {
			// Warning-Notification für Abbruch
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	}, []);

	// Use global recording store for centralized state
	const { uri, savedFile } = useRecordingStore();

	// Note: RecordingStatus.UPLOADING doesn't exist in the enum
	// Upload state is handled internally by the recording store

	// Farben aus dem Theme-System direkt aus dem Theme-Kontext verwenden

	// Verwende themeVariant um die richtige Farbe aus der Tailwind-Konfiguration auszuwählen
	const textColor = themeColors.text;
	const primaryColor = themeColors.primary;

	// Verwende den primaryColor als themeColor für den Hauptbutton
	const themeColor = primaryColor;

	// Setze den Hintergrund basierend auf dem Aufnahmestatus
	const backgroundColor = isRecording ? themeColor : 'transparent';
	const borderColor = themeColor;

	// Metering is now handled automatically through the store

	// Cleanup beim Unmount
	useEffect(() => {
		return () => {
			// Cleanup all registered timeouts
			timeoutRegistry.current.forEach(clearTimeout);
			timeoutRegistry.current.clear();

			// No longer need to cleanup metering interval since we use store values
			if (pressTimeout.current) {
				clearTimeout(pressTimeout.current);
				pressTimeout.current = null;
			}
			if (halfwayTimeout.current) {
				clearTimeout(halfwayTimeout.current);
				halfwayTimeout.current = null;
			}

			// Cancel all animations to prevent memory leaks
			cancelAnimation(rotationAnim);
			cancelAnimation(audioLevelAnim);
			cancelAnimation(scaleAnim);
			cancelAnimation(pressRotationAnim);
			cancelAnimation(fillRadiusAnim);
			cancelAnimation(uploadProgressAnim);
			cancelAnimation(timerOpacity);
			cancelAnimation(timerTranslateY);

			// Reset all shared values to prevent memory retention
			rotationAnim.value = 0;
			audioLevelAnim.value = 0;
			scaleAnim.value = 1;
			pressRotationAnim.value = 0;
			fillRadiusAnim.value = 0;
			uploadProgressAnim.value = 0;
			timerOpacity.value = 0;
			timerTranslateY.value = -20;

			// Reset state refs
			isPressedDownRef.current = false;
		};
	}, []);

	// Timeout registry for cleanup
	const timeoutRegistry = useRef(new Set<ReturnType<typeof setTimeout>>());

	const registerTimeout = useCallback((timeoutId: ReturnType<typeof setTimeout>) => {
		timeoutRegistry.current.add(timeoutId);
		return timeoutId;
	}, []);

	const clearRegisteredTimeout = useCallback((timeoutId: ReturnType<typeof setTimeout>) => {
		clearTimeout(timeoutId);
		timeoutRegistry.current.delete(timeoutId);
	}, []);

	// Press & Hold State Management
	const [isPressedDown, setIsPressedDown] = useState(false);
	const isPressedDownRef = useRef(false);
	const pressStartTime = useRef<number>(0);
	const pressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const halfwayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null); // For medium haptic
	const PRESS_HOLD_DURATION = 720; // 0.72 seconds for one full rotation

	// ✅ Track if continuous rotation was manually started (to prevent duplicate animation)
	const hasManuallyStartedRotation = useRef(false);

	// Toast system - show toast with 4 second cooldown period
	const lastToastTime = useRef<number>(0);
	const TOAST_COOLDOWN_PERIOD = 4000; // 4 seconds constant cooldown
	const [shouldShowToastOnNextPress, setShouldShowToastOnNextPress] = useState(true);
	const pressCount = useRef<number>(0); // Counter for button presses to show toast on second attempt

	// Simple toast decision function - 4 second cooldown
	const shouldShowInstructionToast = useCallback(() => {
		const now = Date.now();
		const timeSinceLastToast = now - lastToastTime.current;

		// If this is the very first attempt or cooldown period has passed
		if (lastToastTime.current === 0 || timeSinceLastToast > TOAST_COOLDOWN_PERIOD) {
			lastToastTime.current = now;
			console.debug('🎯 Showing instruction toast');
			return true;
		}

		console.debug('🤫 Suppressing instruction toast - still in cooldown', {
			timeRemaining: Math.round((TOAST_COOLDOWN_PERIOD - timeSinceLastToast) / 1000) + 's',
		});

		return false;
	}, []);

	// Animation values for press & hold
	const scaleAnim = useSharedValue(1);
	const pressRotationAnim = useSharedValue(0);

	// Animation value for radial fill when recording starts
	const fillRadiusAnim = useSharedValue(0);

	// Animation value for upload progress (0 = full yellow, 1 = full white)
	const uploadProgressAnim = useSharedValue(0);

	// Rotations-Effekt während der Aufnahme und Press & Hold
	useEffect(() => {
		if (isRecording && !isPaused && !isPressedDown) {
			// ✅ Skip starting rotation if it was already manually started
			// This prevents duplicate animation when releasing the button
			if (!hasManuallyStartedRotation.current) {
				console.debug('Starting continuous recording rotation');
				// Start from where press rotation ended (360°) for smooth transition
				rotationAnim.value = withRepeat(
					withTiming(360 + 3600, {
						// Start from 360° for seamless transition
						duration: 30000, // 30 seconds for 10 rotations
						easing: Easing.linear,
					}),
					-1,
					false
				);
			} else {
				console.debug('Skipping rotation start - already manually started');
			}
		} else if (isPaused) {
			// Bei Pause: Animation stoppen, Position beibehalten
			cancelAnimation(rotationAnim);
			// ✅ FIX: Reset the manual start flag when paused so resume can restart animation
			hasManuallyStartedRotation.current = false;
			console.debug('Animation paused - manual start flag reset');
		} else if (status === RecordingStatus.STOPPED) {
			// Bei normalem Beenden: Die Rotation wird jetzt vom Press & Hold Handler gehandhabt
			// Hier nur die radiale Füllung zurückziehen
			console.debug('🔄 Recording stopped - fillRadius animation only');

			// Reset manual rotation flag for next recording
			hasManuallyStartedRotation.current = false;

			// Radiale Füllung zurückziehen
			fillRadiusAnim.value = withTiming(0, {
				duration: 400, // Slower retraction for better visibility
				easing: Easing.bezier(0.4, 0, 0.6, 1), // Slightly faster at the end for nice finish
			});

			// Upload-Progress zurücksetzen
			uploadProgressAnim.value = 0;
		} else if (!isRecording && !isPressedDown) {
			// Bei Abbruch/Cancel: Rückwärts zur Ausgangsposition (0°)
			cancelAnimation(rotationAnim);
			rotationAnim.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });

			// Reset manual rotation flag for next recording
			hasManuallyStartedRotation.current = false;

			// Radiale Füllung zurücksetzen
			fillRadiusAnim.value = withTiming(0, {
				duration: 400, // Slower retraction for better visibility
				easing: Easing.bezier(0.4, 0, 0.6, 1), // Slightly faster at the end for nice finish
			});

			// Upload-Progress zurücksetzen
			uploadProgressAnim.value = 0;
		}
	}, [isRecording, isPaused, status, rotationAnim, isPressedDown]);

	// Zugriff auf den Memo-Store für die Aktualisierung des neuesten Memos
	const { loadLatestMemo } = useMemoStore();

	// Track component mount state
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;

		// ✅ CRITICAL: Initialize recording store on mount if not already initialized
		// This ensures permissions are checked before first recording attempt
		if (!isInitialized) {
			console.debug('🎬 Initializing recording store on component mount...');
			initialize().catch((error) => {
				console.error('Failed to initialize recording store:', error);
			});
		}

		// Preload sounds on component mount
		recordingSoundManager.preloadSounds().catch((error) => {
			console.debug('Failed to preload sounds:', error);
		});

		return () => {
			isMountedRef.current = false;
		};
	}, [isInitialized, initialize]);

	// Effekt für die Benachrichtigung über abgeschlossene Aufnahmen
	useEffect(() => {
		let timer: TimeoutId | null = null;

		// Nur den onRecordingComplete-Callback aufrufen, wenn wir tatsächlich eine Aufnahme haben
		// ✅ FIX: Don't upload if user canceled the recording
		if (status === RecordingStatus.STOPPED && savedFile && !isCancelingRef.current) {
			// Übergebe die URI der gespeicherten Datei, den Titel, die Space ID, die Blueprint ID, die Dauer und die Audio-Datei-ID
			onRecordingComplete?.(
				savedFile.uri,
				title,
				spaceId,
				blueprintId,
				savedFile.duration,
				savedFile.id
			);

			// Lade das neueste Memo nach einer kurzen Verzögerung
			// Dies ist ein Fallback, falls das Realtime-Abonnement nicht funktioniert
			timer = setTimeout(() => {
				if (isMountedRef.current) {
					loadLatestMemo();
				}
			}, 1000);

			// Zurücksetzen des Stores nach Abschluss
			resetRecording();
		} else if (status === RecordingStatus.STOPPED && isCancelingRef.current) {
			// ✅ Recording was canceled, just reset without uploading
			console.debug('🗑️ Recording canceled, skipping upload');
			resetRecording();
			isCancelingRef.current = false; // Reset flag
		}

		// Wenn wir im Uploading-Status sind, zeigen wir den Ladeindikator an
		// Der Status wird automatisch zurückgesetzt, wenn der Upload abgeschlossen ist

		return () => {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		};
	}, [
		status,
		savedFile,
		onRecordingComplete,
		title,
		spaceId,
		blueprintId,
		resetRecording,
		loadLatestMemo,
	]);

	// Formatiert die Aufnahmedauer als MM:SS
	const formatDuration = (milliseconds: number) => {
		const totalSeconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const remainingSeconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	// Aufnahme tatsächlich beenden und speichern
	const handleCompleteRecording = useCallback(async () => {
		console.debug('🎯 handleCompleteRecording called');
		try {
			// Beende die Aufnahme mit dem zentralisierten Store
			triggerStopHaptic(); // Haptic Feedback für Stop/Complete
			console.debug('🎯 Calling stopRecording from store...');
			await stopRecording();
			console.debug('🎯 stopRecording completed successfully');
		} catch (error) {
			console.error('🔴 Error in handleCompleteRecording:', error);
		}
	}, [triggerStopHaptic, stopRecording]);

	// Press & Hold Handlers
	const handlePressIn = useCallback(async () => {
		console.debug('🔥 handlePressIn - Press started', { isRecording, isPaused });

		// Increment press counter
		pressCount.current++;
		console.debug('Press count:', pressCount.current);

		// Show toast only on second press attempt
		if (pressCount.current >= 2 && shouldShowToastOnNextPress && shouldShowInstructionToast()) {
			if (!isRecording) {
				showInfo(t('recording.press_hold_start'), undefined, 2500);
			} else {
				showInfo(t('recording.press_hold_stop'), undefined, 2500);
			}
			setShouldShowToastOnNextPress(false);
			pressCount.current = 0; // Reset counter after showing toast
		}
		// Don't reset the flag if we're just suppressing due to learning period
		// Keep it true so it can be checked again on next press

		setIsPressedDown(true);
		isPressedDownRef.current = true;
		pressStartTime.current = Date.now();

		// Light haptic feedback beim ersten Drücken (Stufe 1)
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		// Visual feedback: Eindrücken
		scaleAnim.value = withSpring(0.95, { damping: 15, stiffness: 200 });

		if (!isRecording) {
			// ✅ CRITICAL FIX: Check permissions BEFORE starting animation
			// This prevents animation issues when permission dialog appears
			console.debug('🔐 Checking permissions before starting animation...');

			const { permissions } = useRecordingStore.getState();

			if (!permissions.microphone.granted) {
				console.debug('🔐 No permission - requesting before animation');

				// Request permissions immediately (this shows the system dialog)
				try {
					const { requestPermissions } = useRecordingStore.getState();
					const newPermissions = await requestPermissions();

					if (!newPermissions.microphone.granted) {
						// Permission denied - reset animations and show error
						console.debug('🔐 Permission denied - resetting animations');

						// Reset animations to initial state
						scaleAnim.value = withSpring(1, { damping: 15, stiffness: 200 });
						pressRotationAnim.value = withTiming(0, {
							duration: 300,
							easing: Easing.out(Easing.ease),
						});

						setIsPressedDown(false);
						isPressedDownRef.current = false;

						// Error is already set by the store, modal will show
						return;
					}

					// ✅ CRITICAL FIX: Force reinitialize audio session after permission granted
					// This must happen BEFORE checking button state because:
					// 1. iOS resets audio session when permission dialog appears
					// 2. Permission dialog causes iOS to fire handlePressOut (button release)
					// 3. Audio session setup is independent of button press state
					// 4. Button state only controls animation/recording flow, not audio setup
					console.debug('🔐 Permission granted - force reinitializing audio session...');

					try {
						// ✅ CRITICAL: Use reinitialize() to properly reset and reconfigure audio session
						// This calls cleanup() to reset flags, then initialize() to run setupAudioMode()
						await reinitialize();
						console.debug('🔐 Audio session force reinitialized successfully');
					} catch (initError) {
						console.error('🔐 Failed to force reinitialize audio session:', initError);
						// Reset animations on initialization error
						scaleAnim.value = withSpring(1, { damping: 15, stiffness: 200 });
						setIsPressedDown(false);
						isPressedDownRef.current = false;
						return;
					}

					// NOW check if component is still mounted and button still pressed
					// This only controls whether to continue with the recording flow
					// Audio session is already initialized above, so next recording attempt will work
					if (!isMountedRef.current || !isPressedDownRef.current) {
						console.debug('🔐 Component unmounted or button released during permission request');
						console.debug(
							'   ✅ Audio session initialized, stopping recording flow due to button release'
						);
						// Reset animations
						scaleAnim.value = withSpring(1, { damping: 15, stiffness: 200 });
						setIsPressedDown(false);
						isPressedDownRef.current = false;
						return;
					}
				} catch (error) {
					console.error('🔐 Error requesting permissions:', error);

					// Reset animations on error
					scaleAnim.value = withSpring(1, { damping: 15, stiffness: 200 });
					setIsPressedDown(false);
					isPressedDownRef.current = false;
					return;
				}
			}

			// ✅ Permission granted - now start the normal animation flow
			console.debug('🔐 Permission OK - starting animation');

			// Nur bei neuer Aufnahme: Eine Drehung für Press & Hold
			pressRotationAnim.value = withTiming(360, {
				duration: PRESS_HOLD_DURATION,
				easing: Easing.linear,
			});

			// Medium haptic feedback bei halber Rotation (Stufe 2)
			halfwayTimeout.current = registerTimeout(
				setTimeout(() => {
					if (isPressedDownRef.current) {
						console.debug('🔔 Halfway haptic feedback');
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
					}
				}, PRESS_HOLD_DURATION / 2)
			); // 360ms - halbe Rotation

			// Timer für Recording Start nach einer vollen Drehung
			pressTimeout.current = registerTimeout(
				setTimeout(async () => {
					console.debug('Press & Hold timer fired', {
						isPressedDown,
						isRecording,
						currentTime: Date.now(),
						pressStartTime: pressStartTime.current,
					});

					if (isPressedDownRef.current) {
						console.debug('✅ Press & Hold completed - Starting recording');

						// Step 1: Immediate haptic feedback
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

						// Step 2: Synchronous UI State updates
						setShouldShowToastOnNextPress(false);
						lastToastTime.current = Date.now();
						pressCount.current = 0;

						// Step 3: Start all animations immediately (parallel)
						// Smooth transition from press rotation (360°) to continuous
						pressRotationAnim.value = withSequence(
							withTiming(360, { duration: 0 }), // Complete the press rotation instantly
							withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) }) // Then fade it out
						);

						// Start radial fill immediately for instant visual feedback
						fillRadiusAnim.value = withTiming(1, {
							duration: 300, // Faster fill for immediate feedback
							easing: Easing.out(Easing.ease), // Smooth out easing
						});

						// Step 4: Start recording (async, non-blocking)
						// Note: Start sound removed to avoid audio session interference on iOS
						setRecordingInfo({ title, spaceId, blueprintId });
						startRecording(); // This should now succeed since we already have permission
						onPress?.();

						// ✅ SMOOTH ANIMATION FIX: Start continuous rotation immediately
						// Don't wait for isRecording state - this prevents animation gap during iOS initialization
						console.debug('🔄 Starting continuous rotation immediately (before isRecording=true)');
						hasManuallyStartedRotation.current = true; // Mark that we manually started rotation
						rotationAnim.value = withRepeat(
							withTiming(360 + 3600, {
								duration: 30000, // 30 seconds for 10 rotations
								easing: Easing.linear,
							}),
							-1, // Infinite repeat
							false
						);

						// Set toast re-enable timer
						registerTimeout(
							setTimeout(() => {
								if (isMountedRef.current) {
									setShouldShowToastOnNextPress(true);
								}
							}, TOAST_COOLDOWN_PERIOD)
						);
					} else {
						console.debug('❌ Press & Hold timer fired but button not pressed down');
					}
				}, PRESS_HOLD_DURATION)
			);
		} else if (!isPaused) {
			// Wenn bereits aufgenommen wird: Press & Hold zum Beenden
			pressRotationAnim.value = withTiming(360, {
				duration: PRESS_HOLD_DURATION,
				easing: Easing.linear,
			});

			// Medium haptic feedback bei halber Rotation auch beim Stoppen
			halfwayTimeout.current = registerTimeout(
				setTimeout(() => {
					if (isPressedDownRef.current) {
						console.debug('🔔 Halfway haptic feedback (stop)');
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
					}
				}, PRESS_HOLD_DURATION / 2)
			);

			pressTimeout.current = registerTimeout(
				setTimeout(() => {
					if (isPressedDownRef.current) {
						console.debug('Press & Hold completed - Stopping recording and continuing rotation');

						// Reset toast flag since user successfully completed the action
						setShouldShowToastOnNextPress(false);

						// Set a timer to re-enable toast after the cooldown period
						registerTimeout(
							setTimeout(() => {
								if (isMountedRef.current) {
									setShouldShowToastOnNextPress(true);
								}
							}, TOAST_COOLDOWN_PERIOD)
						);

						// Update toast time since user successfully completed the action
						console.debug('🎓 User successfully stopped recording');
						lastToastTime.current = Date.now();
						pressCount.current = 0; // Reset press counter on successful stop

						// Heavy haptic feedback for successful stop (Stufe 3)
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

						// Play recording stop sound
						recordingSoundManager.playStopSound();

						// Stoppe Recording
						handleCompleteRecording();

						// Berechne die Gesamtposition und die nächste 0°-Position intelligenter
						const currentTotalRotation = rotationAnim.value + pressRotationAnim.value;

						// Finde die nächste 0°-Position, aber nur wenn wir nicht schon sehr nah dran sind
						const remainder = currentTotalRotation % 360;
						let targetRotation;
						let additionalRotation;

						if (remainder < 10) {
							// Wenn wir sehr nah an einer 0°-Position sind (weniger als 10°), gehe zur aktuellen
							targetRotation = currentTotalRotation - remainder;
							additionalRotation = -remainder;
						} else if (remainder > 350) {
							// Wenn wir sehr nah an der nächsten 0°-Position sind (mehr als 350°), gehe zur nächsten
							targetRotation = currentTotalRotation + (360 - remainder);
							additionalRotation = 360 - remainder;
						} else {
							// Ansonsten gehe zur nächsten vollen 0°-Position
							targetRotation = Math.floor(currentTotalRotation / 360) * 360 + 360;
							additionalRotation = targetRotation - currentTotalRotation;
						}

						console.debug('🔄 Intelligent rotation calculation', {
							currentTotal: currentTotalRotation,
							remainder,
							target: targetRotation,
							additional: additionalRotation,
						});

						// Nur weiterdrehen wenn wir vorwärts gehen müssen
						if (additionalRotation > 0) {
							// Statt zu stoppen, lasse pressRotationAnim einfach weiterdrehen
							// von der aktuellen Position (360°) bis zur Zielposition
							pressRotationAnim.value = withTiming(
								360 + additionalRotation,
								{
									duration: Math.max(300, additionalRotation * 3),
									easing: Easing.out(Easing.ease),
								},
								(finished) => {
									if (finished) {
										// Nach Abschluss beide auf 0 setzen für sauberen State
										console.debug('🔄 Rotation completed, resetting to 0°');
										rotationAnim.value = 0;
										pressRotationAnim.value = 0;
									}
								}
							);
						} else {
							// Wenn wir schon sehr nah an 0° sind, direkt zurücksetzen
							console.debug('🔄 Already close to 0°, direct reset');
							rotationAnim.value = 0;
							pressRotationAnim.value = 0;
						}
					}
				}, PRESS_HOLD_DURATION)
			);
		}
	}, [
		isRecording,
		isPaused,
		triggerStartHaptic,
		scaleAnim,
		pressRotationAnim,
		rotationAnim,
		setRecordingInfo,
		title,
		spaceId,
		blueprintId,
		startRecording,
		onPress,
		handleCompleteRecording,
		isPressedDown,
		shouldShowToastOnNextPress,
		showInfo,
		shouldShowInstructionToast,
		fillRadiusAnim,
		t,
		registerTimeout,
		initialize,
		reinitialize,
	]);

	const handlePressOut = useCallback(() => {
		console.debug('🔥 handlePressOut - Press ended', {
			isPressedDown,
			pressedDuration: Date.now() - pressStartTime.current,
		});

		const wasInProgress = pressTimeout.current !== null;

		setIsPressedDown(false);
		isPressedDownRef.current = false;

		// Clear timeouts if recording hasn't started yet
		if (pressTimeout.current) {
			clearRegisteredTimeout(pressTimeout.current);
			pressTimeout.current = null;
		}
		if (halfwayTimeout.current) {
			clearRegisteredTimeout(halfwayTimeout.current);
			halfwayTimeout.current = null;
		}

		// ✅ FIX: Always reset animations to ensure clean state
		// This is especially important if user releases during permission dialog
		scaleAnim.value = withSpring(1, { damping: 15, stiffness: 200 });

		// Wenn wir loslassen bevor die Drehung fertig ist, zurückdrehen
		if (!isRecording) {
			// ✅ FIX: Always animate back to 0, even if permission dialog was shown
			pressRotationAnim.value = withTiming(0, {
				duration: 300,
				easing: Easing.out(Easing.ease),
			});

			// Set flag to show toast on next press if user released before completing the action
			if (wasInProgress) {
				setShouldShowToastOnNextPress(true);
			}
		} else {
			// Set flag to show toast on next press if user released while trying to stop recording
			if (wasInProgress) {
				setShouldShowToastOnNextPress(true);
			}
		}
	}, [scaleAnim, pressRotationAnim, isRecording, isPressedDown, clearRegisteredTimeout]);

	// Legacy handler für Kompatibilität (wird nicht mehr verwendet)
	const handleMainButtonPress = () => {
		// This function is now handled by press & hold
		console.debug('handleMainButtonPress called - now handled by press & hold');
	};

	// Handler für das Pausieren der Aufnahme
	const handlePauseRecording = () => {
		console.debug('handlePauseRecording');
		// Nur pausieren, wenn die Aufnahme läuft
		if (status === RecordingStatus.RECORDING) {
			triggerPauseHaptic(); // Haptic Feedback für Pause
			pauseRecording();
		}
	};

	// Handler für das Fortsetzen der Aufnahme
	const handleResumeRecording = () => {
		console.debug('handleResumeRecording', { status, isRecording, isPaused });
		// Nur fortsetzen, wenn die Aufnahme tatsächlich pausiert ist
		if (status === RecordingStatus.PAUSED) {
			console.debug('Calling resumeRecording...');
			triggerResumeHaptic(); // Haptic Feedback für Resume
			resumeRecording();
		} else {
			console.debug('Not resuming - status is not PAUSED:', status);
		}
	};

	// Handler für das Beenden und Speichern der Aufnahme
	const handleStopRecording = () => {
		if (isRecording) {
			pauseRecording();

			// Native Alert statt Modal
			Alert.alert(t('recording.stop_recording_title'), t('recording.stop_recording_message'), [
				{
					text: t('recording.no_continue'),
					style: 'cancel',
					onPress: () => resumeRecording(),
				},
				{
					text: t('recording.yes_stop'),
					onPress: handleCompleteRecording,
				},
			]);
		}
	};

	// This function has been moved above handlePressIn to fix the initialization order

	// Handler für das Abbrechen und Zurücksetzen der Aufnahme
	const handleCancelRecording = () => {
		// Native Alert statt Modal
		Alert.alert(t('recording.cancel_recording_title'), t('recording.cancel_recording_message'), [
			{
				text: t('recording.no_continue'),
				style: 'cancel',
			},
			{
				text: t('recording.yes_cancel'),
				onPress: async () => {
					try {
						triggerCancelHaptic(); // Haptic Feedback für Cancel
						recordingSoundManager.playCancelSound(); // Play cancel sound

						// ✅ CRITICAL FIX: Set canceling flag BEFORE stopping
						// This prevents the upload from triggering in the useEffect
						isCancelingRef.current = true;
						console.debug(
							'🗑️ Canceling recording - setting cancel flag and stopping native recorder...'
						);

						// Stop the native recording first
						// This will trigger status=STOPPED, but the flag prevents upload
						if (isRecording || isPaused) {
							await stopRecording();
							console.debug('🗑️ Native recording stopped');
						}

						// Reset happens in useEffect when it sees isCancelingRef.current = true
						showSuccess(t('recording.recording_canceled'));
						console.debug('Recording canceled successfully');
					} catch (error) {
						console.debug('Error canceling recording:', error);
						// Even if stop fails, still reset to allow recovery
						isCancelingRef.current = false;
						await resetRecording();
					}
				},
			},
		]);
	};

	// Animation values for timer appearance
	const timerOpacity = useSharedValue(0);
	const timerTranslateY = useSharedValue(-20);

	// Update animation values when recording status changes
	useEffect(() => {
		if (isRecording || isPaused) {
			timerOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
			timerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
		} else {
			timerOpacity.value = withTiming(0, { duration: 200 });
			timerTranslateY.value = withTiming(-20, { duration: 200 });
		}
	}, [isRecording, isPaused]);

	// Animated style for timer
	const timerAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: timerOpacity.value,
			transform: [{ translateY: timerTranslateY.value }],
		};
	});

	// Animated style for icon rotation (combined press & recording rotation)
	const iconRotationStyle = useAnimatedStyle(() => {
		const totalRotation = rotationAnim.value + pressRotationAnim.value;
		return {
			transform: [{ rotate: `${totalRotation}deg` }],
		};
	});

	// Animated style for button scale (press effect)
	const buttonScaleStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scaleAnim.value }],
		};
	});

	// Animated style for radial fill
	const radialFillStyle = useAnimatedStyle(() => {
		// Mache den Radius etwas größer um sicherzustellen, dass alles gefüllt wird
		const maxRadius = (size / 2) * 1.1; // 10% größer für vollständige Abdeckung
		const radius = fillRadiusAnim.value * maxRadius;

		// Use interpolate for smoother opacity transition
		const opacity = interpolate(fillRadiusAnim.value, [0, 0.1, 1], [0, 0.8, 1]);

		return {
			position: 'absolute',
			width: radius * 2,
			height: radius * 2,
			borderRadius: radius,
			backgroundColor: themeColor,
			top: size / 2 - radius, // Zentriere vertikal basierend auf tatsächlicher Button-Größe
			left: size / 2 - radius, // Zentriere horizontal basierend auf tatsächlicher Button-Größe
			opacity: opacity,
		};
	});

	// Animated style for upload progress overlay (white sliding up over yellow)
	const uploadProgressStyle = useAnimatedStyle(() => {
		const progress = uploadProgressAnim.value;
		const overlayHeight = progress * size;

		return {
			position: 'absolute',
			bottom: 0, // Startet von unten
			left: 0,
			right: 0,
			height: overlayHeight,
			backgroundColor: contentBackgroundColor, // Weiß (oder Theme-Hintergrund)
			opacity: progress > 0 ? 1 : 0,
		};
	});

	// Shared audio level color calculation
	const getAudioLevelColor = (level: number) => {
		'worklet';
		const isGoodLevel = level >= 0.3;
		const isOkLevel = level >= 0.1 && level < 0.3;
		return isGoodLevel ? '#10B981' : isOkLevel ? '#F59E0B' : '#EF4444';
	};

	// Animated style for audio level visualization
	const audioLevelStyle = useAnimatedStyle(() => {
		const level = audioLevelAnim.value;
		const levelColor = getAudioLevelColor(level);

		// Ring-Breite basierend auf Audio-Level (4-12px für bessere Sichtbarkeit)
		const ringWidth = interpolate(level, [0, 1], [4, 12]);

		// Ring-Größe: Feste Button-Größe + Ring-Breite (nicht skaliert)
		const ringSize = size + ringWidth * 2;
		const offset = (ringSize - size) / 2;

		return {
			width: ringSize,
			height: ringSize,
			borderRadius: ringSize / 2,
			backgroundColor: levelColor,
			opacity: interpolate(level, [0, 1], [0.4, 0.8]),
			transform: [
				{ translateX: -offset }, // Zentriere den Ring horizontal
				{ translateY: -offset }, // Zentriere den Ring vertikal
			],
		};
	});

	// Animated style for button border color
	const buttonBorderStyle = useAnimatedStyle(() => {
		if (isRecording && !isPaused && !isWebPlatform) {
			const level = audioLevelAnim.value;
			const levelColor = getAudioLevelColor(level);
			return {
				borderColor: levelColor,
			};
		}
		return {
			borderColor: themeColor,
		};
	});

	const styles = StyleSheet.create({
		container: {
			alignItems: 'center',
			justifyContent: 'center',
			position: 'relative', // Enable absolute positioning of children
		},
		buttonWrapper: {
			width: size,
			height: size,
			alignItems: 'center',
			justifyContent: 'center',
		},
		button: {
			width: size,
			height: size,
			borderRadius: size / 2,
			borderWidth: 6,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor:
				isHovered && Platform.OS === 'web' ? contentBackgroundHoverColor : contentBackgroundColor,
			overflow: 'hidden', // Wichtig für die radiale Füllung
			position: 'relative',
			...(Platform.OS === 'web' && {
				cursor: 'pointer',
				transition: 'background-color 0.2s ease',
			}),
		},
		timerContainer: {
			position: 'absolute',
			top: size + 10, // Position below the button
			alignItems: 'center',
			width: '100%',
			zIndex: 5,
		},
		controlsContainer: {
			position: 'absolute',
			flexDirection: 'column',
			right: -(size / 2.5), // Position on the right side
			top: '50%',
			transform: [{ translateY: -65 }], // Position higher again
			alignItems: 'center',
			justifyContent: 'space-between',
			height: 140, // Increased height for larger buttons
			zIndex: 10,
		},
		controlButton: {
			marginVertical: 10,
			width: 52, // Increased from 44 to 52
			height: 52, // Increased from 44 to 52
			borderRadius: 26, // Adjusted for new size
			backgroundColor: contentBackgroundColor,
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 2,
		},
		customText: {
			marginTop: 8,
			textAlign: 'center',
			opacity: 0.7,
		},
		controlsLabel: {
			fontSize: 12,
			marginTop: 2,
			opacity: 0.7,
		},
		audioLevelRing: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: size,
			height: size,
			borderRadius: size / 2,
			borderWidth: 0, // Wird dynamisch durch audioLevelStyle gesetzt
			borderColor: 'transparent',
			pointerEvents: 'none', // Verhindert, dass der Ring Touch-Events abfängt
		},
	});

	return (
		<View style={styles.container}>
			{/* Audio-Level-Ring - hinter dem Button für nahtlose Darstellung - nur auf Mobile */}
			{isRecording && !isPaused && !isWebPlatform && (
				<Animated.View style={[styles.audioLevelRing, audioLevelStyle]} />
			)}

			{/* Hauptbutton */}
			<Pressable
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				onMouseEnter={() => Platform.OS === 'web' && setIsHovered(true)}
				onMouseLeave={() => Platform.OS === 'web' && setIsHovered(false)}
				disabled={isPaused}
				style={Platform.OS === 'web' ? { cursor: 'pointer' } : undefined}
			>
				<Animated.View style={[styles.buttonWrapper, buttonScaleStyle]}>
					<Animated.View
						style={[
							styles.button,
							buttonBorderStyle,
							{
								backgroundColor:
									isHovered && Platform.OS === 'web'
										? contentBackgroundHoverColor
										: contentBackgroundColor, // Hover effect on web
								borderWidth: 6,
							},
						]}
					>
						{/* Radiale Füllung - wird von der Mitte nach außen animiert */}
						<Animated.View style={radialFillStyle} />

						<Animated.View style={[iconRotationStyle, { zIndex: 10 }]}>
							<MemoroLogo
								color={isRecording ? contentBackgroundColor : primaryColor}
								size={size * 0.42}
							/>
						</Animated.View>
					</Animated.View>
				</Animated.View>
			</Pressable>

			{/* Timer - absolutely positioned with animation */}
			<Animated.View style={[styles.timerContainer, timerAnimatedStyle]}>
				<Text variant="h2" style={{ fontWeight: '700', fontFamily: 'monospace' }}>
					{formatDuration(duration)}
				</Text>
				{/* Debug: Audio Level Info - only shown in developer mode */}
				{isRecording && !isPaused && storeMeteringValue !== null && developerMode && (
					<Text variant="caption" style={{ marginTop: 4, opacity: 0.7 }}>
						Audio: {storeMeteringValue?.toFixed(1)}dB
					</Text>
				)}
			</Animated.View>

			{/* Steuerelemente - absolut positioniert links neben dem Hauptbutton */}
			{isRecording || isPaused ? (
				<View style={styles.controlsContainer}>
					<View>
						{/* Pause/Resume Button */}
						<Pressable
							onPress={isPaused ? handleResumeRecording : handlePauseRecording}
							style={styles.controlButton}
						>
							<Icon
								name={isPaused ? 'play-outline' : 'pause-outline'}
								size={24}
								color={textColor}
							/>
						</Pressable>
					</View>

					<View>
						{/* Cancel Button */}
						<Pressable onPress={handleCancelRecording} style={styles.controlButton}>
							<Icon name="close-outline" size={24} color={textColor} />
						</Pressable>
					</View>
				</View>
			) : null}

			{/* Bestätigungsdialoge werden jetzt mit Alert implementiert */}
		</View>
	);
}

export default RecordingButton;
