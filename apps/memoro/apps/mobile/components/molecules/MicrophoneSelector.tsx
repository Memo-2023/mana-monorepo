import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import BaseModal from '~/components/atoms/BaseModal';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import type { RecordingInput } from '~/features/audioRecordingV2/types';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';

interface MicrophoneSelectorProps {
	isVisible: boolean;
	onClose: () => void;
	inputs: RecordingInput[];
	selectedInputUid: string | null;
	onSelectInput: (uid: string | null, name: string | null) => void;
}

function getInputIcon(type: string): string {
	const t = type.toLowerCase();
	if (t.includes('bluetooth')) return 'bluetooth-outline';
	if (t.includes('headset') || t.includes('headphone') || t.includes('wired'))
		return 'headset-outline';
	if (t.includes('usb')) return 'hardware-chip-outline';
	return 'mic-outline';
}

const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({
	isVisible,
	onClose,
	inputs,
	selectedInputUid,
	onSelectInput,
}) => {
	const { t } = useTranslation();
	const { isDark, themeVariant } = useTheme();
	const refreshAvailableInputs = useRecordingStore((s) => s.refreshAvailableInputs);
	const [isLoading, setIsLoading] = React.useState(false);

	// Refresh available inputs (including Bluetooth) when modal opens
	useEffect(() => {
		if (isVisible) {
			setIsLoading(true);
			refreshAvailableInputs().finally(() => setIsLoading(false));
		}
	}, [isVisible]);

	const themeColors = (colors as any).theme?.extend?.colors;
	const currentColors = isDark ? themeColors?.dark?.[themeVariant] : themeColors?.[themeVariant];
	const textColor = currentColors?.text ?? '#333';
	const secondaryTextColor = currentColors?.secondaryText ?? '#888';
	const selectedBg = currentColors?.primary ? `${currentColors.primary}20` : '#e0e0e0';
	const primaryColor = currentColors?.primary ?? '#007AFF';

	const handleSelect = (uid: string | null, name: string | null) => {
		onSelectInput(uid, name);
		onClose();
	};

	return (
		<BaseModal
			isVisible={isVisible}
			onClose={onClose}
			title={t('recording.select_microphone', 'Select Microphone')}
			animationType="fade"
			closeOnOverlayPress={true}
			hideFooter={true}
			size="medium"
		>
			<View style={styles.container}>
				{/* System Default option */}
				<TouchableOpacity
					style={[styles.inputItem, selectedInputUid === null && { backgroundColor: selectedBg }]}
					onPress={() => handleSelect(null, null)}
					activeOpacity={0.7}
				>
					<Icon name="phone-portrait-outline" size={22} color={textColor} />
					<View style={styles.inputInfo}>
						<Text variant="body" style={[styles.inputName, { color: textColor }]}>
							{t('recording.system_default', 'System Default')}
						</Text>
					</View>
					{selectedInputUid === null && (
						<Icon name="checkmark-circle" size={22} color={primaryColor} />
					)}
				</TouchableOpacity>

				{/* Available inputs */}
				{inputs.map((input) => (
					<TouchableOpacity
						key={input.uid}
						style={[
							styles.inputItem,
							selectedInputUid === input.uid && { backgroundColor: selectedBg },
						]}
						onPress={() => handleSelect(input.uid, input.name)}
						activeOpacity={0.7}
					>
						<Icon name={getInputIcon(input.type)} size={22} color={textColor} />
						<View style={styles.inputInfo}>
							<Text variant="body" style={[styles.inputName, { color: textColor }]}>
								{input.name}
							</Text>
							<Text variant="caption" style={[styles.inputType, { color: secondaryTextColor }]}>
								{input.type}
							</Text>
						</View>
						{selectedInputUid === input.uid && (
							<Icon name="checkmark-circle" size={22} color={primaryColor} />
						)}
					</TouchableOpacity>
				))}

				{isLoading && inputs.length === 0 && (
					<View style={styles.emptyState}>
						<ActivityIndicator size="small" color={primaryColor} />
					</View>
				)}

				{!isLoading && inputs.length === 0 && (
					<View style={styles.emptyState}>
						<Text variant="body" style={{ color: secondaryTextColor, textAlign: 'center' }}>
							{t('recording.microphone_unavailable', 'No additional microphones detected.')}
						</Text>
					</View>
				)}
			</View>
		</BaseModal>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	inputItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		paddingHorizontal: 12,
		borderRadius: 10,
		marginBottom: 4,
		gap: 12,
	},
	inputInfo: {
		flex: 1,
	},
	inputName: {
		fontSize: 16,
	},
	inputType: {
		fontSize: 12,
		marginTop: 2,
	},
	emptyState: {
		paddingVertical: 24,
		paddingHorizontal: 16,
	},
});

export default MicrophoneSelector;
