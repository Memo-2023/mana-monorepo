import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	View,
	StyleSheet,
	Alert,
	Dimensions,
	ActivityIndicator,
	ScrollView,
	Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonHeader from '../components/molecules/CommonHeader';
import { useAuth } from '../src/contexts/AuthContext';
import { useDebugBorders } from '../hooks/useDebugBorders';
import { fetchWithAuth } from '../src/utils/api';
import { useDebug } from '../src/contexts/DebugContext';
import { usePostHog } from '../src/hooks/usePostHog';
import { useStories } from '../hooks/useStories';
import { useCharacterStats } from '../hooks/useCharacterStats';
import MagicalLoadingScreen from '../components/molecules/MagicalLoadingScreen';

// Settings Components
import UserStatsSection from '../components/settings/UserStatsSection';
import DevSettingsSection from '../components/settings/DevSettingsSection';
import CreatorSelectionSection, {
	type Creator,
} from '../components/settings/CreatorSelectionSection';
import AccountSection from '../components/settings/AccountSection';
import SettingsFooter from '../components/settings/SettingsFooter';
import SectionHeader from '../components/settings/SectionHeader';
import FeedbackModal from '../components/settings/FeedbackModal';
import PinModal from '../components/settings/PinModal';
import FeedbackToast from '../components/settings/FeedbackToast';
import { ParentalGate } from '../src/components/ParentalGate';
import { useParentalGate } from '../src/hooks/useParentalGate';

export default function Settings() {
	// Alle Hooks zuerst
	const { user, signOut, loading } = useAuth();
	const { debugBordersEnabled, toggleDebugBorders } = useDebug();
	const posthog = usePostHog();
	const { allStories } = useStories();
	const { characterCount, mostUsedCharacter } = useCharacterStats();
	const { isVisible, config, setIsVisible, requestParentalPermission } = useParentalGate();

	// Debug-Borders Hooks
	const safeAreaDebug = useDebugBorders('#FF0000');
	const containerDebug = useDebugBorders('#00FF00');
	const sectionDebug = useDebugBorders('#0000FF');

	// Alle useState-Hooks
	const [showDevSettings, setShowDevSettings] = useState(false);
	const [showPinModal, setShowPinModal] = useState(false);
	const [pinCode, setPinCode] = useState('');
	const [pinError, setPinError] = useState(false);
	const [authors, setAuthors] = useState<Creator[]>([]);
	const [illustrators, setIllustrators] = useState<Creator[]>([]);
	const [selectedAuthor, setSelectedAuthor] = useState<Creator | null>(null);
	const [selectedIllustrator, setSelectedIllustrator] = useState<Creator | null>(null);
	const [showLoadingScreen, setShowLoadingScreen] = useState(false);
	const [loadingContext, setLoadingContext] = useState<
		'character' | 'story' | 'image' | 'saving' | 'loading'
	>('character');
	const [showFeedbackModal, setShowFeedbackModal] = useState(false);
	const [feedbackText, setFeedbackText] = useState('');
	const [isSavingFeedback, setIsSavingFeedback] = useState(false);
	const [showFeedbackToast, setShowFeedbackToast] = useState(false);
	const [toastOpacity] = useState(new Animated.Value(0));
	const [parentalGateApproved, setParentalGateApproved] = useState(false);

	// Screen width calculations
	const { width: screenWidth } = Dimensions.get('window');
	const isWideScreen = screenWidth > 1000;

	// Toast Animation Effect
	useEffect(() => {
		if (showFeedbackToast) {
			Animated.sequence([
				Animated.timing(toastOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.delay(2000),
				Animated.timing(toastOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start(() => setShowFeedbackToast(false));
		}
	}, [showFeedbackToast, toastOpacity]);

	// Load Dev Settings state from storage on mount
	useEffect(() => {
		const loadDevSettings = async () => {
			try {
				const savedState = await AsyncStorage.getItem('dev_settings_enabled');
				if (savedState !== null) {
					setShowDevSettings(savedState === 'true');
				}
			} catch (error) {
				console.error('Error loading dev settings state:', error);
			}
		};
		loadDevSettings();
	}, []);

	// Save Dev Settings state to storage when it changes
	useEffect(() => {
		const saveDevSettings = async () => {
			try {
				await AsyncStorage.setItem('dev_settings_enabled', showDevSettings.toString());
			} catch (error) {
				console.error('Error saving dev settings state:', error);
			}
		};
		saveDevSettings();
	}, [showDevSettings]);

	// Load Creators from Backend - only when in Dev Mode
	useEffect(() => {
		if (!showDevSettings) return;

		const loadCreators = async () => {
			try {
				const response = await fetchWithAuth('/settings/creators');

				if (!response.ok) {
					throw new Error('Failed to fetch creators');
				}

				const data = await response.json();
				const authorsList = data.authors || [];
				const illustratorsList = data.illustrators || [];

				setAuthors(authorsList);
				setIllustrators(illustratorsList);

				// Automatisch den ersten Autor und Illustrator auswählen, falls verfügbar
				if (authorsList.length > 0 && !selectedAuthor) {
					setSelectedAuthor(authorsList[0]);
				}
				if (illustratorsList.length > 0 && !selectedIllustrator) {
					setSelectedIllustrator(illustratorsList[0]);
				}
			} catch (error) {
				console.error('Error loading creators:', error);
				posthog?.capture('creator_loading_error', {
					error: error instanceof Error ? error.message : 'unknown_error',
				});
			}
		};

		loadCreators();
	}, [showDevSettings, posthog, selectedAuthor, selectedIllustrator]);

	// Alle useCallback-Hooks
	const handleLongPress = useCallback(() => {
		if (!showDevSettings) {
			setShowPinModal(true);
			setPinCode('');
			setPinError(false);
		} else {
			setShowDevSettings(false);
		}
	}, [showDevSettings]);

	const handleFeedbackSubmit = useCallback(async () => {
		if (!feedbackText.trim()) {
			Alert.alert('Fehler', 'Bitte gib dein Feedback ein.');
			return;
		}

		// Check for parental approval first (Kids Category requirement)
		if (!parentalGateApproved) {
			const granted = await requestParentalPermission({
				title: 'Feedback senden',
				message: 'Um Feedback an den Entwickler zu senden, löse bitte diese Rechenaufgabe:',
			});

			if (!granted) {
				return; // User cancelled
			}

			setParentalGateApproved(true);
		}

		try {
			setIsSavingFeedback(true);

			if (!user) {
				Alert.alert(
					'Error',
					'Du musst angemeldet sein, um Feedback zu senden\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.'
				);
				return;
			}

			// Save feedback via API
			const response = await fetchWithAuth('/feedback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					feedbackText: feedbackText.trim(),
					category: 'feature', // Default category
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to submit feedback');
			}

			// Track in PostHog
			posthog?.capture('feedback_submitted', {
				category: 'feature',
				source: 'settings',
			});

			setFeedbackText('');
			setShowFeedbackModal(false);
			setShowFeedbackToast(true);
		} catch (error) {
			console.error('Error saving feedback:', error);
			Alert.alert(
				'Fehler',
				'Feedback konnte nicht gespeichert werden.\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.'
			);
		} finally {
			setIsSavingFeedback(false);
		}
	}, [feedbackText, user, posthog, parentalGateApproved, requestParentalPermission]);

	const handleLogout = useCallback(async () => {
		try {
			// Log attempt
			if (posthog) {
				try {
					await posthog.capture('user_logout_attempt');
				} catch (logError) {
					console.error('Error logging logout attempt:', logError);
				}
			}

			// Perform logout
			await signOut();

			// Log success after successful logout
			if (posthog) {
				try {
					await posthog.capture('user_logout_success');
				} catch (logError) {
					console.error('Error logging logout success:', logError);
				}
			}

			// Don't navigate manually - the auth state change in _layout.tsx will handle navigation
			// This prevents the "Attempted to navigate before mounting" error
		} catch (error) {
			console.error('Logout error:', error);
			const errorMessage = error instanceof Error ? error.message : 'unknown_error';

			// Log error
			if (posthog) {
				try {
					await posthog.capture('user_logout_error', { error: errorMessage });
				} catch (logError) {
					console.error('Error logging logout error:', logError);
				}
			}

			Alert.alert(
				'Fehler',
				'Beim Abmelden ist ein Fehler aufgetreten.\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.'
			);
		}
	}, [signOut, posthog]);

	const handleOpenOnboarding = useCallback(() => {
		posthog?.capture('onboarding_reopened', {
			user_id: user?.sub || user?.id,
		});
		router.push('/onboarding');
	}, [posthog, user]);

	const handleOpenCreators = useCallback(() => {
		posthog?.capture('creators_page_opened');
		router.push('/creators');
	}, [posthog]);

	const handlePinInput = useCallback(
		(digit: string) => {
			if (pinCode.length < 4) {
				const newPin = pinCode + digit;
				setPinCode(newPin);
				setPinError(false);

				// Auto-submit bei 4 Ziffern
				if (newPin.length === 4) {
					setTimeout(() => {
						const CORRECT_PIN = '4242';
						if (newPin === CORRECT_PIN) {
							setShowDevSettings(true);
							setShowPinModal(false);
							setPinCode('');
							posthog?.capture('dev_settings_unlocked');
						} else {
							setPinError(true);
							setPinCode('');
							setTimeout(() => setPinError(false), 2000);
						}
					}, 100);
				}
			}
		},
		[pinCode, posthog]
	);

	const handlePinDelete = useCallback(() => {
		setPinCode(pinCode.slice(0, -1));
		setPinError(false);
	}, [pinCode]);

	const handleShowLoadingScreen = useCallback(() => {
		setShowLoadingScreen(true);
		// Automatisch nach 8 Sekunden ausblenden
		setTimeout(() => setShowLoadingScreen(false), 8000);
	}, []);

	const handleClosePinModal = useCallback(() => {
		setShowPinModal(false);
		setPinCode('');
		setPinError(false);
	}, []);

	// Calculate total word count from all stories
	const totalWords = useMemo(() => {
		return allStories.reduce((total, story) => {
			const storyWords =
				story.pages?.reduce((pageTotal, page) => {
					const words = page.story?.split(/\s+/).filter((w) => w.length > 0).length || 0;
					return pageTotal + words;
				}, 0) || 0;
			return total + storyWords;
		}, 0);
	}, [allStories]);

	// Alle useMemo-Hooks
	const dynamicStyles = useMemo(
		() => ({
			container: {
				maxWidth: 600,
				width: '100%',
				alignSelf: 'center',
				paddingHorizontal: isWideScreen ? 0 : 20,
			},
		}),
		[isWideScreen]
	);

	// Zeige Ladeindikator während des Logouts
	if (loading) {
		return (
			<View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" color="#FFD700" />
			</View>
		);
	}

	return (
		<SafeAreaView style={[styles.safeArea, safeAreaDebug]} edges={['top']}>
			<CommonHeader title="Einstellungen" />
			<View style={[styles.container, containerDebug, dynamicStyles.container]}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.contentContainer}>
						{/* Statistics Section */}
						<SectionHeader title="Statistiken" isFirst />
						<View style={sectionDebug}>
							<UserStatsSection
								characterCount={characterCount}
								storyCount={allStories.length}
								totalWords={totalWords}
								mostUsedCharacter={mostUsedCharacter}
							/>
						</View>

						{/* Dev Settings Section */}
						{showDevSettings && (
							<View style={sectionDebug}>
								<SectionHeader title="Dev Settings" />
								<DevSettingsSection
									showDebugBorders={debugBordersEnabled}
									onToggleDebugBorders={toggleDebugBorders}
									onOpenOnboarding={handleOpenOnboarding}
									onOpenCreators={handleOpenCreators}
									loadingContext={loadingContext}
									onLoadingContextChange={setLoadingContext}
									onShowLoadingScreen={handleShowLoadingScreen}
									isWideScreen={isWideScreen}
								/>

								<SectionHeader title="Künstler" />
								<CreatorSelectionSection
									authors={authors}
									illustrators={illustrators}
									selectedAuthor={selectedAuthor}
									selectedIllustrator={selectedIllustrator}
									onSelectAuthor={setSelectedAuthor}
									onSelectIllustrator={setSelectedIllustrator}
								/>
							</View>
						)}

						{/* Account Section */}
						<View style={sectionDebug}>
							<SectionHeader title="Account" />
							<AccountSection
								email={user?.email}
								onLogout={handleLogout}
								isWideScreen={isWideScreen}
							/>
						</View>

						{/* Footer */}
						<SettingsFooter onLongPress={handleLongPress} />
					</View>
				</ScrollView>
			</View>

			{/* Loading Screen Overlay */}
			{showLoadingScreen && <MagicalLoadingScreen context={loadingContext} />}

			{/* Modals */}
			<FeedbackModal
				visible={showFeedbackModal}
				feedbackText={feedbackText}
				isSaving={isSavingFeedback}
				onClose={() => setShowFeedbackModal(false)}
				onChangeText={setFeedbackText}
				onSubmit={handleFeedbackSubmit}
			/>

			<PinModal
				visible={showPinModal}
				pinCode={pinCode}
				pinError={pinError}
				onClose={handleClosePinModal}
				onPinInput={handlePinInput}
				onPinDelete={handlePinDelete}
			/>

			<ParentalGate
				visible={isVisible}
				onSuccess={config.onSuccess || (() => {})}
				onCancel={() => setIsVisible(false)}
				title={config.title}
				message={config.message}
			/>

			{/* Toast */}
			<FeedbackToast visible={showFeedbackToast} opacity={toastOpacity} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	container: {
		flex: 1,
	},
	contentContainer: {
		paddingTop: 100, // Space for header
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 0,
	},
});
