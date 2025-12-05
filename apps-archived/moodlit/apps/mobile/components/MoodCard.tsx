import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';

import type { Mood } from '@/store/store';

interface MoodCardProps {
	mood: Mood;
	onPress: () => void;
	onFavoritePress?: () => void;
	onLongPress?: () => void;
	isActive?: boolean;
}

export const MoodCard = ({
	mood,
	onPress,
	onFavoritePress,
	onLongPress,
	isActive,
}: MoodCardProps) => {
	// Check if mood has light colors (for text color adjustment)
	const isLightMood = mood.name === 'Licht';
	const textColor = isLightMood ? 'text-gray-900' : 'text-white';
	const badgeBg = isLightMood ? 'bg-gray-900/20' : 'bg-white/20';
	const badgeText = isLightMood ? 'text-gray-900/90' : 'text-white/90';

	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			className="mx-2 mb-6"
			disabled={isActive}
		>
			<View
				className="overflow-hidden rounded-3xl shadow-lg"
				style={[styles.card, isActive && styles.activeCard]}
			>
				<LinearGradient
					colors={mood.colors}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.gradient}
				>
					{/* Mood Info */}
					<View className="absolute bottom-4 left-5 right-5">
						<Text className={`${textColor} mb-1 text-3xl font-bold tracking-tight`}>
							{mood.name}
						</Text>
						{mood.isCustom && (
							<View className={`${badgeBg} mt-1 self-start rounded-full px-3 py-1`}>
								<Text className={`${badgeText} text-xs font-medium`}>Benutzerdefiniert</Text>
							</View>
						)}
					</View>
				</LinearGradient>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	card: {
		aspectRatio: 16 / 9,
	},
	gradient: {
		width: '100%',
		height: '100%',
	},
	activeCard: {
		opacity: 0.8,
		transform: [{ scale: 1.05 }],
	},
});
