import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { useResponsive } from '@/hooks/useResponsive';
import { useStore } from '@/store/store';
import { getThemeColors } from '@/utils/theme';

export default function Sequences() {
	const router = useRouter();
	const sequences = useStore((state) => state.sequences);
	const moods = useStore((state) => state.moods);
	const settings = useStore((state) => state.settings);
	const removeSequence = useStore((state) => state.removeSequence);

	const theme = getThemeColors();
	const responsive = useResponsive();

	const handleHaptic = () => {
		if (settings.hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	};

	const handleDelete = (id: string, name: string) => {
		Alert.alert('Sequenz löschen', `Möchtest du "${name}" wirklich löschen?`, [
			{ text: 'Abbrechen', style: 'cancel' },
			{
				text: 'Löschen',
				style: 'destructive',
				onPress: () => {
					handleHaptic();
					removeSequence(id);
				},
			},
		]);
	};

	const getTotalDuration = (sequence: (typeof sequences)[0]) => {
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
		<View className={`flex-1 ${theme.bg}`}>
			<Stack.Screen
				options={{
					title: 'Sequenzen',
					headerBackTitle: 'Zurück',
				}}
			/>
			<ScrollView className="flex-1" contentContainerClassName="items-center pb-4 pt-4">
				<View style={{ width: '100%', maxWidth: responsive.maxContentWidth }} className="px-6">
					{/* Sequenzen Liste */}
					{sequences.length > 0 ? (
						sequences.map((sequence) => (
							<View key={sequence.id} className={`${theme.cardBg} mx-2 mb-4 rounded-2xl p-4`}>
								<Pressable
									onPress={() => {
										handleHaptic();
										router.push(`/sequence/${sequence.id}`);
									}}
								>
									<Text className={`text-xl font-bold ${theme.text} mb-2`}>{sequence.name}</Text>
									<Text className={`${theme.textSecondary} text-sm`}>
										{sequence.items.length} Moods · {getTotalDuration(sequence)} · Übergang{' '}
										{sequence.transitionDuration}s
									</Text>
								</Pressable>

								{/* Action Buttons */}
								<View className="mt-3 flex-row gap-2">
									<Pressable
										onPress={() => {
											handleHaptic();
											router.push(`/edit-sequence/${sequence.id}`);
										}}
										className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-blue-500 py-3"
									>
										<Icon name="pencil" size={16} color="#fff" weight="bold" />
										<Text className="text-sm font-semibold text-white">Bearbeiten</Text>
									</Pressable>

									<Pressable
										onPress={() => handleDelete(sequence.id, sequence.name)}
										className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-red-500 py-3"
									>
										<Icon name="trash" size={16} color="#fff" weight="bold" />
										<Text className="text-sm font-semibold text-white">Löschen</Text>
									</Pressable>
								</View>
							</View>
						))
					) : (
						<View className="items-center px-2 py-8">
							<Text className={`${theme.textSecondary} mb-4 text-center`}>
								Noch keine Sequenzen erstellt
							</Text>
						</View>
					)}

					{/* Neue Sequenz Button */}
					<Pressable
						onPress={() => {
							handleHaptic();
							router.push('/create-sequence');
						}}
						className="mx-2 mt-2 items-center rounded-2xl bg-blue-500 p-4"
					>
						<Text className="text-lg font-semibold text-white">+ Neue Sequenz</Text>
					</Pressable>
				</View>
			</ScrollView>
		</View>
	);
}
