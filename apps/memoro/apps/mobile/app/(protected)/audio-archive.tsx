import React, { useCallback } from 'react';
import { Stack, useFocusEffect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import colors from '~/tailwind.config.js';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import { useHeader } from '~/features/menus/HeaderContext';
import RecordingsList from '~/components/organisms/RecordingsList';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';

/**
 * Audio Archive Seite - Zeigt alle lokalen Audioaufnahmen an
 */
export default function AudioArchive() {
	const { t } = useTranslation();
	const { isDark, themeVariant } = useTheme();
	const { updateConfig, headerHeight } = useHeader();

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
				showTitle: false,
				showBackButton: true,
				backgroundColor: 'transparent',
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
					<RecordingsList
						contentPaddingTop={headerHeight - 20}
						ListHeaderComponent={
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
									{t('audio_archive.title', 'Audio Archiv')}
								</Text>
							</View>
						}
					/>
				</View>
			</View>
		</>
	);
}
