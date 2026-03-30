import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import DraggableFlatList, {
	ScaleDecorator,
	RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/useResponsive';
import type { Mood } from '@/store/store';
import { useStore } from '@/store/store';
import { getThemeColors } from '@/utils/theme';

export default function ReorderMoods() {
	const router = useRouter();
	const moods = useStore((state) => state.moods);
	const reorderMoods = useStore((state) => state.reorderMoods);
	const removeMood = useStore((state) => state.removeMood);
	const settings = useStore((state) => state.settings);

	const theme = getThemeColors();
	const responsive = useResponsive();

	const handleHaptic = () => {
		if (settings.hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	};

	const handleDelete = (mood: Mood) => {
		if (!mood.isCustom) {
			Alert.alert('Hinweis', 'Standard-Moods können nicht gelöscht werden');
			return;
		}

		Alert.alert('Mood löschen', `"${mood.name}" wirklich löschen?`, [
			{ text: 'Abbrechen', style: 'cancel' },
			{
				text: 'Löschen',
				style: 'destructive',
				onPress: () => {
					handleHaptic();
					removeMood(mood.id);
				},
			},
		]);
	};

	const renderItem = ({ item, drag, isActive }: RenderItemParams<Mood>) => {
		return (
			<ScaleDecorator>
				<View style={{ width: '100%', maxWidth: responsive.maxContentWidth, alignSelf: 'center' }}>
					<Pressable
						onLongPress={() => {
							handleHaptic();
							drag();
						}}
						disabled={isActive}
						className={`mx-2 mb-4 ${isActive ? 'opacity-80' : ''}`}
					>
						<View className="h-32 flex-row overflow-hidden rounded-3xl">
							<LinearGradient
								colors={item.colors}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								className="flex-1 flex-row items-center justify-between px-6"
							>
								<View className="flex-1">
									<Text className="text-xl font-bold text-white">{item.name}</Text>
									{item.isCustom && (
										<Text className="mt-1 text-xs text-white/80">Benutzerdefiniert</Text>
									)}
								</View>

								<View className="flex-row gap-3">
									<View className="rounded-full bg-white/20 px-3 py-2">
										<Text className="text-sm text-white">☰</Text>
									</View>
									{item.isCustom && (
										<Pressable
											onPress={() => handleDelete(item)}
											className="rounded-full bg-red-500/80 px-3 py-2"
										>
											<Text className="text-sm text-white">🗑️</Text>
										</Pressable>
									)}
								</View>
							</LinearGradient>
						</View>
					</Pressable>
				</View>
			</ScaleDecorator>
		);
	};

	return (
		<GestureHandlerRootView className={`flex-1 ${theme.bg}`}>
			<SafeAreaView className="flex-1" edges={['top']}>
				<Stack.Screen
					options={{
						title: 'Moods sortieren',
						presentation: 'modal',
					}}
				/>
				<View className="flex-1">
					<View className={`p-4 ${theme.cardBg} border-b ${theme.border}`}>
						<Text className={`${theme.textSecondary} text-center`}>
							Halte einen Mood gedrückt zum Verschieben
						</Text>
					</View>
					<DraggableFlatList
						data={moods}
						onDragEnd={({ data }) => {
							handleHaptic();
							reorderMoods(data);
						}}
						keyExtractor={(item) => item.id}
						renderItem={renderItem}
						contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
					/>
				</View>
			</SafeAreaView>
		</GestureHandlerRootView>
	);
}
