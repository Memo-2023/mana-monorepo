import React from 'react';
import { View, Linking, Platform } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import BaseModal from '~/components/atoms/BaseModal';
import Icon from '~/components/atoms/Icon';
import { useTranslation } from 'react-i18next';

interface PermissionDeniedModalProps {
	isVisible: boolean;
	onClose: () => void;
	canAskAgain: boolean;
	onRetry?: () => void;
}

/**
 * Modal that is displayed when microphone permissions are denied.
 * Provides guidance to users on how to enable permissions manually in device settings.
 */
const PermissionDeniedModal: React.FC<PermissionDeniedModalProps> = ({
	isVisible,
	onClose,
	canAskAgain,
	onRetry,
}) => {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();

	const handleOpenSettings = async () => {
		try {
			if (Platform.OS === 'ios') {
				await Linking.openURL('app-settings:');
			} else {
				await Linking.openSettings();
			}
		} catch (error) {
			console.debug('Error opening settings:', error);
			// Fallback: try to open general settings
			try {
				await Linking.openSettings();
			} catch (fallbackError) {
				console.debug('Error opening fallback settings:', fallbackError);
			}
		}
		onClose();
	};

	const handleRetry = () => {
		onClose();
		// Call the retry callback if provided
		onRetry?.();
	};

	const renderFooter = () => (
		<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
			<Button
				title={t('common.cancel', 'Abbrechen')}
				onPress={onClose}
				variant="secondary"
				style={{ flex: 1, marginRight: 8 }}
			/>
			{canAskAgain ? (
				<Button
					title={t('permissions.retry', 'Erneut versuchen')}
					onPress={handleRetry}
					variant="primary"
					iconName="refresh-outline"
					style={{ flex: 1 }}
				/>
			) : (
				<Button
					title={t('permissions.open_settings', 'Zu Einstellungen')}
					onPress={handleOpenSettings}
					variant="primary"
					iconName="settings-outline"
					style={{ flex: 1 }}
				/>
			)}
		</View>
	);

	return (
		<BaseModal
			isVisible={isVisible}
			onClose={onClose}
			title={t('permissions.microphone_denied_title', 'Mikrofonberechtigung erforderlich')}
			animationType="fade"
			closeOnOverlayPress={true}
			footerContent={renderFooter()}
		>
			<View style={{ alignItems: 'center', paddingVertical: 16 }}>
				{/* Microphone Icon */}
				<View style={{ marginBottom: 16 }}>
					<Icon name="mic-off-outline" size={64} color={isDark ? '#FF6B6B' : '#EF4444'} />
				</View>

				{/* Main message */}
				<Text
					style={{
						textAlign: 'center',
						fontSize: 16,
						marginBottom: 12,
						color: isDark ? '#FFFFFF' : '#000000',
					}}
				>
					{canAskAgain
						? t(
								'permissions.microphone_denied_message',
								'Mikrofonzugriff ist erforderlich, um Audioaufnahmen zu erstellen.'
							)
						: t(
								'permissions.microphone_permanently_denied_message',
								'Mikrofonzugriff wurde dauerhaft verweigert.'
							)}
				</Text>

				{/* Secondary message */}
				<Text
					style={{
						textAlign: 'center',
						fontSize: 14,
						opacity: 0.7,
						color: isDark ? '#FFFFFF' : '#000000',
					}}
				>
					{canAskAgain
						? t(
								'permissions.microphone_denied_subtitle',
								'Bitte gewähren Sie die Berechtigung, um fortzufahren.'
							)
						: t(
								'permissions.microphone_permanently_denied_subtitle',
								'Bitte aktivieren Sie die Mikrofonberechtigung in den Einstellungen Ihres Geräts unter "Memoro" > "Berechtigungen".'
							)}
				</Text>
			</View>
		</BaseModal>
	);
};

export default PermissionDeniedModal;
