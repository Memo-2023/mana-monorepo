import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import BaseModal from '~/components/atoms/BaseModal';
import Icon from '~/components/atoms/Icon';
import { useTranslation } from 'react-i18next';
import type { OrphanedRecording } from '~/features/audioRecordingV2/types';

interface RecordingRecoveryModalProps {
	isVisible: boolean;
	onClose: () => void;
	orphanedRecording: OrphanedRecording | null;
	onRecover: () => void;
	onDiscard: () => void;
	isRecovering: boolean;
}

/**
 * Modal displayed when an interrupted/orphaned recording is detected.
 * Provides options to recover the recording or discard it.
 */
const RecordingRecoveryModal: React.FC<RecordingRecoveryModalProps> = ({
	isVisible,
	onClose,
	orphanedRecording,
	onRecover,
	onDiscard,
	isRecovering,
}) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();

	if (!orphanedRecording) {
		return null;
	}

	// Duration is extracted/estimated from the file
	const durationSeconds = Math.floor(orphanedRecording.fileDurationMs / 1000);
	const minutes = Math.floor(durationSeconds / 60);
	const seconds = durationSeconds % 60;
	const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

	// Format file size
	const fileSizeKB = Math.round(orphanedRecording.fileSize / 1024);
	const formattedSize =
		fileSizeKB >= 1024 ? `${(fileSizeKB / 1024).toFixed(1)} MB` : `${fileSizeKB} KB`;

	// Format date
	const recordingDate = new Date(orphanedRecording.startTime);
	const formattedDate = recordingDate.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});

	const renderFooter = () => (
		<View style={{ flexDirection: 'column', gap: 12 }}>
			<Button
				title={
					isRecovering
						? t('recording.recovery.recovering', 'Recovering...')
						: t('recording.recovery.recover', 'Recover')
				}
				onPress={onRecover}
				variant="primary"
				iconName={isRecovering ? undefined : 'checkmark-circle-outline'}
				disabled={isRecovering}
			/>
			<Button
				title={t('recording.recovery.discard', 'Discard')}
				onPress={onDiscard}
				variant="secondary"
				iconName="trash-outline"
				disabled={isRecovering}
			/>
		</View>
	);

	return (
		<BaseModal
			isVisible={isVisible}
			onClose={onClose}
			title={t('recording.recovery.title', 'Recording Found')}
			animationType="fade"
			closeOnOverlayPress={!isRecovering}
			footerContent={renderFooter()}
		>
			<View style={{ alignItems: 'center', paddingVertical: 16 }}>
				{/* Recording Icon */}
				<View style={{ marginBottom: 16 }}>
					{isRecovering ? (
						<ActivityIndicator size="large" color={isDark ? '#FFD700' : '#F59E0B'} />
					) : (
						<Icon name="alert-circle-outline" size={64} color={isDark ? '#FFD700' : '#F59E0B'} />
					)}
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
					{t(
						'recording.recovery.message',
						'A previous recording was interrupted and may be recoverable.'
					)}
				</Text>

				{/* Recording details */}
				<View
					style={{
						backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
						borderRadius: 12,
						padding: 16,
						width: '100%',
						marginTop: 8,
					}}
				>
					{/* Duration */}
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
						<Icon name="time-outline" size={20} color={isDark ? '#AAAAAA' : '#666666'} />
						<Text
							style={{
								marginLeft: 8,
								fontSize: 14,
								color: isDark ? '#FFFFFF' : '#000000',
							}}
						>
							{t('recording.recovery.duration', 'Duration')}: {formattedDuration}
						</Text>
					</View>

					{/* File Size */}
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
						<Icon name="document-outline" size={20} color={isDark ? '#AAAAAA' : '#666666'} />
						<Text
							style={{
								marginLeft: 8,
								fontSize: 14,
								color: isDark ? '#FFFFFF' : '#000000',
							}}
						>
							{t('recording.recovery.size', 'Size')}: {formattedSize}
						</Text>
					</View>

					{/* Date */}
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<Icon name="calendar-outline" size={20} color={isDark ? '#AAAAAA' : '#666666'} />
						<Text
							style={{
								marginLeft: 8,
								fontSize: 14,
								color: isDark ? '#FFFFFF' : '#000000',
							}}
						>
							{t('recording.recovery.date', 'Date')}: {formattedDate}
						</Text>
					</View>
				</View>

				{/* Secondary message */}
				<Text
					style={{
						textAlign: 'center',
						fontSize: 13,
						opacity: 0.7,
						marginTop: 16,
						color: isDark ? '#FFFFFF' : '#000000',
					}}
				>
					{t(
						'recording.recovery.subtitle',
						'Would you like to recover this recording or discard it?'
					)}
				</Text>
			</View>
		</BaseModal>
	);
};

export default RecordingRecoveryModal;
