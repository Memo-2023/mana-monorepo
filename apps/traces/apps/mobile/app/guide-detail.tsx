import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { useTheme } from '../utils/themeContext';
import { apiFetch } from '../utils/apiClient';
import type { GuideDetailResponse } from '@traces/types';

const POI_CATEGORY_ICONS: Record<string, string> = {
	building: '🏛️',
	monument: '🗽',
	church: '⛪',
	museum: '🏛️',
	palace: '🏰',
	bridge: '🌉',
	park: '🌳',
	square: '🏛️',
	sculpture: '🎨',
	fountain: '⛲',
	historic_site: '📜',
	other: '📍',
};

export default function GuideDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { isDarkMode } = useTheme();
	const [guide, setGuide] = useState<GuideDetailResponse | null>(null);
	const [loading, setLoading] = useState(true);

	const loadGuide = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		try {
			const result = await apiFetch<GuideDetailResponse>(`/api/v1/guides/${id}`);
			setGuide(result);
		} catch (error) {
			console.error('Failed to load guide:', error);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadGuide();
	}, [loadGuide]);

	if (loading) {
		return (
			<View
				className={`flex-1 items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
			>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!guide) {
		return (
			<View
				className={`flex-1 items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
			>
				<Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
					Führung nicht gefunden
				</Text>
			</View>
		);
	}

	return (
		<ScrollView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
			<View className="px-4 pb-8 pt-16">
				<Pressable onPress={() => router.back()}>
					<Text className="mb-4 text-primary">← Zurück</Text>
				</Pressable>

				{/* Header */}
				<Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
					{guide.title}
				</Text>
				{guide.description && (
					<Text className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
						{guide.description}
					</Text>
				)}

				{/* Stats */}
				<View className={`mt-4 flex-row rounded-xl p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
					{guide.estimatedDurationMin && (
						<View className="flex-1 items-center">
							<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
								Dauer
							</Text>
							<Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								~{guide.estimatedDurationMin} Min.
							</Text>
						</View>
					)}
					{guide.distanceMeters && (
						<View className="flex-1 items-center">
							<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
								Distanz
							</Text>
							<Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
								{guide.distanceMeters >= 1000
									? `${(guide.distanceMeters / 1000).toFixed(1)} km`
									: `${guide.distanceMeters}m`}
							</Text>
						</View>
					)}
					<View className="flex-1 items-center">
						<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							Stationen
						</Text>
						<Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
							{guide.pois.length}
						</Text>
					</View>
				</View>

				{/* POI Cards */}
				<View className="mt-6">
					{guide.pois.map((guidePoi, index) => (
						<View
							key={guidePoi.id}
							className={`mb-4 rounded-xl p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
							style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
						>
							{/* Station header */}
							<View className="flex-row items-center">
								<View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary">
									<Text className="text-sm font-bold text-white">{index + 1}</Text>
								</View>
								<View className="flex-1">
									<Text
										className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
									>
										{POI_CATEGORY_ICONS[guidePoi.poi.category] || '📍'} {guidePoi.poi.name}
									</Text>
									<Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
										{guidePoi.poi.category.replace('_', ' ')}
									</Text>
								</View>
							</View>

							{/* Narrative */}
							{guidePoi.aiNarrative && (
								<Text
									className={`mt-3 text-sm leading-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
								>
									{guidePoi.aiNarrative}
								</Text>
							)}

							{/* POI AI Summary */}
							{guidePoi.poi.aiSummary && (
								<View
									className={`mt-3 rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
								>
									<Text
										className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
									>
										Hintergrund
									</Text>
									<Text
										className={`mt-1 text-xs leading-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
										numberOfLines={5}
									>
										{guidePoi.poi.aiSummary}
									</Text>
								</View>
							)}
						</View>
					))}
				</View>
			</View>
		</ScrollView>
	);
}
