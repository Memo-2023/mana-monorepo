/**
 * Upload Status Badge Component
 *
 * Displays visual indicator for audio recording upload status.
 * Shows icon, label, and appropriate theming for each status state.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from './Icon';
import Text from './Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import { UploadStatus } from '~/features/storage/uploadStatus.types';

interface UploadStatusBadgeProps {
	/** Current upload status */
	status: UploadStatus;

	/** Badge size variant */
	size?: 'small' | 'medium' | 'large';

	/** Whether to show text label */
	showLabel?: boolean;

	/** Number of upload attempts (shown for failed uploads) */
	attemptCount?: number;

	/** Custom style for container */
	style?: any;
}

interface StatusConfig {
	icon: string;
	color: string;
	backgroundColor: string;
	labelKey: string;
	label?: string; // fallback if translation missing
}

/**
 * Upload Status Badge
 *
 * Visual indicator showing the current upload status of an audio recording.
 * Supports multiple sizes and optional text labels.
 *
 * @example
 * ```tsx
 * <UploadStatusBadge status={UploadStatus.SUCCESS} />
 * <UploadStatusBadge
 *   status={UploadStatus.FAILED}
 *   attemptCount={3}
 *   size="large"
 *   showLabel
 * />
 * ```
 */
export const UploadStatusBadge: React.FC<UploadStatusBadgeProps> = ({
	status,
	size = 'medium',
	showLabel = true,
	attemptCount = 0,
	style,
}) => {
	const { t } = useTranslation();
	const { isDark } = useTheme();

	// Get status-specific configuration
	const getStatusConfig = (): StatusConfig => {
		switch (status) {
			case UploadStatus.SUCCESS:
				return {
					icon: 'checkmark-circle',
					color: '#10b981', // green-500
					backgroundColor: isDark ? 'rgba(6, 78, 59, 0.2)' : 'rgba(209, 250, 229, 0.5)', // green-900/900 : green-100
					labelKey: 'audio_archive.status.uploaded',
					label: 'Uploaded',
				};

			case UploadStatus.PENDING:
				return {
					icon: 'time-outline',
					color: '#f59e0b', // amber-500
					backgroundColor: isDark ? 'rgba(120, 53, 15, 0.2)' : 'rgba(254, 243, 199, 0.5)', // amber-900 : amber-100
					labelKey: 'audio_archive.status.pending',
					label: 'Pending',
				};

			case UploadStatus.UPLOADING:
				return {
					icon: 'cloud-upload',
					color: '#3b82f6', // blue-500
					backgroundColor: isDark ? 'rgba(30, 58, 138, 0.2)' : 'rgba(219, 234, 254, 0.5)', // blue-900 : blue-100
					labelKey: 'audio_archive.status.uploading',
					label: 'Uploading...',
				};

			case UploadStatus.FAILED:
				return {
					icon: 'alert-circle',
					color: '#ef4444', // red-500
					backgroundColor: isDark ? 'rgba(127, 29, 29, 0.2)' : 'rgba(254, 226, 226, 0.5)', // red-900 : red-100
					labelKey: 'audio_archive.status.failed',
					label: attemptCount > 0 ? `Failed (${attemptCount} attempts)` : 'Failed',
				};

			case UploadStatus.NOT_UPLOADED:
			default:
				return {
					icon: 'cloud-outline',
					color: isDark ? '#9ca3af' : '#6b7280', // gray-400 : gray-500
					backgroundColor: isDark ? 'rgba(55, 65, 81, 0.2)' : 'rgba(243, 244, 246, 0.5)', // gray-700 : gray-100
					labelKey: 'audio_archive.status.not_uploaded',
					label: 'Not uploaded',
				};
		}
	};

	const config = getStatusConfig();

	// Calculate icon size based on badge size
	const iconSize = size === 'small' ? 14 : size === 'large' ? 24 : 18;

	// Get translated label with fallback
	const label = t(config.labelKey, config.label);

	// Show attempt count for failed uploads
	const displayLabel =
		status === UploadStatus.FAILED && attemptCount > 0 ? `${label} (${attemptCount})` : label;

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: config.backgroundColor,
					paddingHorizontal: size === 'small' ? 6 : size === 'large' ? 12 : 8,
					paddingVertical: size === 'small' ? 2 : size === 'large' ? 6 : 4,
				},
				style,
			]}
		>
			<Icon name={config.icon} size={iconSize} color={config.color} />

			{showLabel && (
				<Text
					style={[
						styles.label,
						{
							color: config.color,
							fontSize: size === 'small' ? 11 : size === 'large' ? 14 : 12,
						},
					]}
				>
					{displayLabel}
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		gap: 6,
		alignSelf: 'flex-start', // Don't stretch to full width
	},
	label: {
		fontWeight: '600',
	},
});

export default UploadStatusBadge;
