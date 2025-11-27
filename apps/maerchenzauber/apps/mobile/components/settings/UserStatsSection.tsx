import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../atoms/Text';
import type { MostUsedCharacter } from '../../hooks/useCharacterStats';

interface UserStatsSectionProps {
	characterCount: number;
	storyCount: number;
	totalWords: number;
	mostUsedCharacter: MostUsedCharacter | null;
}

export default function UserStatsSection({
	characterCount,
	storyCount,
	totalWords,
	mostUsedCharacter,
}: UserStatsSectionProps) {
	// Format large numbers with K suffix
	const formatNumber = (num: number): string => {
		if (num >= 10000) {
			return `${Math.floor(num / 1000)}K`;
		}
		return num.toString();
	};

	return (
		<View style={styles.statsContainer}>
			<View style={styles.statsRow}>
				<View style={styles.statsBox}>
					<Text style={styles.statsValue}>{characterCount}</Text>
					<Text style={styles.statsLabel}>Charaktere</Text>
				</View>
				<View style={styles.statsBox}>
					<Text style={styles.statsValue}>{storyCount}</Text>
					<Text style={styles.statsLabel}>Geschichten</Text>
				</View>
			</View>

			<View style={styles.statsRow}>
				<View style={styles.statsBox}>
					<Text style={styles.statsValue}>{formatNumber(totalWords)}</Text>
					<Text style={styles.statsLabel}>Wörter</Text>
				</View>
				<View style={styles.statsBox}>
					{mostUsedCharacter ? (
						<>
							<Text style={styles.favoriteCharacterName} numberOfLines={1} ellipsizeMode="tail">
								{mostUsedCharacter.name}
							</Text>
							<Text style={styles.statsLabel}>
								Lieblingscharakter ({mostUsedCharacter.usageCount}x)
							</Text>
						</>
					) : (
						<>
							<Text style={styles.statsValue}>-</Text>
							<Text style={styles.statsLabel}>Lieblingscharakter</Text>
						</>
					)}
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	statsContainer: {
		marginBottom: 32,
		gap: 12,
	},
	statsRow: {
		flexDirection: 'row',
		gap: 12,
	},
	statsBox: {
		flex: 1,
		backgroundColor: '#2C2C2C',
		borderRadius: 12,
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 100,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	statsValue: {
		color: '#FFFFFF',
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	favoriteCharacterName: {
		color: '#FFFFFF',
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	statsLabel: {
		color: '#A0A0A0',
		fontSize: 12,
		fontWeight: '500',
		textAlign: 'center',
	},
});
