/**
 * Shared Hook for Share and Copy functionality
 * Eliminates code duplication across components
 */

import { Share, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { EnhancedQuote, Author } from '@quote/shared';

export function useShare() {
	const { t } = useTranslation();

	/**
	 * Share a quote
	 */
	const shareQuote = async (quote: EnhancedQuote) => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

			const quoteText = `"${quote.text}"\n\n— ${quote.author?.name || t('quotes.unknown')}`;

			const result = await Share.share({
				message: quoteText,
				title: t('quotes.shareTitle'),
			});

			if (result.action === Share.sharedAction) {
				await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			}
		} catch (error) {
			Alert.alert(t('quotes.shareError'), t('quotes.shareErrorMessage'));
		}
	};

	/**
	 * Share an author
	 */
	const shareAuthor = async (author: Author) => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

			const authorInfo = `${author.name}${author.lifeYears ? ` (${author.lifeYears})` : ''}\n${author.profession?.join(', ') || ''}\n\n${author.biography?.short || author.biography?.long || ''}`;

			const result = await Share.share({
				message: authorInfo,
				title: author.name,
			});

			if (result.action === Share.sharedAction) {
				await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			}
		} catch (error) {
			Alert.alert(t('common.shareError'), t('common.shareErrorMessage'));
		}
	};

	/**
	 * Copy quote to clipboard
	 */
	const copyQuoteToClipboard = async (quote: EnhancedQuote) => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

			const quoteText = `"${quote.text}"\n\n— ${quote.author?.name || t('quotes.unknown')}`;
			await Clipboard.setStringAsync(quoteText);

			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

			if (Platform.OS === 'ios') {
				Alert.alert(t('quotes.copied'), '', [{ text: 'OK' }], {
					userInterfaceStyle: 'dark',
				});
			}
		} catch (error) {
			Alert.alert(t('quotes.copyError'), t('quotes.copyErrorMessage'));
		}
	};

	/**
	 * Copy author info to clipboard
	 */
	const copyAuthorToClipboard = async (author: Author) => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

			const authorInfo = `${author.name}${author.lifeYears ? ` (${author.lifeYears})` : ''}\n${author.profession?.join(', ') || ''}`;
			await Clipboard.setStringAsync(authorInfo);

			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

			if (Platform.OS === 'ios') {
				Alert.alert(t('common.copied'), '', [{ text: 'OK' }], {
					userInterfaceStyle: 'dark',
				});
			}
		} catch (error) {
			Alert.alert(t('common.copyError'), t('common.copyErrorMessage'));
		}
	};

	/**
	 * Generic copy to clipboard
	 */
	const copyToClipboard = async (text: string, successMessage?: string) => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			await Clipboard.setStringAsync(text);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

			if (Platform.OS === 'ios') {
				Alert.alert(successMessage || t('common.copied'), '', [{ text: 'OK' }], {
					userInterfaceStyle: 'dark',
				});
			}
		} catch (error) {
			Alert.alert(t('common.copyError'), t('common.copyErrorMessage'));
		}
	};

	return {
		shareQuote,
		shareAuthor,
		copyQuoteToClipboard,
		copyAuthorToClipboard,
		copyToClipboard,
	};
}
