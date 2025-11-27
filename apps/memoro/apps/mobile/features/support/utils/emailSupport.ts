import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { TFunction } from 'i18next';

interface EmailSupportOptions {
	userId?: string;
	t: TFunction;
}

export const openSupportEmail = async ({ userId, t }: EmailSupportOptions) => {
	const email = 'kontakt@memoro.ai';
	const subject = 'Support-Anfrage - Memoro App';
	const body = `Hallo Memoro Team,

ich benötige Hilfe bei:

[Beschreibe hier dein Problem]

Benutzer-ID: ${userId || 'Nicht verfügbar'}
App-Version: ${Constants.expoConfig?.version || 'N/A'}
Plattform: ${Platform.OS}`;

	const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

	try {
		const canOpen = await Linking.canOpenURL(emailUrl);
		if (canOpen) {
			await Linking.openURL(emailUrl);
		} else {
			Alert.alert(
				t('settings.email_error', 'E-Mail-App konnte nicht geöffnet werden'),
				t('settings.email_error_description', 'Bitte sende eine E-Mail an kontakt@memoro.ai')
			);
		}
	} catch (error) {
		console.error('Could not open email app:', error);
		Alert.alert(
			t('settings.email_error', 'E-Mail-App konnte nicht geöffnet werden'),
			t('settings.email_error_description', 'Bitte sende eine E-Mail an kontakt@memoro.ai')
		);
	}
};
