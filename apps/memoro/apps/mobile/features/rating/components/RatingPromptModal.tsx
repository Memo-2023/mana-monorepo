import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import BaseModal from '~/components/atoms/BaseModal';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useRatingStore } from '../store/ratingStore';
import { useRating } from '../hooks/useRating';
import { useAnalytics } from '~/features/analytics';

interface RatingPromptModalProps {
	isVisible: boolean;
	onClose: () => void;
}

/**
 * Modal that prompts users to rate the app after reaching certain milestones
 */
export const RatingPromptModal: React.FC<RatingPromptModalProps> = ({ isVisible, onClose }) => {
	const { t } = useTranslation();
	const { isDark } = useTheme();
	const { track } = useAnalytics();
	const { requestRating } = useRating();
	const { markRated, markDeclined, markNeverAsk, memoCreatedCount } = useRatingStore();

	/**
	 * Handle "Rate Now" button press
	 */
	const handleRateNow = useCallback(async () => {
		track('rating_accepted', {
			memo_count: memoCreatedCount,
			source: 'automatic_prompt',
		});

		// Request the rating
		const success = await requestRating();

		if (success) {
			markRated();
		}

		onClose();
	}, [requestRating, markRated, onClose, track, memoCreatedCount]);

	/**
	 * Handle "Maybe Later" button press
	 */
	const handleMaybeLater = useCallback(() => {
		track('rating_declined', {
			memo_count: memoCreatedCount,
			action: 'maybe_later',
		});

		markDeclined();
		onClose();
	}, [markDeclined, onClose, track, memoCreatedCount]);

	/**
	 * Handle "Don't Ask Again" button press
	 */
	const handleNeverAsk = useCallback(() => {
		track('rating_never_ask', {
			memo_count: memoCreatedCount,
			action: 'never_ask',
		});

		markNeverAsk();
		onClose();
	}, [markNeverAsk, onClose, track, memoCreatedCount]);

	const styles = StyleSheet.create({
		content: {
			paddingVertical: 8,
		},
		message: {
			fontSize: 16,
			lineHeight: 24,
			color: isDark ? '#CCCCCC' : '#666666',
			marginBottom: 24,
		},
		highlight: {
			fontSize: 16,
			lineHeight: 24,
			fontWeight: '600',
			color: isDark ? '#FFFFFF' : '#000000',
			marginBottom: 16,
		},
		buttonContainer: {
			gap: 12,
		},
		secondaryButton: {
			marginTop: 8,
		},
		neverAskButton: {
			marginTop: 16,
		},
	});

	return (
		<BaseModal
			isVisible={isVisible}
			onClose={onClose}
			title={t('rating.prompt_title', 'Gefällt dir Memoro?')}
			size="small"
			animationType="fade"
			closeOnOverlayPress={false}
			showCloseButton={false}
			hideFooter={true}
			scrollable={false}
		>
			<View style={styles.content}>
				<Text style={styles.highlight}>
					{t('rating.prompt_milestone', 'Du hast bereits {{count}} Memos erstellt! 🎉', {
						count: memoCreatedCount,
					})}
				</Text>

				<Text style={styles.message}>
					{t(
						'rating.prompt_message',
						'Es würde uns sehr freuen, wenn du Memoro im App Store bewerten würdest. Deine Unterstützung hilft uns, die App weiter zu verbessern.'
					)}
				</Text>

				<View style={styles.buttonContainer}>
					{/* Primary Action: Rate Now */}
					<Button
						title={t('rating.rate_now', 'Jetzt bewerten')}
						onPress={handleRateNow}
						variant="primary"
					/>

					{/* Secondary Action: Maybe Later */}
					<Button
						title={t('rating.maybe_later', 'Vielleicht später')}
						onPress={handleMaybeLater}
						variant="secondary"
						style={styles.secondaryButton}
					/>

					{/* Tertiary Action: Never Ask */}
					<Button
						title={t('rating.never_ask', 'Nicht mehr fragen')}
						onPress={handleNeverAsk}
						variant="text"
						style={styles.neverAskButton}
					/>
				</View>
			</View>
		</BaseModal>
	);
};
