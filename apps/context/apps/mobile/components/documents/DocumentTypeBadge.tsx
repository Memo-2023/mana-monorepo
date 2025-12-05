import React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/Text';
import { useTheme } from '~/utils/theme/theme';

interface DocumentTypeBadgeProps {
	type: 'original' | 'generated' | 'context' | 'prompt';
	size?: 'small' | 'medium';
}

export const DocumentTypeBadge: React.FC<DocumentTypeBadgeProps> = ({ type, size = 'medium' }) => {
	const { isDark } = useTheme();

	// Bestimme die Farben basierend auf dem Dokumenttyp
	const getTypeColor = () => {
		switch (type) {
			case 'original':
				return '#2563eb';
			case 'context':
				return '#16a34a';
			case 'prompt':
				return '#d97706';
			case 'generated':
				return '#0891b2';
			default:
				return '#6b7280';
		}
	};

	// Bestimme die Hintergrundfarbe mit Transparenz
	const getTypeBackgroundColor = () => {
		switch (type) {
			case 'original':
				return 'rgba(37, 99, 235, 0.1)';
			case 'context':
				return 'rgba(22, 163, 74, 0.1)';
			case 'prompt':
				return 'rgba(217, 119, 6, 0.1)';
			case 'generated':
				return 'rgba(8, 145, 178, 0.1)';
			default:
				return 'rgba(107, 114, 128, 0.1)';
		}
	};

	// Bestimme das Label für den Dokumenttyp
	const getTypeLabel = () => {
		switch (type) {
			case 'original':
				return 'Original';
			case 'context':
				return 'Kontext';
			case 'prompt':
				return 'Prompt';
			case 'generated':
				return 'Generiert';
			default:
				return 'Dokument';
		}
	};

	return (
		<View
			style={{
				paddingHorizontal: size === 'small' ? 5 : 7,
				paddingVertical: size === 'small' ? 1 : 2, // Deutlich flacher
				borderRadius: 3,
				backgroundColor: getTypeBackgroundColor(),
				alignSelf: 'flex-start',
				height: size === 'small' ? 16 : 20, // Feste Höhe für konsistente Darstellung
				justifyContent: 'center', // Zentriert den Text vertikal
			}}
		>
			<Text
				style={{
					fontSize: size === 'small' ? 9 : 11, // Kleinere Schrift
					fontWeight: '500',
					color: getTypeColor(),
					lineHeight: size === 'small' ? 14 : 16, // Angepasste Zeilenhöhe
				}}
			>
				{getTypeLabel()}
			</Text>
		</View>
	);
};
