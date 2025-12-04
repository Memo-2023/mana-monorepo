import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { useResponsive } from '@/hooks/useResponsive';
import type { MoodSequenceItem } from '@/store/store';
import { useStore } from '@/store/store';
import { getThemeColors } from '@/utils/theme';

const TRANSITION_OPTIONS = [
	{ label: '2s', value: 2 },
	{ label: '5s', value: 5 },
	{ label: '10s', value: 10 },
];

export default function CreateSequence() {
	const router = useRouter();
	const moods = useStore((state) => state.moods);
	const settings = useStore((state) => state.settings);
	const addSequence = useStore((state) => state.addSequence);

	const [name, setName] = useState('');
	const [transitionDuration, setTransitionDuration] = useState(5);
	const [items, setItems] = useState<MoodSequenceItem[]>([]);
	const [showMoodPicker, setShowMoodPicker] = useState(false);

	const theme = getThemeColors();
	const responsive = useResponsive();

	const handleHaptic = () => {
		if (settings.hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	};

	const addMoodToSequence = (moodId: string) => {
		handleHaptic();
		setItems([...items, { moodId, duration: 300 }]); // 5 Minuten default
		setShowMoodPicker(false);
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins === 0) {
			return `${secs} Sek`;
		} else if (secs === 0) {
			return `${mins} Min`;
		} else {
			return `${mins} Min ${secs} Sek`;
		}
	};

	const removeMoodFromSequence = (index: number) => {
		handleHaptic();
		setItems(items.filter((_, i) => i !== index));
	};

	const updateMoodDuration = (index: number, duration: number) => {
		handleHaptic();
		const newItems = [...items];
		newItems[index].duration = duration;
		setItems(newItems);
	};

	const handleCreate = () => {
		if (!name.trim()) {
			Alert.alert('Fehler', 'Bitte gib einen Namen ein');
			return;
		}

		if (items.length === 0) {
			Alert.alert('Fehler', 'Bitte füge mindestens einen Mood hinzu');
			return;
		}

		handleHaptic();
		addSequence({
			name: name.trim(),
			items,
			transitionDuration,
			isCustom: true,
		});

		Alert.alert('Erfolg', 'Sequenz wurde erstellt!', [
			{
				text: 'OK',
				onPress: () => router.back(),
			},
		]);
	};

	const getMoodById = (id: string) => moods.find((m) => m.id === id);

	return (
		<View className={`flex-1 ${theme.bg}`}>
			<Stack.Screen
				options={{
					title: 'Neue Sequenz',
					headerBackTitle: 'Zurück',
				}}
			/>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, paddingHorizontal: 16 }}
			>
				{/* Name Input */}
				<View className={`${theme.cardBg} mb-4 rounded-2xl p-4`}>
					<Text className={`mb-2 text-lg font-semibold ${theme.text}`}>Name</Text>
					<TextInput
						value={name}
						onChangeText={setName}
						placeholder="z.B. Morgen Routine"
						className={`p-3 text-base ${theme.input} rounded-lg ${theme.text}`}
						placeholderTextColor="#9CA3AF"
						maxLength={30}
					/>
				</View>

				{/* Transition Duration */}
				<View className={`${theme.cardBg} mb-4 rounded-2xl p-4`}>
					<Text className={`mb-3 text-lg font-semibold ${theme.text}`}>Übergangsdauer</Text>
					<View className="flex-row gap-2">
						{TRANSITION_OPTIONS.map((option) => (
							<Pressable
								key={option.value}
								onPress={() => {
									handleHaptic();
									setTransitionDuration(option.value);
								}}
								className={`rounded-full px-4 py-2 ${
									transitionDuration === option.value ? 'bg-blue-500' : 'bg-gray-200'
								}`}
							>
								<Text
									className={`font-medium ${
										transitionDuration === option.value ? 'text-white' : 'text-gray-700'
									}`}
								>
									{option.label}
								</Text>
							</Pressable>
						))}
					</View>
				</View>

				{/* Moods in Sequenz */}
				<View className={`${theme.cardBg} mb-4 rounded-2xl p-4`}>
					<Text className={`mb-3 text-lg font-semibold ${theme.text}`}>Moods ({items.length})</Text>
					{items.map((item, index) => {
						const mood = getMoodById(item.moodId);
						if (!mood) return null;

						return (
							<View key={index} className="mb-2 rounded-xl bg-gray-800 p-4">
								{/* Mood Name & Delete */}
								<View className="mb-3 flex-row items-center justify-between">
									<Text className="flex-1 text-base font-medium text-white">
										{index + 1}. {mood.name}
									</Text>
									<Pressable onPress={() => removeMoodFromSequence(index)} className="ml-2">
										<Icon name="close" size={18} color="#EF4444" weight="bold" />
									</Pressable>
								</View>

								{/* Duration Slider */}
								<View>
									<Text className="mb-2 text-sm text-white">
										Dauer: {formatDuration(item.duration)}
									</Text>
									<Slider
										minimumValue={1}
										maximumValue={3600}
										step={1}
										value={item.duration}
										onValueChange={(value) => updateMoodDuration(index, Math.round(value))}
										minimumTrackTintColor="#3B82F6"
										maximumTrackTintColor="#4B5563"
										thumbTintColor="#3B82F6"
									/>
									<View className="mt-1 flex-row justify-between">
										<Text className="text-xs text-gray-500">1 Sek</Text>
										<Text className="text-xs text-gray-500">60 Min</Text>
									</View>
								</View>
							</View>
						);
					})}

					{/* Add Mood Button */}
					<Pressable
						onPress={() => {
							handleHaptic();
							setShowMoodPicker(true);
						}}
						className="mt-2 items-center rounded-xl bg-gray-700 p-3"
					>
						<Text className="font-medium text-white">+ Mood hinzufügen</Text>
					</Pressable>
				</View>

				{/* Create Button */}
				<Pressable onPress={handleCreate} className="items-center rounded-2xl bg-blue-500 p-4">
					<Text className="text-lg font-semibold text-white">Sequenz speichern</Text>
				</Pressable>
			</ScrollView>

			{/* Mood Picker Modal */}
			<Modal
				visible={showMoodPicker}
				animationType="slide"
				transparent
				onRequestClose={() => setShowMoodPicker(false)}
			>
				<View className="flex-1 justify-end bg-black/50">
					<View className="max-h-[70%] rounded-t-3xl bg-gray-900 p-4">
						<View className="mb-4 flex-row items-center justify-between">
							<Text className="text-xl font-bold text-white">Mood auswählen</Text>
							<Pressable
								onPress={() => {
									handleHaptic();
									setShowMoodPicker(false);
								}}
							>
								<Icon name="close" size={24} color="#fff" weight="bold" />
							</Pressable>
						</View>
						<ScrollView>
							{moods.map((mood) => (
								<Pressable
									key={mood.id}
									onPress={() => addMoodToSequence(mood.id)}
									className="mb-2 rounded-xl bg-gray-800 p-4"
								>
									<Text className="text-lg font-medium text-white">{mood.name}</Text>
								</Pressable>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</View>
	);
}
