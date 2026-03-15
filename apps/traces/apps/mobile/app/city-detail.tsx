import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { useTheme } from '../utils/themeContext';
import { apiFetch } from '../utils/apiClient';
import type { CityResponse, PlaceResponse, GenerateGuideRequest } from '@traces/types';

interface CityDetail {
	city: CityResponse;
	visit: {
		firstVisitAt: string;
		lastVisitAt: string;
		totalDurationMs: number;
		visitCount: number;
	} | null;
}

export default function CityDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { isDarkMode } = useTheme();
	const [detail, setDetail] = useState<CityDetail | null>(null);
	const [places, setPlaces] = useState<PlaceResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);

	const loadData = useCallback(async () => {
		if (!id) return;
		setLoading(true);
		try {
			const [cityDetail, allPlaces] = await Promise.all([
				apiFetch<CityDetail>(`/api/v1/cities/${id}`),
				apiFetch<PlaceResponse[]>('/api/v1/places'),
			]);
			setDetail(cityDetail);
			setPlaces(allPlaces.filter((p) => p.cityId === id));
		} catch (error) {
			console.error('Failed to load city detail:', error);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleGenerateGuide = async () => {
		if (!id) return;

		Alert.alert(
			'Stadtführung erstellen',
			'Es werden Credits verbraucht (ca. 21 Credits für 8 POIs). Fortfahren?',
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Erstellen',
					onPress: async () => {
						setGenerating(true);
						try {
							const request: GenerateGuideRequest = {
								cityId: id,
								radiusMeters: 2000,
								language: 'de',
								maxPois: 8,
							};
							await apiFetch('/api/v1/guides/generate', {
								method: 'POST',
								body: JSON.stringify(request),
							});
							Alert.alert(
								'Erfolg',
								'Die Stadtführung wird erstellt. Du findest sie im Tab "Führungen".'
							);
						} catch (error: any) {
							Alert.alert('Fehler', error.message || 'Führung konnte nicht erstellt werden.');
						} finally {
							setGenerating(false);
						}
					},
				},
			]
		);
	};

	const formatDate = (iso: string) => {
		return new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatDuration = (ms: number) => {
		const hours = Math.floor(ms / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);
		if (days > 0) return `${days} Tag${days > 1 ? 'e' : ''}, ${hours % 24} Std.`;
		if (hours > 0) return `${hours} Stunden`;
		return `${Math.floor(ms / (1000 * 60))} Minuten`;
	};

	if (loading) {
		return (
			<View
				className={`flex-1 items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
			>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!detail) {
		return (
			<View
				className={`flex-1 items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
			>
				<Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Stadt nicht gefunden</Text>
			</View>
		);
	}

	return (
		<ScrollView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
			<View className="px-4 pb-8 pt-16">
				<Pressable onPress={() => router.back()}>
					<Text className="mb-4 text-primary">← Zurück</Text>
				</Pressable>

				<Text className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
					{detail.city.name}
				</Text>
				<Text className={`mt-1 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
					{detail.city.country}
				</Text>

				{/* Visit Stats */}
				{detail.visit && (
					<View className={`mt-6 rounded-xl p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
						<Text
							className={`mb-3 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
						>
							Besuchsstatistiken
						</Text>
						<View className="flex-row justify-between">
							<View>
								<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Besuche
								</Text>
								<Text
									className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
								>
									{detail.visit.visitCount}
								</Text>
							</View>
							<View>
								<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Gesamtdauer
								</Text>
								<Text
									className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
								>
									{formatDuration(detail.visit.totalDurationMs)}
								</Text>
							</View>
						</View>
						<View className="mt-3 flex-row justify-between">
							<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
								Erster Besuch: {formatDate(detail.visit.firstVisitAt)}
							</Text>
							<Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
								Letzter: {formatDate(detail.visit.lastVisitAt)}
							</Text>
						</View>
					</View>
				)}

				{/* Places in this city */}
				{places.length > 0 && (
					<View className="mt-6">
						<Text
							className={`mb-3 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
						>
							Orte in {detail.city.name}
						</Text>
						{places.map((place) => (
							<View
								key={place.id}
								className={`mb-2 rounded-lg p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
							>
								<Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
									{place.name}
								</Text>
								{place.addressFormatted && (
									<Text
										className={`mt-0.5 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
									>
										{place.addressFormatted}
									</Text>
								)}
							</View>
						))}
					</View>
				)}

				{/* Generate Guide Button */}
				<Pressable
					className={`mt-6 items-center rounded-xl p-4 ${generating ? 'bg-gray-400' : 'bg-primary'}`}
					onPress={handleGenerateGuide}
					disabled={generating}
				>
					{generating ? (
						<ActivityIndicator color="white" />
					) : (
						<Text className="text-lg font-semibold text-white">Stadtführung erstellen</Text>
					)}
				</Pressable>
			</View>
		</ScrollView>
	);
}
