import React, { useCallback } from 'react';
import { Stack, useFocusEffect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import colors from '~/tailwind.config.js';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useHeader } from '~/features/menus/HeaderContext';
import RecordingsList from '~/components/organisms/RecordingsList';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';

/**
 * Audio Archive Seite - Zeigt alle lokalen Audioaufnahmen an
 */
export default function AudioArchive() {
	const { t } = useTranslation();
	const { isDark, themeVariant } = useTheme();
	const { updateConfig } = useHeader();

	// Page onboarding
	const { showPageOnboardingToast, cleanupPageToast } = usePageOnboarding();

	// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration - exakt wie in memos.tsx
	const pageBackgroundColor = isDark
		? colors.theme.extend.colors.dark[themeVariant].pageBackground
		: colors.theme.extend.colors[themeVariant].pageBackground;

	// Header-Konfiguration aktualisieren, wenn die Seite fokussiert wird
	useFocusEffect(
		useCallback(() => {
			// Speichere die aktuelle Konfiguration, um unnötige Updates zu vermeiden
			const currentTitle = t('audio_archive.title', 'Audio Archiv');

			// Show onboarding toast for audio archive page
			showPageOnboardingToast('audio_archive');

			updateConfig({
				title: currentTitle,
				showBackButton: true,
				showMenu: true,
				rightIcons: [],
			});

			return () => {
				// Cleanup page toast when leaving audio archive page
				cleanupPageToast('audio_archive');
			};
		}, [t]) // Remove functions from dependencies to prevent infinite loops
	);

	const styles = StyleSheet.create({
		listContainer: {
			flex: 1,
			width: '100%',
		},
	});

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<View style={{ flex: 1, backgroundColor: pageBackgroundColor }}>
				<View style={styles.listContainer}>
					<RecordingsList />
				</View>
			</View>
		</>
	);
}
