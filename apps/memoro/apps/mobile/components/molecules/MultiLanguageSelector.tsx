import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Text from '~/components/atoms/Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import BaseModal from '~/components/atoms/BaseModal';
import BaseLanguageSelector, { LanguageItem } from '~/components/molecules/BaseLanguageSelector';
import { useTranslation } from 'react-i18next';
import Icon from '~/components/atoms/Icon';

const tailwindConfig = require('../../tailwind.config.js');

interface Language {
	nativeName: string;
	emoji: string;
	locale?: string;
}

interface MultiLanguageSelectorProps {
	isVisible?: boolean;
	onClose?: () => void;
	languages: Record<string, Language>;
	selectedLanguages?: string[];
	onToggleLanguage: (language: string) => void;
	title?: string;

	// Eigenschaften für den Button-Modus
	buttonMode?: boolean;
	size?: number;
	onButtonPress?: () => void;
}

const MultiLanguageSelector: React.FC<MultiLanguageSelectorProps> = ({
	isVisible = false,
	onClose = () => {},
	languages,
	selectedLanguages = [],
	onToggleLanguage,
	title,
	buttonMode = false,
	size = 40,
	onButtonPress,
}) => {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();
	const [modalVisible, setModalVisible] = useState(isVisible);

	// Aktualisiere modalVisible, wenn sich isVisible ändert
	useEffect(() => {
		setModalVisible(isVisible);
	}, [isVisible]);

	// Get theme colors
	const getThemeColors = () => {
		try {
			if (tailwindConfig?.theme?.extend?.colors) {
				const colors = tailwindConfig.theme.extend.colors;

				if (isDark && colors.dark?.[themeVariant]) {
					return {
						text: colors.dark[themeVariant].text || '#FFFFFF',
						primary: colors.dark[themeVariant].primary || '#f8d62b',
						primaryButton: colors.dark[themeVariant].primaryButton || '#f8d62b',
						contentBackground: colors.dark[themeVariant].contentBackground || '#1E1E1E',
						contentBackgroundHover: colors.dark[themeVariant].contentBackgroundHover || '#333333',
						menuBackground: colors.dark[themeVariant].menuBackground || '#252525',
						border: colors.dark[themeVariant].borderLight || '#333333',
					};
				} else if (colors[themeVariant]) {
					return {
						text: colors[themeVariant].text || '#000000',
						primary: colors[themeVariant].primary || '#f8d62b',
						primaryButton: colors[themeVariant].primaryButton || '#f8d62b',
						contentBackground: colors[themeVariant].contentBackground || '#ffffff',
						contentBackgroundHover: colors[themeVariant].contentBackgroundHover || '#f5f5f5',
						menuBackground: colors[themeVariant].menuBackground || '#dddddd',
						border: colors[themeVariant].borderLight || '#f2f2f2',
					};
				}
			}

			// Fallback colors
			return {
				text: isDark ? '#FFFFFF' : '#000000',
				primary: '#f8d62b',
				primaryButton: '#f8d62b',
				contentBackground: isDark ? '#1E1E1E' : '#ffffff',
				contentBackgroundHover: isDark ? '#333333' : '#f5f5f5',
				menuBackground: isDark ? '#252525' : '#dddddd',
				border: isDark ? '#333333' : '#f2f2f2',
			};
		} catch (e) {
			console.debug('Error loading theme colors:', e);
			return {
				text: isDark ? '#FFFFFF' : '#000000',
				primary: '#f8d62b',
				primaryButton: '#f8d62b',
				contentBackground: isDark ? '#1E1E1E' : '#ffffff',
				contentBackgroundHover: isDark ? '#333333' : '#f5f5f5',
				menuBackground: isDark ? '#252525' : '#dddddd',
				border: isDark ? '#333333' : '#f2f2f2',
			};
		}
	};

	const themeColors = getThemeColors();

	// Convert languages to BaseLanguageSelector format
	const languageItems: Record<string, LanguageItem> = Object.entries(languages).reduce(
		(acc, [code, lang]) => {
			acc[code] = {
				code,
				...lang,
			};
			return acc;
		},
		{} as Record<string, LanguageItem>
	);

	// Handler for selection changes
	const handleSelectionChange = (newSelection: string[]) => {
		// Ensure selectedLanguages is always an array - defensive check for undefined/null
		const safeSelectedLanguages = Array.isArray(selectedLanguages) ? selectedLanguages : [];
		// Find the difference to determine which language was toggled
		const added = newSelection.find((lang) => !safeSelectedLanguages.includes(lang));
		const removed = safeSelectedLanguages.find((lang) => !newSelection.includes(lang));

		if (added) {
			onToggleLanguage(added);
		} else if (removed) {
			onToggleLanguage(removed);
		}
	};

	const handleOpenModal = () => {
		setModalVisible(true);
		if (onButtonPress) onButtonPress();
	};

	const handleCloseModal = () => {
		setModalVisible(false);
		if (onClose) onClose();
	};

	// Bestimme den Titel des Modals
	const getModalTitle = () => {
		return title || t('language.select_recording_language', 'Aufnahmesprache auswählen');
	};

	// Bestimme, welches Icon/Emoji für den Button angezeigt werden soll
	const renderSelectorContent = () => {
		// Ensure selectedLanguages is always an array - defensive check for undefined/null
		const safeSelectedLanguages = Array.isArray(selectedLanguages) ? selectedLanguages : [];
		const hasSelection = safeSelectedLanguages.length > 0;

		if (safeSelectedLanguages.length === 0) {
			// Kein Sprachfilter ausgewählt
			return (
				<View style={{ opacity: 0.6 }}>
					<Icon name="language-outline" size={size * 0.6} color={themeColors.text} />
				</View>
			);
		} else if (safeSelectedLanguages.includes('auto')) {
			// Auto-Modus ausgewählt
			return (
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						height: '100%',
					}}
				>
					<Text
						style={{
							fontSize: size * 0.65,
							lineHeight: size * 0.75,
							textAlign: 'center',
							includeFontPadding: false,
							marginTop: 2,
						}}
					>
						🌐
					</Text>
				</View>
			);
		} else if (safeSelectedLanguages.length === 1) {
			// Eine Sprache ausgewählt
			const language = safeSelectedLanguages[0];
			const languageData = languages[language];
			const emoji = languageData?.emoji || '🌐';
			return (
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						height: '100%',
					}}
				>
					<Text
						style={{
							fontSize: size * 0.65,
							lineHeight: size * 0.75,
							textAlign: 'center',
							includeFontPadding: false,
							marginTop: 2,
						}}
					>
						{emoji}
					</Text>
				</View>
			);
		} else {
			// Mehrere Sprachen ausgewählt - zeige alle Flaggen vertikal
			// Größere Flaggen bei 2-3 Sprachen
			const flagSize = safeSelectedLanguages.length <= 3 ? size * 0.5 : size * 0.35;

			return (
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						flexDirection: 'column',
					}}
				>
					{safeSelectedLanguages.map((lang, index) => {
						const languageData = languages[lang];
						const emoji = languageData?.emoji || '🌐';
						return (
							<Text
								key={lang}
								style={{
									fontSize: flagSize,
									lineHeight: flagSize,
									marginTop: index === 0 ? 0 : 4, // Mehr Abstand zwischen Flaggen
									includeFontPadding: false,
								}}
							>
								{emoji}
							</Text>
						);
					})}
				</View>
			);
		}
	};

	// Im Button-Modus zeigen wir nur den Button an, der das Modal öffnet
	if (buttonMode) {
		const safeSelectedLanguages = Array.isArray(selectedLanguages) ? selectedLanguages : [];
		const hasSelection = safeSelectedLanguages.length > 0;

		const buttonStyles = StyleSheet.create({
			buttonContainer: {
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: 'transparent',
			},
			selectorButton: {
				borderRadius: size / 2,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: 'transparent',
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0,
				shadowRadius: 2,
				...(Platform.OS === 'android' && {
					elevation: 0,
				}),
			},
		});

		// Dynamische Höhe für mehrere Flaggen
		const buttonHeight =
			safeSelectedLanguages.length > 1 && !safeSelectedLanguages.includes('auto')
				? Math.min(size + (safeSelectedLanguages.length - 1) * size * 0.25, size * 2) // Dynamisch basierend auf Anzahl, max 2x size
				: size;

		return (
			<View style={[buttonStyles.buttonContainer, { width: size, height: buttonHeight }]}>
				<Pressable
					style={[
						buttonStyles.selectorButton,
						{ width: size, height: buttonHeight, borderRadius: buttonHeight / 2 },
					]}
					onPress={handleOpenModal}
					android_ripple={{
						color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
						borderless: true,
						radius: size / 2,
					}}
				>
					{renderSelectorContent()}
				</Pressable>

				<BaseModal
					isVisible={modalVisible}
					onClose={handleCloseModal}
					title={getModalTitle()}
					animationType="fade"
					closeOnOverlayPress={true}
					showCloseButton={true}
					hideFooter={true}
					scrollable={false}
					noPadding={true}
					size="medium"
				>
					<BaseLanguageSelector
						languages={languageItems}
						selectedLanguages={selectedLanguages}
						onSelect={handleSelectionChange}
						mode="multi"
						showAutoDetect={true}
						height={450}
						priorityLanguages={['de', 'en', 'it', 'fr', 'es']}
					/>
				</BaseModal>
			</View>
		);
	}

	// Standard-Modus: Nur das Modal anzeigen
	return (
		<BaseModal
			isVisible={modalVisible}
			onClose={handleCloseModal}
			title={getModalTitle()}
			animationType="fade"
			closeOnOverlayPress={true}
			showCloseButton={true}
			hideFooter={true}
			scrollable={false}
			noPadding={true}
			size="medium"
		>
			<BaseLanguageSelector
				languages={languageItems}
				selectedLanguages={selectedLanguages}
				onSelect={handleSelectionChange}
				mode="multi"
				showAutoDetect={true}
				height={450}
				priorityLanguages={['de', 'en', 'it', 'fr', 'es']}
			/>
		</BaseModal>
	);
};

export default MultiLanguageSelector;
