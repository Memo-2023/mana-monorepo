import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '~/utils/theme/theme';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveIndicatorProps {
	status: SaveStatus;
	lastSaved?: Date | null;
	error?: string | null;
	className?: string;
}

/**
 * Konsistente Save-Status-Anzeige für den Dokumenten-Editor
 */
export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
	status,
	lastSaved,
	error,
	className,
}) => {
	const { isDark } = useTheme();

	const getStatusConfig = () => {
		switch (status) {
			case 'saving':
				return {
					text: 'Speichert...',
					color: isDark ? '#60a5fa' : '#3b82f6',
					icon: null,
					showSpinner: true,
				};
			case 'saved':
				return {
					text: 'Gespeichert',
					color: isDark ? '#34d399' : '#10b981',
					icon: 'checkmark-circle' as const,
					showSpinner: false,
				};
			case 'error':
				return {
					text: error || 'Fehler beim Speichern',
					color: isDark ? '#f87171' : '#ef4444',
					icon: 'alert-circle' as const,
					showSpinner: false,
				};
			default:
				return {
					text: 'Ungespeichert',
					color: isDark ? '#9ca3af' : '#6b7280',
					icon: null,
					showSpinner: false,
				};
		}
	};

	const config = getStatusConfig();

	const formatLastSaved = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (seconds < 60) {
			return 'gerade eben';
		} else if (minutes < 60) {
			return `vor ${minutes} Min`;
		} else if (hours < 24) {
			return `vor ${hours} Std`;
		} else {
			return date.toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			});
		}
	};

	return (
		<View className={`flex-row items-center ${className}`}>
			{config.showSpinner && (
				<ActivityIndicator size="small" color={config.color} style={{ marginRight: 8 }} />
			)}

			{config.icon && (
				<Ionicons name={config.icon} size={16} color={config.color} style={{ marginRight: 8 }} />
			)}

			<Text
				style={{
					fontSize: 12,
					color: config.color,
					fontWeight: status === 'error' ? '600' : '400',
				}}
			>
				{config.text}
			</Text>

			{status === 'saved' && lastSaved && (
				<Text
					style={{
						fontSize: 11,
						color: isDark ? '#9ca3af' : '#6b7280',
						marginLeft: 8,
					}}
				>
					{formatLastSaved(lastSaved)}
				</Text>
			)}
		</View>
	);
};
