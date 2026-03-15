import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';

import { useTheme } from '../../../utils/themeContext';
import { apiFetch, getAuthToken } from '../../../utils/apiClient';
import { SettingsButton } from '../../../components/SettingsButton';
import type { GuideResponse } from '@traces/types';

export default function GuidesScreen() {
	const { isDarkMode } = useTheme();
	const [guides, setGuides] = useState<GuideResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const loadGuides = useCallback(async () => {
		setLoading(true);
		try {
			const token = await getAuthToken();
			if (!token) {
				setIsAuthenticated(false);
				setLoading(false);
				return;
			}
			setIsAuthenticated(true);

			const result = await apiFetch<GuideResponse[]>('/api/v1/guides');
			setGuides(result);
		} catch (error) {
			console.error('Failed to load guides:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadGuides();
		}, [loadGuides])
	);

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'generating':
				return { text: 'Wird erstellt...', color: 'text-yellow-600' };
			case 'ready':
				return { text: 'Bereit', color: 'text-green-600' };
			case 'error':
				return { text: 'Fehler', color: 'text-red-600' };
			default:
				return { text: status, color: 'text-gray-500' };
		}
	};

	const renderGuide = ({ item }: { item: GuideResponse }) => {
		const status = getStatusLabel(item.status);

		return (
			<Pressable
				className={`mx-4 mb-3 rounded-xl p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
				style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
				onPress={() => {
					if (item.status === 'ready') {
						router.push({ pathname: '/guide-detail', params: { id: item.id } });
					}
				}}
				disabled={item.status !== 'ready'}
			>
				<View className="flex-row items-start justify-between">
					<Text
						className={`flex-1 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
					>
						{item.title}
					</Text>
					<Text className={`ml-2 text-xs font-medium ${status.color}`}>{status.text}</Text>
				</View>

				{item.description && (
					<Text className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
						{item.description}
					</Text>
				)}

				<View className="mt-2 flex-row justify-between">
					{item.estimatedDurationMin && (
						<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							~{item.estimatedDurationMin} Min.
						</Text>
					)}
					{item.distanceMeters && (
						<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							{item.distanceMeters >= 1000
								? `${(item.distanceMeters / 1000).toFixed(1)} km`
								: `${item.distanceMeters}m`}
						</Text>
					)}
				</View>
			</Pressable>
		);
	};

	return (
		<View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
			<View className="flex-row items-center justify-between px-4 pb-2 pt-16">
				<Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
					Führungen
				</Text>
				<SettingsButton />
			</View>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
				</View>
			) : !isAuthenticated ? (
				<View className="flex-1 items-center justify-center px-8">
					<Text className={`text-center text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
						Melde dich an, um KI-Stadtführungen zu erstellen und zu sehen.
					</Text>
				</View>
			) : guides.length === 0 ? (
				<View className="flex-1 items-center justify-center px-8">
					<Text className={`text-center text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
						Noch keine Führungen. Gehe zu einer Stadt und erstelle deine erste KI-Stadtführung.
					</Text>
				</View>
			) : (
				<FlatList
					data={guides}
					renderItem={renderGuide}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
				/>
			)}
		</View>
	);
}
