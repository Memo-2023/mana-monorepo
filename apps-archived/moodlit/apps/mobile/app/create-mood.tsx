import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';

import { Icon } from '@/components/Icon';
import { useResponsive } from '@/hooks/useResponsive';
import type { AnimationType } from '@/store/store';
import { useStore } from '@/store/store';
import { getThemeColors } from '@/utils/theme';

const PRESET_COLORS = [
	['#FF6B6B', '#FFE66D'],
	['#4ECDC4', '#44A08D'],
	['#6B8DD6', '#8E37D7'],
	['#F857A6', '#FF5858'],
	['#2E3192', '#1BFFFF'],
	['#FFD89B', '#19547B'],
	['#00F260', '#0575E6'],
	['#FA8BFF', '#2BD2FF'],
	['#FEB692', '#EA5455'],
	['#A8EDEA', '#FED6E3'],
];

const ANIMATION_TYPES: { label: string; value: AnimationType }[] = [
	{ label: 'Gradient', value: 'gradient' },
	{ label: 'Pulsieren', value: 'pulse' },
	{ label: 'Wellen', value: 'wave' },
];

export default function CreateMood() {
	const router = useRouter();
	const addCustomMood = useStore((state) => state.addCustomMood);
	const settings = useStore((state) => state.settings);

	const [name, setName] = useState('');
	const [colors, setColors] = useState<string[]>(PRESET_COLORS[0]);
	const [animationType, setAnimationType] = useState<AnimationType>('gradient');

	const theme = getThemeColors();
	const responsive = useResponsive();

	const handleHaptic = () => {
		if (settings.hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	};

	const handleCreate = () => {
		if (!name.trim()) {
			Alert.alert('Fehler', 'Bitte gib einen Namen ein');
			return;
		}

		handleHaptic();
		addCustomMood({
			name: name.trim(),
			colors,
			animationType,
		});

		Alert.alert('Erfolg', 'Mood wurde erstellt!', [
			{
				text: 'OK',
				onPress: () => router.back(),
			},
		]);
	};

	return (
		<View className={`flex-1 ${theme.bg}`}>
			<Stack.Screen
				options={{
					title: 'Mood erstellen',
					headerBackTitle: 'Zurück',
				}}
			/>
			<ScrollView className="flex-1" contentContainerClassName="items-center pb-8 pt-4">
				<View style={{ width: '100%', maxWidth: responsive.maxContentWidth }} className="px-4">
					{/* Preview */}
					<View className="mb-6 overflow-hidden rounded-3xl" style={styles.previewCard}>
						<LinearGradient
							colors={colors}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.previewGradient}
						>
							<View className="absolute left-5 right-5 top-5">
								<Text className="text-3xl font-bold text-white">{name || 'Vorschau'}</Text>
							</View>
						</LinearGradient>
					</View>

					{/* Name Input */}
					<View className={`${theme.cardBg} mb-4 rounded-2xl p-4`}>
						<Text className={`mb-2 text-lg font-semibold ${theme.text}`}>Name</Text>
						<TextInput
							value={name}
							onChangeText={setName}
							placeholder="z.B. Meditation"
							className={`p-3 text-base ${theme.input} rounded-lg ${theme.text}`}
							placeholderTextColor="#9CA3AF"
							maxLength={30}
						/>
					</View>

					{/* Color Selection */}
					<View className={`${theme.cardBg} mb-4 rounded-2xl p-4`}>
						<Text className={`mb-3 text-lg font-semibold ${theme.text}`}>Farben</Text>
						<View className="flex-row flex-wrap gap-3">
							{PRESET_COLORS.map((colorPair, index) => (
								<Pressable
									key={index}
									onPress={() => {
										handleHaptic();
										setColors(colorPair);
									}}
									style={[styles.colorBox, colors === colorPair && styles.selectedColorBox]}
								>
									<LinearGradient
										colors={colorPair}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
										style={styles.gradient}
									/>
								</Pressable>
							))}
						</View>
					</View>

					{/* Animation Type */}
					<View className={`${theme.cardBg} mb-6 rounded-2xl p-4`}>
						<Text className={`mb-3 text-lg font-semibold ${theme.text}`}>Animation</Text>
						<View className="flex-row flex-wrap gap-2">
							{ANIMATION_TYPES.map((type) => (
								<Pressable
									key={type.value}
									onPress={() => {
										handleHaptic();
										setAnimationType(type.value);
									}}
									className={`rounded-full px-4 py-2 ${
										animationType === type.value ? 'bg-blue-500' : 'bg-gray-200'
									}`}
								>
									<Text
										className={`font-medium ${
											animationType === type.value ? 'text-white' : 'text-gray-700'
										}`}
									>
										{type.label}
									</Text>
								</Pressable>
							))}
						</View>
					</View>

					{/* Create Button */}
					<Pressable onPress={handleCreate} className="items-center rounded-2xl bg-blue-500 p-4">
						<Text className="text-lg font-semibold text-white">Mood erstellen</Text>
					</Pressable>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	previewCard: {
		aspectRatio: 16 / 9,
		width: '100%',
	},
	previewGradient: {
		width: '100%',
		height: '100%',
	},
	colorBox: {
		width: '30%',
		aspectRatio: 1,
		borderRadius: 16,
		overflow: 'hidden',
	},
	selectedColorBox: {
		borderWidth: 4,
		borderColor: '#3B82F6',
	},
	gradient: {
		width: '100%',
		height: '100%',
	},
});
