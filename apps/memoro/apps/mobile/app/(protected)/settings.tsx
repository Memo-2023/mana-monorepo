import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
	View,
	ScrollView,
	StyleSheet,
	Platform,
	TouchableOpacity,
	Pressable,
	type LayoutChangeEvent,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Alert from '~/components/atoms/Alert';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemeSettings } from '~/features/theme/ThemeSettings';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import { useAuth } from '~/features/auth';

import SettingsToggle from '~/components/organisms/SettingsToggle';
import { useHeader } from '~/features/menus/HeaderContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '~/features/i18n/LanguageContext';
import { useLocation } from '~/features/location/LocationContext';
import LanguageSelector from '~/features/i18n/LanguageSelector';
import MultiLanguageSelector from '~/components/molecules/MultiLanguageSelector';
import { useRecordingLanguage } from '~/features/audioRecordingV2';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import MicrophoneSelector from '~/components/molecules/MicrophoneSelector';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';
import { useSettingsStore } from '~/features/settings';
import { useAnalytics } from '~/features/analytics';
import { EmailNewsletterSettings } from '~/features/settings/components/EmailNewsletterSettings';
import { SystemPromptSettings } from '~/features/settings/components/SystemPromptSettings';
import { useToast } from '~/features/toast';
import MigrationNotificationModal from '~/features/migration/components/MigrationNotificationModal';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { supabaseUrl, supabaseAnonKey } from '~/features/auth/lib/supabaseClient';
import Icon from '~/components/atoms/Icon';
import { openSupportEmail } from '~/features/support/utils/emailSupport';
import config from '~/config';
import EasterEggModal from '~/components/organisms/EasterEggModal';
import { useRating } from '~/features/rating/hooks/useRating';
import { useSearchProvider } from '~/features/search';

// Abschnitts-Header-Komponente
function SectionHeader({
	title,
	isFirst = false,
	collapsible = false,
	isCollapsed = false,
	onPress,
}: {
	title: string;
	isFirst?: boolean;
	collapsible?: boolean;
	isCollapsed?: boolean;
	onPress?: () => void;
}) {
	const { isDark, themeVariant } = useTheme();

	// Zugriff auf die Theme-Farben
	const themeColors = (colors as any).theme?.extend?.colors;

	// Hintergrundfarbe für den Container aus der Tailwind-Konfiguration
	const containerBgColor = isDark
		? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';

	// Randfarbe für den Container aus der Tailwind-Konfiguration
	const containerBorderColor = isDark
		? themeColors?.dark?.[themeVariant]?.border || '#424242'
		: themeColors?.[themeVariant]?.border || '#e6e6e6';

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			marginTop: isFirst ? 8 : collapsible ? 4 : 24,
			marginBottom: collapsible ? 12 : 16,
			paddingHorizontal: 16,
			paddingVertical: collapsible ? 20 : 0,
		},
		collapsedContainer: {
			backgroundColor: containerBgColor,
			borderColor: containerBorderColor,
			borderWidth: 1,
			borderRadius: 16,
		},
		title: {
			fontSize: 22,
			fontWeight: 'bold',
			color: isDark ? '#FFFFFF' : '#000000',
		},
		collapsibleTitle: {
			fontSize: 16,
			fontWeight: '600',
			color: isDark ? '#FFFFFF' : '#000000',
		},
		chevron: {
			marginLeft: 8,
		},
	});

	if (collapsible && onPress) {
		return (
			<TouchableOpacity
				style={[styles.container, isCollapsed && styles.collapsedContainer]}
				onPress={onPress}
				activeOpacity={0.7}
			>
				<Text style={collapsible ? styles.collapsibleTitle : styles.title}>{title}</Text>
				<Icon
					name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
					size={28}
					color={isDark ? '#FFFFFF' : '#000000'}
					style={styles.chevron}
				/>
			</TouchableOpacity>
		);
	}

	return (
		<Text
			style={[styles.title, { marginTop: isFirst ? 8 : 24, marginBottom: 16, paddingLeft: 16 }]}
		>
			{title}
		</Text>
	);
}

// Hauptkomponente
export default function SettingsScreen() {
	const router = useRouter();
	const { isDark, themeVariant } = useTheme();
	const { signOut, user } = useAuth();
	const { saveLocation, setSaveLocation } = useLocation();
	const { track } = useAnalytics();
	const { showSuccess } = useToast();
	const { requestRating } = useRating();

	// Settings from store
	const {
		enableAnalytics,
		enableNewsletter,
		developerMode,
		showDebugBorders,
		enableDiarization,
		showRecordingInstruction,
		showLanguageButton,
		showBlueprints,
		showManaBadge,
		preferredInputUid,
		preferredInputName,
		showMicrophoneButton,
		setEnableAnalytics,
		setEnableNewsletter,
		setDeveloperMode,
		setShowDebugBorders,
		setEnableDiarization,
		setPreferredInput,
		setShowMicrophoneButton,
		setShowRecordingInstruction,
		setShowLanguageButton,
		setShowBlueprints,
		setShowManaBadge,
	} = useSettingsStore();
	const { availableInputs } = useRecordingStore();
	const [isLanguageSelectorVisible, setIsLanguageSelectorVisible] = useState(false);
	const [isRecordingLanguageSelectorVisible, setIsRecordingLanguageSelectorVisible] =
		useState(false);
	const [isMicrophoneSelectorVisible, setIsMicrophoneSelectorVisible] = useState(false);
	const [showMoreSettings, setShowMoreSettings] = useState(false);
	const [showMigrationModal, setShowMigrationModal] = useState(false);
	const [showUIElements, setShowUIElements] = useState(false);
	const [showEasterEgg, setShowEasterEgg] = useState(false);
	const [settingsSearchQuery, setSettingsSearchQuery] = useState('');
	const scrollViewRef = useRef<ScrollView>(null);
	const sectionPositions = useRef<Record<string, number>>({});

	// i18n Hooks
	const { t } = useTranslation();
	const { currentLanguage, languages } = useLanguage();
	const { recordingLanguages, toggleRecordingLanguage, supportedAzureLanguages } =
		useRecordingLanguage();

	// Page onboarding
	const { showPageOnboardingToast, cleanupPageToast, resetOnboardingForTesting } =
		usePageOnboarding();

	// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
	const themeColors = (colors as any).theme?.extend?.colors;
	const pageBackgroundColor = isDark
		? themeColors?.dark?.[themeVariant]?.pageBackground || '#121212'
		: themeColors?.[themeVariant]?.pageBackground || '#F5F5F5';

	// Styles für die Seite
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: pageBackgroundColor,
		},
		content: {
			paddingHorizontal: 16,
			paddingTop: 0,
			paddingBottom: 16,
		},
		settingGroup: {
			marginBottom: 12,
		},
		infoText: {
			fontSize: 14,
			marginBottom: 16,
			lineHeight: 20,
			color: isDark ? '#CCCCCC' : '#666666',
		},
		appInfoContainer: {
			marginBottom: 24,
		},
		infoCard: {
			backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
			borderRadius: 16,
			borderWidth: 1,
			borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 2,
			},
			shadowOpacity: isDark ? 0.3 : 0.1,
			shadowRadius: 4,
			elevation: 3,
		},
		infoSection: {
			padding: 20,
		},
		copyButtonContainer: {
			position: 'absolute',
			top: 20,
			right: 20,
			padding: 8,
			borderRadius: 8,
			backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
		},
		infoCardHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: 16,
		},
		infoIcon: {
			marginRight: 12,
		},
		infoCardTitle: {
			fontSize: 18,
			fontWeight: '600',
			color: isDark ? '#FFFFFF' : '#000000',
		},
		infoCardContent: {
			gap: 12,
		},
		infoRow: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: 8,
			borderBottomWidth: 1,
			borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
		},
		infoLabel: {
			fontSize: 14,
			color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
			flex: 1,
		},
		infoValue: {
			fontSize: 14,
			fontWeight: '500',
			color: isDark ? '#FFFFFF' : '#000000',
			textAlign: 'right',
			flex: 1,
		},
		logoutButton: {
			marginTop: 16,
		},
		deleteButton: {
			marginTop: 8,
		},
		userInfo: {
			marginBottom: 24,
		},
		userEmailLabel: {
			fontSize: 14,
			color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
			marginBottom: 4,
		},
		userEmail: {
			fontSize: 16,
			fontWeight: '500',
			marginBottom: 4,
			color: isDark ? '#FFFFFF' : '#000000',
		},
		userId: {
			fontSize: 12,
			color: isDark ? '#AAAAAA' : '#666666',
		},
		moreSettingsButton: {
			width: '100%',
			marginBottom: 16,
			height: 56,
			justifyContent: 'center',
		},
		moreSettingsSection: {
			backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
			borderRadius: 16,
			padding: 16,
			marginBottom: 24,
			borderWidth: 1,
			borderColor: isDark ? '#424242' : '#e6e6e6',
		},
		sectionSubtitle: {
			fontSize: 18,
			fontWeight: '600',
			marginBottom: 12,
			color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
		},
		versionContainer: {
			flexDirection: 'row',
			justifyContent: 'center',
			marginTop: 60,
			marginBottom: 24,
			paddingHorizontal: 16,
		},
		versionText: {
			fontSize: 14,
			color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
		},
		selectedLanguagesList: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			marginTop: 8,
		},
		selectedLanguageChip: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: isDark ? '#333333' : '#E0E0E0',
			borderRadius: 16,
			paddingHorizontal: 12,
			paddingVertical: 6,
			marginRight: 8,
			marginBottom: 8,
		},
		languageEmoji: {
			fontSize: 16,
			marginRight: 4,
		},
		languageCode: {
			fontSize: 14,
			color: isDark ? '#FFFFFF' : '#000000',
		},
		creditsContainer: {
			alignItems: 'center',
			marginVertical: 24,
			paddingBottom: Platform.OS === 'ios' ? 20 : 16,
		},
		creditsText: {
			fontSize: 14,
			color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
			textAlign: 'center',
			marginBottom: 4,
		},
		creditsSubtext: {
			fontSize: 12,
			color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
			textAlign: 'center',
		},
	});

	// Header-Konfiguration mit dem useHeader-Hook aktualisieren
	const { updateConfig, headerHeight } = useHeader();

	// Copy app info to clipboard
	const copyAppInfo = async () => {
		const appVersion = Constants.expoConfig?.version || 'N/A';
		const buildNumber =
			Platform.OS === 'ios'
				? Constants.expoConfig?.ios?.buildNumber || 'N/A'
				: Constants.expoConfig?.android?.versionCode || 'N/A';
		const deviceModel = Device.modelName || 'N/A';
		const osVersion = `${Device.osName} ${Device.osVersion}`;
		const deviceType =
			Device.deviceType === Device.DeviceType.PHONE
				? t('settings.phone', 'Smartphone')
				: Device.deviceType === Device.DeviceType.TABLET
					? t('settings.tablet', 'Tablet')
					: t('settings.unknown', 'Unbekannt');

		const infoText = `Memoro App Information
${t('settings.app_version', 'App-Version')}: ${appVersion}
${t('settings.build_number', 'Build-Nummer')}: ${buildNumber}
${t('settings.device_model', 'Modell')}: ${deviceModel}
${t('settings.os_version', 'System')}: ${osVersion}
${t('settings.device_type', 'Typ')}: ${deviceType}`;

		await Clipboard.setStringAsync(infoText);
		showSuccess(t('settings.info_copied', 'App-Informationen kopiert'));
	};

	// Header-Konfiguration aktualisieren, wenn die Seite fokussiert wird
	useFocusEffect(
		useCallback(() => {
			console.debug('Settings page focused, updating header config');

			// Settings page doesn't need onboarding toast - it's self-explanatory
			// showPageOnboardingToast('settings');

			updateConfig({
				title: '',
				showTitle: false,
				showBackButton: true,
				backgroundColor: 'transparent',
				rightIcons: [],
				selectedTags: [],
			});

			// Header-Konfiguration zurücksetzen, wenn die Komponente unfokussiert wird
			return () => {
				// No cleanup needed since we don't show onboarding toast on settings
				// cleanupPageToast('settings');

				console.debug('Settings page unfocused');
			};
		}, [t])
	);

	// Handler für die Sprachauswahl
	const handleOpenLanguageSelector = () => {
		setIsLanguageSelectorVisible(true);
	};

	const handleCloseLanguageSelector = () => {
		setIsLanguageSelectorVisible(false);
	};

	const handleOpenRecordingLanguageSelector = () => {
		setIsRecordingLanguageSelectorVisible(true);
	};

	const handleCloseRecordingLanguageSelector = () => {
		setIsRecordingLanguageSelectorVisible(false);
	};

	// Wrapper functions for toggles with toast feedback
	const handleLocationToggle = async (value: boolean) => {
		await setSaveLocation(value);
		showSuccess(
			t('settings.location_updated', 'Location Setting Updated'),
			t(
				value ? 'settings.location_enabled_message' : 'settings.location_disabled_message',
				value ? 'Location saving has been enabled.' : 'Location saving has been disabled.'
			)
		);
	};

	const handleAnalyticsToggle = (value: boolean) => {
		setEnableAnalytics(value);
		showSuccess(
			t('settings.analytics_updated', 'Analytics Setting Updated'),
			t(
				value ? 'settings.analytics_enabled_message' : 'settings.analytics_disabled_message',
				value ? 'Analytics have been enabled.' : 'Analytics have been disabled.'
			)
		);
	};

	// Section keys for search - maps to the SectionHeader titles used in JSX
	const sectionKeys = useMemo(
		() => [
			{ key: 'design', title: t('settings.title', 'Einstellungen') }, // top / design section
			{ key: 'ai', title: t('settings.ai', 'KI') },
			{ key: 'ui', title: t('settings.user_interface', 'Aufnahme Seite Elemente') },
			{ key: 'recording', title: t('settings.recording', 'Aufnahme') },
			{ key: 'data', title: t('settings.data', 'Daten') },
			{ key: 'communication', title: t('settings.communication', 'Kommunikation') },
			{ key: 'support', title: t('settings.support', 'Support') },
			{ key: 'developer', title: t('settings.developer_settings', 'Entwickler-Einstellungen') },
			{ key: 'account', title: t('settings.account', 'Konto') },
			{ key: 'app_info', title: t('settings.app_info', 'App-Informationen') },
		],
		[t]
	);

	// Handle search: find matching section and scroll to it
	const handleSettingsSearch = useCallback(
		(query: string) => {
			setSettingsSearchQuery(query);
			if (!query.trim()) return;

			const lowerQuery = query.toLowerCase();
			const match = sectionKeys.find((s) => s.title.toLowerCase().includes(lowerQuery));
			if (match && sectionPositions.current[match.key] !== undefined) {
				// Account for contentContainerStyle paddingTop offset
				const offsetY = sectionPositions.current[match.key] + (headerHeight - 44);
				scrollViewRef.current?.scrollTo({
					y: Math.max(0, offsetY - 16),
					animated: true,
				});
			}
		},
		[sectionKeys, headerHeight]
	);

	const handleSettingsSearchClose = useCallback(() => {
		setSettingsSearchQuery('');
	}, []);

	// Register search provider so global search button works on this page
	useSearchProvider({
		id: 'settings',
		placeholder: t('settings.search_placeholder', 'Einstellungen durchsuchen...'),
		onSearch: handleSettingsSearch,
		onClose: handleSettingsSearchClose,
	});

	// Helper to create onLayout handler for a section
	const sectionLayout = useCallback(
		(key: string) => (e: LayoutChangeEvent) => {
			sectionPositions.current[key] = e.nativeEvent.layout.y;
		},
		[]
	);

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<LanguageSelector
				isVisible={isLanguageSelectorVisible}
				onClose={handleCloseLanguageSelector}
			/>
			<MultiLanguageSelector
				isVisible={isRecordingLanguageSelectorVisible}
				onClose={handleCloseRecordingLanguageSelector}
				languages={supportedAzureLanguages}
				selectedLanguages={recordingLanguages}
				onToggleLanguage={toggleRecordingLanguage}
				title={t('settings.recording_languages', 'Bevorzugte Transkriptionssprachen')}
			/>
			<MicrophoneSelector
				isVisible={isMicrophoneSelectorVisible}
				onClose={() => setIsMicrophoneSelectorVisible(false)}
				inputs={availableInputs}
				selectedInputUid={preferredInputUid}
				onSelectInput={setPreferredInput}
			/>
			<ScrollView
				ref={scrollViewRef}
				style={styles.container}
				contentContainerStyle={{ paddingTop: headerHeight - 44 }}
			>
				<View style={styles.content}>
					<View style={{ alignItems: 'center', paddingBottom: 0, marginBottom: 24 }}>
						<Text
							style={{
								fontSize: 40,
								lineHeight: 40,
								fontWeight: '700',
								color: isDark ? '#FFFFFF' : '#000000',
								alignSelf: 'center',
							}}
							numberOfLines={1}
						>
							{t('settings.title', 'Einstellungen')}
						</Text>
					</View>
					{/* Design-Einstellungen */}
					<View onLayout={sectionLayout('design')} style={[styles.settingGroup, { marginTop: 0 }]}>
						<ThemeSettings />

						<View style={{ marginTop: 16 }}>
							<SettingsToggle
								title={t('settings.interface_language', 'Oberflächen-Sprache')}
								description={`${languages[currentLanguage as keyof typeof languages]?.emoji} ${languages[currentLanguage as keyof typeof languages]?.nativeName}`}
								type="button"
								onPress={handleOpenLanguageSelector}
							/>
						</View>
					</View>

					{/* KI */}
					<View onLayout={sectionLayout('ai')}>
						<SectionHeader title={t('settings.ai', 'KI')} />
					</View>
					<View style={styles.settingGroup}>
						<SystemPromptSettings />
					</View>

					{/* Benutzeroberfläche */}
					<View onLayout={sectionLayout('ui')}>
						<SectionHeader
							title={t('settings.user_interface', 'Aufnahme Seite Elemente')}
							collapsible={true}
							isCollapsed={!showUIElements}
							onPress={() => setShowUIElements(!showUIElements)}
						/>
					</View>
					{showUIElements && (
						<View style={styles.settingGroup}>
							<SettingsToggle
								title={t('settings.show_language_button', 'Sprachen-Button anzeigen')}
								description={t(
									'settings.show_language_button_description',
									'Zeigt den Sprachen-Auswahl-Button neben dem Aufnahme-Button'
								)}
								type="toggle"
								isOn={showLanguageButton}
								onToggle={setShowLanguageButton}
							/>

							<View style={{ marginTop: 16 }}>
								<SettingsToggle
									title={t('settings.show_recording_instruction', 'Aufnahme-Anleitung anzeigen')}
									description={t(
										'settings.show_recording_instruction_description',
										'Zeigt "Aufnahme starten" Text mit Pfeil beim Recording-Button'
									)}
									type="toggle"
									isOn={showRecordingInstruction}
									onToggle={setShowRecordingInstruction}
								/>
							</View>

							<View style={{ marginTop: 16 }}>
								<SettingsToggle
									title={t('settings.show_blueprints', 'Blueprints anzeigen')}
									description={t(
										'settings.show_blueprints_description',
										'Zeigt die Blueprint-Auswahl am unteren Bildschirmrand'
									)}
									type="toggle"
									isOn={showBlueprints}
									onToggle={setShowBlueprints}
								/>
							</View>

							<View style={{ marginTop: 16 }}>
								<SettingsToggle
									title={t('settings.show_mana_badge', 'Mana-Anzeige im Header')}
									description={t(
										'settings.show_mana_badge_description',
										'Zeigt den Mana-Zähler oben im Header an'
									)}
									type="toggle"
									isOn={showManaBadge}
									onToggle={setShowManaBadge}
								/>
							</View>
						</View>
					)}

					{/* Aufnahme */}
					<View onLayout={sectionLayout('recording')}>
						<SectionHeader title={t('settings.recording', 'Aufnahme')} />
					</View>
					<View style={styles.settingGroup}>
						<SettingsToggle
							title={t('settings.recording_languages', 'Bevorzugte Transkriptionssprachen')}
							description={t(
								'settings.recording_languages_description',
								'Wähle die Sprachen, die bei der Transkription bevorzugt erkannt werden sollen'
							)}
							type="button"
							onPress={handleOpenRecordingLanguageSelector}
							secondaryText={
								recordingLanguages.length > 0
									? recordingLanguages.map((lang) => supportedAzureLanguages[lang]?.emoji).join(' ')
									: t('settings.recording_languages_auto', 'Automatisch')
							}
						/>

						<View style={{ marginTop: 16 }}>
							<SettingsToggle
								title={t('settings.enable_diarization', 'Enable Speaker Diarization')}
								description={t(
									'settings.enable_diarization_description',
									'Automatically identify and separate different speakers in recordings'
								)}
								type="toggle"
								isOn={enableDiarization}
								onToggle={setEnableDiarization}
							/>
						</View>

						<View style={{ marginTop: 16 }}>
							<SettingsToggle
								title={t('settings.preferred_microphone', 'Preferred Microphone')}
								description={t(
									'settings.preferred_microphone_description',
									'Choose the default microphone for recordings'
								)}
								type="button"
								onPress={() => setIsMicrophoneSelectorVisible(true)}
								secondaryText={
									preferredInputName ?? t('recording.system_default', 'System Default')
								}
							/>
						</View>

						<View style={{ marginTop: 16 }}>
							<SettingsToggle
								title={t('settings.show_microphone_button', 'Show Microphone Button')}
								description={t(
									'settings.show_microphone_button_description',
									'Show the microphone selection button on the recording screen'
								)}
								type="toggle"
								isOn={showMicrophoneButton}
								onToggle={setShowMicrophoneButton}
							/>
						</View>
					</View>

					{/* Daten */}
					<View onLayout={sectionLayout('data')}>
						<SectionHeader title={t('settings.data', 'Daten')} />
					</View>
					<View style={styles.settingGroup}>
						<SettingsToggle
							title={t('settings.save_location', 'Standort speichern')}
							description={t(
								'settings.save_location_description',
								'Erlaube der App, deinen Standort zu speichern, um standortbezogene Funktionen zu ermöglichen'
							)}
							type="toggle"
							isOn={saveLocation}
							onToggle={handleLocationToggle}
						/>

						<View style={{ marginTop: 16 }}>
							<SettingsToggle
								title={t('settings.enable_analytics', 'Analytics aktivieren')}
								description={t(
									'settings.enable_analytics_description',
									'Ich stimme der Verwendung von Analytics zu, um meine Benutzererfahrung zu verbessern'
								)}
								type="toggle"
								isOn={enableAnalytics}
								onToggle={handleAnalyticsToggle}
							/>
						</View>
					</View>

					{/* Kommunikation */}
					<View onLayout={sectionLayout('communication')}>
						<SectionHeader title={t('settings.communication', 'Kommunikation')} />
					</View>
					<View style={styles.settingGroup}>
						<EmailNewsletterSettings />
					</View>

					{/* Support */}
					<View onLayout={sectionLayout('support')}>
						<SectionHeader title={t('settings.support', 'Support')} />
					</View>
					<View style={styles.settingGroup}>
						<SettingsToggle
							title={t('settings.contact_support', 'Support kontaktieren')}
							description={t(
								'settings.contact_support_description',
								'Benötigst du Hilfe? Kontaktiere unser Support-Team'
							)}
							type="button"
							onPress={() => {
								openSupportEmail({ userId: user?.id, t });
							}}
						/>

						<View style={{ marginTop: 16 }}>
							<SettingsToggle
								title={t('settings.rate_app', 'App bewerten')}
								description={t(
									'settings.rate_app_description',
									'Gefällt dir Memoro? Bewerte uns im App Store'
								)}
								type="button"
								onPress={requestRating}
								icon="star-outline"
							/>
						</View>
					</View>

					{/* Anzeige-Abschnitt wurde entfernt und in den Darstellung-Abschnitt verschoben */}

					{/* Mehr Einstellungen Button */}
					<Button
						title={t('settings.show_more_settings', 'Erweiterte Einstellungen anzeigen')}
						variant="secondary"
						iconName={showMoreSettings ? 'chevron-up-outline' : 'chevron-down-outline'}
						onPress={() => setShowMoreSettings(!showMoreSettings)}
						style={styles.moreSettingsButton}
					/>

					{/* Erweiterte Einstellungen Bereich */}
					{showMoreSettings && (
						<View style={styles.moreSettingsSection}>
							{/* Konto löschen */}
							<View style={styles.settingGroup}>
								<Text style={styles.sectionSubtitle}>
									{t('settings.delete_account', 'Konto löschen')}
								</Text>
								<Text style={styles.infoText}>
									{t(
										'settings.delete_account_warning',
										'Wenn du dein Konto löschst, werden alle deine Daten dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.'
									)}
								</Text>
								<Button
									title={t('settings.delete_account_button', 'Konto löschen')}
									variant="danger"
									onPress={() => {
										// Hier würde normalerweise ein Dialog angezeigt werden
										console.debug('Konto löschen angefordert');
									}}
									style={styles.deleteButton}
								/>
							</View>
						</View>
					)}

					{developerMode && (
						<>
							<View onLayout={sectionLayout('developer')}>
								<SectionHeader
									title={t('settings.developer_settings', 'Entwickler-Einstellungen')}
								/>
							</View>
							<View style={styles.settingGroup}>
								<SettingsToggle
									title={t('settings.debug_borders', 'Debug-Rahmen')}
									description={t(
										'settings.debug_borders_description',
										'Zeige Rahmen um UI-Elemente für eine bessere Entwicklung'
									)}
									type="toggle"
									isOn={showDebugBorders}
									onToggle={setShowDebugBorders}
								/>

								<Button
									title={t('settings.show_onboarding', 'Onboarding anzeigen')}
									variant="secondary"
									iconName="information-circle-outline"
									onPress={() => router.push('/(public)/login?showOnboarding=true')}
									style={{
										marginTop: 16,
										marginBottom: 8,
									}}
								/>

								<Button
									title={t('settings.reset_onboarding_toasts', 'Onboarding-Toasts zurücksetzen')}
									variant="secondary"
									iconName="bug-outline"
									onPress={() => {
										console.log('User object:', user);
										console.log('App metadata:', user?.app_metadata);
										console.log('User metadata:', user?.user_metadata);
										Alert.alert(
											'User Debug Info',
											JSON.stringify(
												{
													email: user?.email,
													app_metadata: user?.app_metadata,
													user_metadata: user?.user_metadata,
												},
												null,
												2
											)
										);
									}}
									style={{
										marginTop: 8,
										marginBottom: 8,
									}}
								/>

								<Button
									title={t('settings.reset_onboarding_toasts', 'Onboarding-Toasts zurücksetzen')}
									variant="secondary"
									iconName="refresh-outline"
									onPress={() => {
										resetOnboardingForTesting();
										Alert.alert(
											t('settings.reset_complete', 'Zurücksetzung abgeschlossen'),
											t(
												'settings.reset_onboarding_message',
												'Alle Onboarding-Toasts werden wieder angezeigt, wenn du die entsprechenden Seiten besuchst.'
											)
										);
									}}
									style={{
										marginTop: 8,
										marginBottom: 8,
									}}
								/>

								<Button
									title="Test Analytics Event"
									variant="secondary"
									iconName="analytics-outline"
									onPress={() => {
										track('test_analytics_button_pressed', {
											timestamp: new Date().toISOString(),
											screen: 'settings',
											user_id: user?.id,
										});
										Alert.alert(
											'Analytics Test',
											'Event gesendet! Überprüfe die Konsole und dein PostHog Dashboard.'
										);
									}}
									style={{
										marginTop: 8,
										marginBottom: 8,
									}}
								/>

								<Button
									title="Migration Modal anzeigen"
									variant="secondary"
									iconName="cloud-upload-outline"
									onPress={() => setShowMigrationModal(true)}
									style={{
										marginTop: 8,
										marginBottom: 8,
									}}
								/>
							</View>
						</>
					)}

					{/* Konto */}
					<View onLayout={sectionLayout('account')}>
						<SectionHeader title={t('settings.account', 'Konto')} />
					</View>
					<View style={styles.moreSettingsSection}>
						{user && (
							<View style={styles.userInfo}>
								<Text style={styles.userEmailLabel}>
									{t('settings.email_label', 'E-Mail-Adresse')}
								</Text>
								<Text style={styles.userEmail}>
									{user.email || t('settings.no_email', 'Keine E-Mail verfügbar')}
								</Text>
							</View>
						)}

						<Button
							title={t('settings.logout', 'Abmelden')}
							variant="danger"
							iconName="log-out-outline"
							onPress={() => {
								Alert.alert(
									t('settings.logout_confirm_title', 'Abmelden bestätigen'),
									t('settings.logout_confirm_message', 'Möchtest du dich wirklich abmelden?'),
									[
										{
											text: t('common.cancel', 'Abbrechen'),
											style: 'cancel',
										},
										{
											text: t('settings.logout', 'Abmelden'),
											style: 'destructive',
											onPress: signOut,
										},
									]
								);
							}}
							style={styles.logoutButton}
						/>
					</View>

					{/* App-Informationen */}

					{/* App & Device Information */}
					<View onLayout={sectionLayout('app_info')}>
						<SectionHeader title={t('settings.app_info', 'App-Informationen')} />
					</View>
					<View>
						<View style={styles.infoCard}>
							{/* App Version Section */}
							<View style={styles.infoSection}>
								<View style={styles.infoCardHeader}>
									<Icon
										name="information-circle-outline"
										size={24}
										color={isDark ? '#4A90E2' : '#2E7CD6'}
										style={styles.infoIcon}
									/>
									<Text style={styles.infoCardTitle}>{t('settings.version_info', 'Version')}</Text>
								</View>
								<View style={styles.infoCardContent}>
									<View style={styles.infoRow}>
										<Text style={styles.infoLabel}>{t('settings.app_version', 'App-Version')}</Text>
										<Text style={styles.infoValue}>{Constants.expoConfig?.version || 'N/A'}</Text>
									</View>
									<View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
										<Text style={styles.infoLabel}>
											{t('settings.build_number', 'Build-Nummer')}
										</Text>
										<Text style={styles.infoValue}>
											{Platform.OS === 'ios'
												? Constants.expoConfig?.ios?.buildNumber || 'N/A'
												: Constants.expoConfig?.android?.versionCode || 'N/A'}
										</Text>
									</View>
								</View>
							</View>

							{/* Copy Button */}
							<TouchableOpacity onPress={copyAppInfo} style={styles.copyButtonContainer}>
								<Icon
									name="copy-outline"
									size={20}
									color={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
								/>
							</TouchableOpacity>
						</View>
					</View>

					{/* Environment Variables (Developer Mode Only) */}
					{developerMode && (
						<>
							<SectionHeader title={t('settings.environment_variables', 'Environment Variables')} />
							<View style={styles.infoCard}>
								<View style={styles.infoSection}>
									<View style={styles.infoCardHeader}>
										<Icon
											name="settings-outline"
											size={24}
											color={isDark ? '#4A90E2' : '#2E7CD6'}
											style={styles.infoIcon}
										/>
										<Text style={styles.infoCardTitle}>
											{t('settings.env_config', 'Environment Configuration')}
										</Text>
									</View>
									<View style={styles.infoCardContent}>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>SUPABASE_URL</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.SUPABASE_URL}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>SUPABASE_ANON_KEY</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.SUPABASE_ANON_KEY}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>MEMORO_MIDDLEWARE_URL</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.MEMORO_MIDDLEWARE_URL}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>MANA_MIDDLEWARE_URL</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.MANA_MIDDLEWARE_URL}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>MIDDLEWARE_APP_ID</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.MIDDLEWARE_APP_ID}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>STORAGE_BUCKET</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.STORAGE_BUCKET}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>REVENUECAT_IOS_KEY</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.REVENUECAT_IOS_KEY || 'Not set'}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>GOOGLE_CLIENT_ID</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.GOOGLE_CLIENT_ID || 'Not set'}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 0 },
											]}
										>
											<Text style={styles.infoLabel}>POSTHOG_KEY</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{config.POSTHOG_KEY || 'Not set'}
											</Text>
										</View>
									</View>
								</View>
							</View>

							{/* Supabase Client Configuration */}
							<SectionHeader
								title={t('settings.supabase_config', 'Supabase Client Configuration')}
							/>
							<View style={styles.infoCard}>
								<View style={styles.infoSection}>
									<View style={styles.infoCardHeader}>
										<Icon
											name="server"
											size={24}
											color={isDark ? '#4A90E2' : '#2E7CD6'}
											style={styles.infoIcon}
										/>
										<Text style={styles.infoCardTitle}>
											{t('settings.supabase_init', 'Supabase Initialization')}
										</Text>
									</View>
									<View style={styles.infoCardContent}>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>Main Supabase Client URL</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{supabaseUrl}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>Main Supabase Anon Key</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{supabaseAnonKey}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>Key Format</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{supabaseAnonKey.startsWith('eyJ')
													? 'JWT Format (Legacy)'
													: 'Publishable Key Format (New)'}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>URL Match Status</Text>
											<Text
												style={[
													styles.infoValue,
													{
														fontSize: 12,
														marginTop: 4,
														color: supabaseUrl === config.SUPABASE_URL ? '#4CAF50' : '#FF5252',
													},
												]}
											>
												{supabaseUrl === config.SUPABASE_URL
													? '✓ URLs Match'
													: '✗ URLs Do Not Match'}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start' },
											]}
										>
											<Text style={styles.infoLabel}>Key Match Status</Text>
											<Text
												style={[
													styles.infoValue,
													{
														fontSize: 12,
														marginTop: 4,
														color:
															supabaseAnonKey === config.SUPABASE_ANON_KEY ? '#4CAF50' : '#FF5252',
													},
												]}
											>
												{supabaseAnonKey === config.SUPABASE_ANON_KEY
													? '✓ Keys Match'
													: '✗ Keys Do Not Match'}
											</Text>
										</View>
										<View
											style={[
												styles.infoRow,
												{ flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 0 },
											]}
										>
											<Text style={styles.infoLabel}>Environment Source</Text>
											<Text style={[styles.infoValue, { fontSize: 12, marginTop: 4 }]}>
												{process.env.EXPO_PUBLIC_SUPABASE_URL
													? 'Environment Variable'
													: 'Fallback Default'}
											</Text>
										</View>
									</View>
								</View>
							</View>
						</>
					)}

					{/* Credits */}
					<Pressable
						style={styles.creditsContainer}
						onLongPress={() => setShowEasterEgg(true)}
						delayLongPress={1500}
					>
						<Text style={styles.creditsText}>© 2025 Memoro GmbH</Text>
						<Text style={styles.creditsSubtext}>Made with ❤️ in Germany</Text>
					</Pressable>
				</View>
			</ScrollView>
			<MigrationNotificationModal
				isVisible={showMigrationModal}
				onClose={() => setShowMigrationModal(false)}
				subscriptionPlanId={
					user?.app_metadata?.subscription_plan_id ||
					user?.user_metadata?.subscription ||
					'Pro User'
				}
			/>
			<EasterEggModal
				isVisible={showEasterEgg}
				onClose={() => setShowEasterEgg(false)}
				onLongPress={() => {
					setShowEasterEgg(false);
					const newMode = !developerMode;
					setDeveloperMode(newMode);
					showSuccess(
						t(
							newMode ? 'settings.developer_mode_enabled' : 'settings.developer_mode_disabled',
							newMode ? 'Developer Mode aktiviert' : 'Developer Mode deaktiviert'
						),
						t(
							newMode ? 'settings.developer_mode_message' : 'settings.developer_mode_hidden',
							newMode
								? 'Entwicklereinstellungen sind jetzt sichtbar'
								: 'Entwicklereinstellungen wurden ausgeblendet'
						)
					);
				}}
			/>
		</>
	);
}
