import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';

import { Icon } from './Icon';

import type { Mood, MoodSequence } from '@/store/store';

interface SequenceCardProps {
	sequence: MoodSequence;
	moods: Mood[];
	onPress: () => void;
	onLongPress?: () => void;
	isActive?: boolean;
}

export const SequenceCard = ({
	sequence,
	moods,
	onPress,
	onLongPress,
	isActive,
}: SequenceCardProps) => {
	// Hole die Farben der ersten 3 Moods in der Sequenz
	const getGradientColors = () => {
		const colors: string[] = [];
		sequence.items.slice(0, 3).forEach((item) => {
			const mood = moods.find((m) => m.id === item.moodId);
			if (mood && mood.colors.length > 0) {
				colors.push(mood.colors[0]);
			}
		});
		// Falls weniger als 2 Farben, fülle mit Schwarz auf
		while (colors.length < 2) {
			colors.push('#000000');
		}
		return colors;
	};

	const getTotalDuration = () => {
		const totalSeconds = sequence.items.reduce((sum, item) => sum + item.duration, 0);
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		if (mins === 0) {
			return `${secs} Sek`;
		} else if (secs === 0) {
			return `${mins} Min`;
		} else {
			return `${mins} Min ${secs} Sek`;
		}
	};

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
					colors={getGradientColors()}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.gradient}
				>
					{/* Play Icon Overlay */}
					<View className="absolute right-4 top-4 rounded-full bg-black/30 p-2">
						<Icon name="play-circle" size={24} color="#fff" weight="fill" />
					</View>

					{/* Sequence Info */}
					<View className="absolute bottom-4 left-5 right-5">
						<Text className="mb-1 text-3xl font-bold tracking-tight text-white">
							{sequence.name}
						</Text>
						<View className="mt-1 self-start rounded-full bg-white/20 px-3 py-1">
							<Text className="text-xs font-medium text-white/90">
								{sequence.items.length} Moods · {getTotalDuration()}
							</Text>
						</View>
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
