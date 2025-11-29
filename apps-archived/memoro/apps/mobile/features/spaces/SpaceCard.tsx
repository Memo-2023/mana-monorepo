import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';

// Interface für Space-Daten
export interface Space {
	id: string;
	name: string;
	description: string;
	memoCount: number;
	isDefault: boolean;
	color: string;
}

interface SpaceCardProps {
	space: Space;
	onPress: (id: string) => void;
}

/**
 * SpaceCard-Komponente zur Anzeige eines einzelnen Space
 */
const SpaceCard = ({ space, onPress }: SpaceCardProps) => {
	const { isDark } = useTheme();

	const styles = StyleSheet.create({
		card: {
			backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(245, 245, 245, 0.8)',
			borderRadius: 12,
			padding: 16,
			marginBottom: 16,
			borderLeftWidth: 4,
			borderLeftColor: space.color,
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 8,
		},
		title: {
			fontSize: 18,
			fontWeight: 'bold',
			color: isDark ? '#FFFFFF' : '#000000',
		},
		description: {
			fontSize: 14,
			color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
			marginBottom: 12,
		},
		footer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
		},
		stats: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		count: {
			fontSize: 14,
			color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
			marginLeft: 4,
		},
		badge: {
			backgroundColor: space.color,
			paddingHorizontal: 8,
			paddingVertical: 2,
			borderRadius: 4,
			marginLeft: 8,
		},
		badgeText: {
			color: '#FFFFFF',
			fontSize: 12,
			fontWeight: 'bold',
		},
	});

	return (
		<Pressable style={styles.card} onPress={() => onPress(space.id)}>
			<View style={styles.header}>
				<Text style={styles.title}>{space.name}</Text>
				{space.isDefault && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>Standard</Text>
					</View>
				)}
			</View>
			<Text style={styles.description}>{space.description}</Text>
			<View style={styles.footer}>
				<View style={styles.stats}>
					<Icon
						name="document-text-outline"
						size={16}
						color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'}
					/>
					<Text style={styles.count}>{space.memoCount} Memos</Text>
				</View>
			</View>
		</Pressable>
	);
};

export default SpaceCard;
