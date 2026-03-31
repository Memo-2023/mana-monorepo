import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

class RatingService {
	/**
	 * Check if the platform supports in-app reviews
	 */
	async isAvailable(): Promise<boolean> {
		try {
			return await StoreReview.isAvailableAsync();
		} catch (error) {
			console.error('Error checking store review availability:', error);
			return false;
		}
	}

	/**
	 * Request a review from the user
	 * This will show the native review dialog if available
	 */
	async requestReview(): Promise<boolean> {
		try {
			const isAvailable = await this.isAvailable();

			if (!isAvailable) {
				console.log('Store review is not available on this device');
				return false;
			}

			// Request the review
			await StoreReview.requestReview();

			// We can't know if the user actually submitted a review,
			// but we can track that we showed the prompt
			return true;
		} catch (error) {
			console.error('Error requesting store review:', error);
			return false;
		}
	}

	/**
	 * Get the store URL for manual reviews (fallback)
	 * This can be used when in-app review is not available
	 */
	getStoreUrl(): string | null {
		if (Platform.OS === 'ios') {
			// Memoro App Store ID
			const appStoreId = '6451258411';
			return `https://apps.apple.com/app/id${appStoreId}?action=write-review`;
		} else if (Platform.OS === 'android') {
			// Memoro Android package name
			const packageName = 'com.memo.beta';
			return `https://play.google.com/store/apps/details?id=${packageName}`;
		}
		return null;
	}
}

export const ratingService = new RatingService();
