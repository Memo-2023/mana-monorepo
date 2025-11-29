import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ratingService } from '../services/ratingService';
import useNotification from '~/features/notifications/useNotification';
import { NotificationChannel } from '~/features/notifications/types';

export const useRating = () => {
	const { t } = useTranslation();
	const { showNotification } = useNotification();
	const [isRequesting, setIsRequesting] = useState(false);

	const requestRating = useCallback(async () => {
		if (isRequesting) return;

		try {
			setIsRequesting(true);

			// Check if in-app review is available
			const isAvailable = await ratingService.isAvailable();

			if (isAvailable) {
				// Request the in-app review
				const success = await ratingService.requestReview();

				if (success) {
					// Show a thank you notification
					showNotification({
						title: t('rating.thank_you_title', 'Vielen Dank!'),
						body: t('rating.thank_you_message', 'Deine Unterstützung bedeutet uns viel!'),
						channelType: NotificationChannel.FUNCTIONAL,
					});
				}
			} else {
				// Fallback: Show alert with option to open store
				Alert.alert(
					t('rating.rate_app_title', 'App bewerten'),
					t('rating.rate_app_message', 'Möchtest du Memoro im App Store bewerten?'),
					[
						{
							text: t('common.cancel', 'Abbrechen'),
							style: 'cancel',
						},
						{
							text: t('rating.open_store', 'Zum Store'),
							onPress: () => {
								const storeUrl = ratingService.getStoreUrl();
								if (storeUrl) {
									Linking.openURL(storeUrl);
								}
							},
						},
					]
				);
			}
		} catch (error) {
			console.error('Error requesting rating:', error);
			showNotification({
				title: t('common.error', 'Fehler'),
				body: t('rating.error_message', 'Bewertung konnte nicht angefordert werden.'),
				channelType: NotificationChannel.FUNCTIONAL,
			});
		} finally {
			setIsRequesting(false);
		}
	}, [isRequesting, t, showNotification]);

	return {
		requestRating,
		isRequesting,
	};
};
