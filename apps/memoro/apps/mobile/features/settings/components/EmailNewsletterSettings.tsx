import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import SettingsToggle from '~/components/organisms/SettingsToggle';
import Text from '~/components/atoms/Text';
import { useUserSettings } from '../hooks/useUserSettings';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useToast } from '~/features/toast';

export function EmailNewsletterSettings() {
	const { t } = useTranslation();
	const { isDark } = useTheme();
	const { settings, loading, updateEmailNewsletter, error } = useUserSettings();
	const [isUpdating, setIsUpdating] = useState(false);
	const { showSuccess, showError } = useToast();

	const handleEmailNewsletterToggle = async (optIn: boolean) => {
		setIsUpdating(true);
		try {
			await updateEmailNewsletter(optIn);
			showSuccess(
				t('settings.newsletter_updated', 'Newsletter Preference Updated'),
				t(
					optIn
						? 'settings.newsletter_subscribed_message'
						: 'settings.newsletter_unsubscribed_message',
					optIn
						? 'You have subscribed to the Memoro newsletter.'
						: 'You have unsubscribed from the Memoro newsletter.'
				)
			);
		} catch (err) {
			showError(
				t('settings.error', 'Error'),
				t('settings.newsletter_error', 'Failed to update newsletter preference. Please try again.')
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const styles = StyleSheet.create({
		container: {
			marginBottom: 16,
		},
		errorText: {
			fontSize: 12,
			color: isDark ? '#FF6B6B' : '#DC3545',
			marginTop: 4,
			marginLeft: 16,
		},
	});

	return (
		<View style={styles.container}>
			<SettingsToggle
				title={t('settings.newsletter', 'Newsletter')}
				description={t(
					'settings.newsletter_description',
					'Erhalte Updates über neue Funktionen und Verbesserungen'
				)}
				type="toggle"
				isOn={settings.emailNewsletterOptIn || false}
				onToggle={handleEmailNewsletterToggle}
				disabled={loading || isUpdating}
				loading={isUpdating}
			/>
			{error && (
				<Text style={styles.errorText}>
					{t('settings.newsletter_error', 'Failed to update newsletter preference')}
				</Text>
			)}
		</View>
	);
}
