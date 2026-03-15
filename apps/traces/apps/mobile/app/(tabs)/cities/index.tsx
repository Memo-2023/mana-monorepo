import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';

import { useTheme } from '../../../utils/themeContext';
import { getCitiesFromLocations, type CityVisit } from '../../../utils/placeService';
import { apiFetch, getAuthToken } from '../../../utils/apiClient';
import { SettingsButton } from '../../../components/SettingsButton';
import type { CityVisitResponse } from '@traces/types';

export default function CitiesScreen() {
	const { isDarkMode } = useTheme();
	const [cities, setCities] = useState<(CityVisit | CityVisitResponse)[]>([]);
	const [loading, setLoading] = useState(true);
	const [isOnline, setIsOnline] = useState(false);

	const loadCities = useCallback(async () => {
		setLoading(true);
		try {
			// Try backend first
			const token = await getAuthToken();
			if (token) {
				try {
					const backendCities = await apiFetch<CityVisitResponse[]>('/api/v1/cities');
					setCities(backendCities);
					setIsOnline(true);
					setLoading(false);
					return;
				} catch {
					// Fall back to local
				}
			}

			// Offline fallback: use local data
			const localCities = await getCitiesFromLocations();
			setCities(localCities);
			setIsOnline(false);
		} catch (error) {
			console.error('Failed to load cities:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadCities();
		}, [loadCities])
	);

	const formatDuration = (ms: number) => {
		const hours = Math.floor(ms / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);
		if (days > 0) return `${days} Tag${days > 1 ? 'e' : ''}`;
		if (hours > 0) return `${hours} Std.`;
		const minutes = Math.floor(ms / (1000 * 60));
		return `${minutes} Min.`;
	};

	const getCityName = (item: CityVisit | CityVisitResponse): string => {
		if ('city' in item && typeof item.city === 'object')
			return (item as CityVisitResponse).city.name;
		return (item as CityVisit).city;
	};

	const getVisitCount = (item: CityVisit | CityVisitResponse): number => {
		return item.visitCount;
	};

	const getDuration = (item: CityVisit | CityVisitResponse): number => {
		if ('totalDurationMs' in item) return item.totalDurationMs;
		return (item as CityVisit).totalDuration;
	};

	const getCityId = (item: CityVisit | CityVisitResponse): string | undefined => {
		if ('city' in item && typeof item.city === 'object') return (item as CityVisitResponse).city.id;
		return undefined;
	};

	const renderCity = ({ item }: { item: CityVisit | CityVisitResponse }) => (
		<Pressable
			className={`mx-4 mb-3 rounded-xl p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
			style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
			onPress={() => {
				const cityId = getCityId(item);
				if (cityId) {
					router.push({ pathname: '/city-detail', params: { id: cityId } });
				}
			}}
		>
			<Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
				{getCityName(item)}
			</Text>
			<View className="mt-2 flex-row justify-between">
				<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
					{getVisitCount(item)} Besuch{getVisitCount(item) !== 1 ? 'e' : ''}
				</Text>
				<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
					{formatDuration(getDuration(item))}
				</Text>
			</View>
		</Pressable>
	);

	return (
		<View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
			<View className="flex-row items-center justify-between px-4 pb-2 pt-16">
				<Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
					Städte
				</Text>
				<SettingsButton />
			</View>

			{!isOnline && (
				<View className="mx-4 mb-2 rounded-lg bg-yellow-100 px-3 py-1.5">
					<Text className="text-xs text-yellow-800">Offline-Modus (lokale Daten)</Text>
				</View>
			)}

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" />
				</View>
			) : cities.length === 0 ? (
				<View className="flex-1 items-center justify-center px-8">
					<Text className={`text-center text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
						Noch keine Städte erkannt. Starte das Tracking, um besuchte Städte zu sehen.
					</Text>
				</View>
			) : (
				<FlatList
					data={cities}
					renderItem={renderCity}
					keyExtractor={(item, index) => getCityId(item) || `city-${index}`}
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
				/>
			)}
		</View>
	);
}
