import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Text from '~/components/atoms/Text';
import BaseModal from '~/components/atoms/BaseModal';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import MemoroLogo from '~/components/atoms/MemoroLogo';

interface OnboardingModalProps {
	visible: boolean;
	onClose: () => void;
}

/**
 * Onboarding modal shown to first-time users
 */
const OnboardingModal = ({ visible, onClose }: OnboardingModalProps): React.ReactElement => {
	const { colors } = useTheme();
	const { t } = useTranslation();

	const features = [
		{
			id: 'recording',
			titleKey: 'onboarding.modal.features.recording.title',
			descriptionKey: 'onboarding.modal.features.recording.description',
			icon: 'mic-outline',
			iconColor: '#FF6B6B',
		},
		{
			id: 'summarizing',
			titleKey: 'onboarding.modal.features.summarizing.title',
			descriptionKey: 'onboarding.modal.features.summarizing.description',
			icon: 'document-text-outline',
			iconColor: '#4ECDC4',
		},
		{
			id: 'combining',
			titleKey: 'onboarding.modal.features.combining.title',
			descriptionKey: 'onboarding.modal.features.combining.description',
			icon: 'git-merge-outline',
			iconColor: '#45B7D1',
		},
		{
			id: 'questioning',
			titleKey: 'onboarding.modal.features.questioning.title',
			descriptionKey: 'onboarding.modal.features.questioning.description',
			icon: 'help-circle-outline',
			iconColor: '#96CEB4',
		},
		{
			id: 'organizing',
			titleKey: 'onboarding.modal.features.organizing.title',
			descriptionKey: 'onboarding.modal.features.organizing.description',
			icon: 'pricetag-outline',
			iconColor: '#FFEAA7',
		},
		{
			id: 'sharing',
			titleKey: 'onboarding.modal.features.sharing.title',
			descriptionKey: 'onboarding.modal.features.sharing.description',
			icon: 'share-outline',
			iconColor: '#DDA0DD',
		},
		{
			id: 'web_access',
			titleKey: 'onboarding.modal.features.web_access.title',
			descriptionKey: 'onboarding.modal.features.web_access.description',
			icon: 'globe-outline',
			iconColor: '#74B9FF',
		},
	];

	return (
		<BaseModal
			isVisible={visible}
			onClose={onClose}
			title={t('onboarding.modal.welcome_title', 'Welcome to Memoro')}
			animationType="fade"
			size="large"
			primaryButtonText={t('onboarding.modal.continue', 'Continue')}
			onPrimaryButtonPress={onClose}
			scrollable={true}
		>
			<View style={styles.contentContainer}>
				<View style={styles.headerContainer}>
					<MemoroLogo size={64} style={styles.logo} />
				</View>

				<View style={styles.featuresContainer}>
					{features.map((feature) => (
						<View
							key={feature.id}
							style={[
								styles.featureCard,
								{ backgroundColor: colors.contentBackgroundHover, borderColor: colors.border },
							]}
						>
							<View style={styles.featureItem}>
								<View style={[styles.iconContainer, { backgroundColor: feature.iconColor + '20' }]}>
									<Icon name={feature.icon} size={24} color={feature.iconColor} />
								</View>
								<View style={styles.featureTextContainer}>
									<Text style={[styles.featureTitle, { color: colors.text }]}>
										{t(feature.titleKey)}
									</Text>
									<Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
										{t(feature.descriptionKey)}
									</Text>
								</View>
							</View>
						</View>
					))}
				</View>
			</View>
		</BaseModal>
	);
};

const styles = StyleSheet.create({
	contentContainer: {
		width: '100%',
	},
	headerContainer: {
		alignItems: 'center',
		marginBottom: 20,
	},
	logo: {
		marginBottom: 0,
	},
	featuresContainer: {
		gap: 16,
	},
	featureCard: {
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.1)',
	},
	featureItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	featureTextContainer: {
		flex: 1,
	},
	featureTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 8,
	},
	featureDescription: {
		fontSize: 16,
		lineHeight: 22,
	},
});

export default OnboardingModal;
