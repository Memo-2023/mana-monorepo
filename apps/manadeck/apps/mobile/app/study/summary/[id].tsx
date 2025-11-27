import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStudyStore } from '../../../store/studyStore';
import { useDeckStore } from '../../../store/deckStore';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export default function StudySummaryScreen() {
	const { id: deckId } = useLocalSearchParams<{ id: string }>();
	const { currentSession, cardProgress, resetState } = useStudyStore();
	const { currentDeck, fetchDeck } = useDeckStore();

	const [sessionData, setSessionData] = useState<{
		totalCards: number;
		completedCards: number;
		correctAnswers: number;
		incorrectAnswers: number;
		accuracy: number;
		duration: string;
	} | null>(null);

	useEffect(() => {
		if (deckId) {
			fetchDeck(deckId);
		}

		// Calculate session stats
		if (currentSession) {
			const startTime = new Date(currentSession.started_at);
			const endTime = currentSession.ended_at ? new Date(currentSession.ended_at) : new Date();
			const durationMs = endTime.getTime() - startTime.getTime();
			const minutes = Math.floor(durationMs / 60000);
			const seconds = Math.floor((durationMs % 60000) / 1000);

			setSessionData({
				totalCards: currentSession.total_cards,
				completedCards: currentSession.completed_cards,
				correctAnswers: currentSession.correct_answers,
				incorrectAnswers: currentSession.completed_cards - currentSession.correct_answers,
				accuracy:
					currentSession.completed_cards > 0
						? Math.round((currentSession.correct_answers / currentSession.completed_cards) * 100)
						: 0,
				duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
			});
		}
	}, [currentSession, deckId]);

	const getPerformanceEmoji = (accuracy: number) => {
		if (accuracy >= 90) return '🎉';
		if (accuracy >= 75) return '💪';
		if (accuracy >= 60) return '👍';
		if (accuracy >= 40) return '🤔';
		return '📚';
	};

	const getPerformanceMessage = (accuracy: number) => {
		if (accuracy >= 90) return 'Hervorragend! Du beherrschst das Material sehr gut!';
		if (accuracy >= 75) return 'Sehr gut! Du machst tolle Fortschritte!';
		if (accuracy >= 60) return 'Gut gemacht! Weiter so!';
		if (accuracy >= 40) return 'Nicht schlecht! Mit mehr Übung wird es besser!';
		return 'Übung macht den Meister! Bleib dran!';
	};

	const handleNewSession = () => {
		resetState();
		router.replace(`/study/session/${deckId}`);
	};

	const handleBackToDeck = () => {
		resetState();
		router.replace(`/deck/${deckId}`);
	};

	if (!sessionData) {
		return (
			<View className="flex-1 items-center justify-center bg-gray-100">
				<Text className="text-gray-500">Zusammenfassung wird geladen...</Text>
			</View>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					title: 'Lernsession abgeschlossen',
					headerLeft: () => null,
				}}
			/>
			<View className="flex-1 bg-gray-100">
				<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
					<View className="px-4 py-6">
						{/* Success Header */}
						<Card padding="lg" variant="elevated" className="mb-6">
							<View className="items-center">
								<Text className="mb-3 text-6xl">{getPerformanceEmoji(sessionData.accuracy)}</Text>
								<Text className="mb-2 text-2xl font-bold text-gray-900">
									Session abgeschlossen!
								</Text>
								<Text className="text-center text-gray-600">
									{getPerformanceMessage(sessionData.accuracy)}
								</Text>
							</View>
						</Card>

						{/* Stats Overview */}
						<Card padding="lg" variant="elevated" className="mb-6">
							<Text className="mb-4 text-lg font-semibold text-gray-900">Deine Statistiken</Text>

							{/* Accuracy Circle */}
							<View className="mb-6 items-center">
								<View className="relative h-32 w-32 items-center justify-center rounded-full border-8 border-blue-100">
									<Text className="text-3xl font-bold text-blue-600">{sessionData.accuracy}%</Text>
									<Text className="text-xs text-gray-500">Genauigkeit</Text>
								</View>
							</View>

							{/* Detailed Stats */}
							<View className="space-y-3">
								<View className="flex-row items-center justify-between rounded-lg bg-gray-50 p-3">
									<View className="flex-row items-center">
										<Ionicons name="time-outline" size={20} color="#6B7280" />
										<Text className="ml-2 text-gray-700">Dauer</Text>
									</View>
									<Text className="font-medium text-gray-900">{sessionData.duration}</Text>
								</View>

								<View className="flex-row items-center justify-between rounded-lg bg-gray-50 p-3">
									<View className="flex-row items-center">
										<Ionicons name="card-outline" size={20} color="#6B7280" />
										<Text className="ml-2 text-gray-700">Bearbeitete Karten</Text>
									</View>
									<Text className="font-medium text-gray-900">
										{sessionData.completedCards} / {sessionData.totalCards}
									</Text>
								</View>

								<View className="flex-row items-center justify-between rounded-lg bg-green-50 p-3">
									<View className="flex-row items-center">
										<Ionicons name="checkmark-circle" size={20} color="#10B981" />
										<Text className="ml-2 text-gray-700">Richtige Antworten</Text>
									</View>
									<Text className="font-medium text-green-600">{sessionData.correctAnswers}</Text>
								</View>

								<View className="flex-row items-center justify-between rounded-lg bg-red-50 p-3">
									<View className="flex-row items-center">
										<Ionicons name="close-circle" size={20} color="#EF4444" />
										<Text className="ml-2 text-gray-700">Falsche Antworten</Text>
									</View>
									<Text className="font-medium text-red-600">{sessionData.incorrectAnswers}</Text>
								</View>
							</View>
						</Card>

						{/* Progress Tracking */}
						<Card padding="lg" variant="outlined" className="mb-6">
							<View className="flex-row items-center justify-between">
								<View>
									<Text className="text-sm text-gray-500">Lernstreak</Text>
									<Text className="text-2xl font-bold text-gray-900">1 Tag 🔥</Text>
								</View>
								<View>
									<Text className="text-sm text-gray-500">Gesamtfortschritt</Text>
									<Text className="text-2xl font-bold text-gray-900">
										{sessionData.completedCards} Karten
									</Text>
								</View>
							</View>
						</Card>

						{/* Action Buttons */}
						<View className="space-y-3">
							<Button
								onPress={handleNewSession}
								variant="primary"
								fullWidth
								size="lg"
								leftIcon={<Ionicons name="refresh-outline" size={20} color="white" />}
							>
								Neue Session starten
							</Button>

							<Button
								onPress={handleBackToDeck}
								variant="outline"
								fullWidth
								size="lg"
								leftIcon={<Ionicons name="albums-outline" size={20} color="#374151" />}
							>
								Zurück zum Deck
							</Button>

							<Button onPress={() => router.replace('/(tabs)')} variant="ghost" fullWidth size="lg">
								Zur Startseite
							</Button>
						</View>
					</View>
				</ScrollView>
			</View>
		</>
	);
}
