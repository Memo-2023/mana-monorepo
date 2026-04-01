import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '~/utils/themeUtils';
import { useDeckStore } from '../../store/deckStore';
import { useCardStore } from '../../store/cardStore';
import { Button } from '../../components/ui/Button';
import { CardList } from '../../components/card/CardList';
import { StudyModeSelector, StudyMode } from '../../components/study/StudyModeSelector';
import { useStudyStore } from '../../store/studyStore';
import { spacing } from '~/utils/spacing';

export default function DeckDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { currentDeck, fetchDeck, toggleFavorite, isLoading } = useDeckStore();
	const { cards, fetchCards } = useCardStore();
	const { startSession, fetchCardProgress, cardProgressMap } = useStudyStore();
	const [showModeSelector, setShowModeSelector] = useState(false);
	const colors = useThemeColors();
	useEffect(() => {
		if (id) {
			fetchDeck(id);
			fetchCards(id);
			fetchCardProgress(id);
		}
	}, [id]);

	const handleToggleFavorite = async () => {
		if (currentDeck) {
			await toggleFavorite(currentDeck.id);
			// Refetch to get updated data
			await fetchDeck(currentDeck.id);
		}
	};

	const handleStartStudy = async (mode: StudyMode) => {
		if (!id) return;
		await startSession(id, mode);
		router.push(`/study/session/${id}` as any);
	};

	if (isLoading || !currentDeck) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
				<Stack.Screen
					options={{
						headerShown: true,
						title: 'Lädt...',
						headerStyle: { backgroundColor: colors.surface },
						headerTintColor: colors.foreground,
						headerLeft: () => (
							<Pressable onPress={() => router.back()}>
								<Ionicons name="arrow-back" size={24} color={colors.foreground} />
							</Pressable>
						),
					}}
				/>
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			</SafeAreaView>
		);
	}

	const isFavorite = currentDeck.metadata?.is_favorite || false;

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<Stack.Screen
				options={{
					headerShown: true,
					title: currentDeck.title,
					headerStyle: { backgroundColor: colors.surface },
					headerTintColor: colors.foreground,
					headerRight: () => (
						<View style={{ flexDirection: 'row' }}>
							<Pressable onPress={handleToggleFavorite} style={{ marginRight: 16 }}>
								<Ionicons
									name={isFavorite ? 'heart' : 'heart-outline'}
									size={24}
									color={isFavorite ? colors.destructive : colors.mutedForeground}
								/>
							</Pressable>
							<Pressable onPress={() => router.push(`/deck/${id}/edit`)}>
								<Ionicons name="create-outline" size={24} color={colors.mutedForeground} />
							</Pressable>
						</View>
					),
					headerLeft: () => (
						<Pressable onPress={() => router.back()}>
							<Ionicons name="arrow-back" size={24} color={colors.foreground} />
						</Pressable>
					),
				}}
			/>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingTop: spacing.sm,
					paddingBottom: 200,
					paddingHorizontal: spacing.container.horizontal,
				}}
			>
				<CardList deckId={currentDeck.id} isCompact={true} showActions={false} />
			</ScrollView>

			{/* Floating Bottom Glass Bar */}
			<View
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					backgroundColor: 'rgba(255, 255, 255, 0.85)',
					backdropFilter: 'blur(20px)',
					borderTopWidth: 1,
					borderTopColor: 'rgba(0, 0, 0, 0.1)',
					paddingHorizontal: spacing.container.horizontal,
					paddingTop: spacing.lg,
					paddingBottom: spacing.xxl,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: -4 },
					shadowOpacity: 0.1,
					shadowRadius: 12,
					elevation: 8,
				}}
			>
				{currentDeck.description && (
					<Text
						style={{
							marginBottom: spacing.content.small,
							fontSize: 14,
							lineHeight: 20,
							color: 'rgba(0, 0, 0, 0.7)',
						}}
						numberOfLines={2}
					>
						{currentDeck.description}
					</Text>
				)}

				<View
					style={{
						marginBottom: spacing.content.small,
						flexDirection: 'row',
						alignItems: 'center',
					}}
				>
					<Ionicons name="layers-outline" size={16} color="rgba(0, 0, 0, 0.6)" />
					<Text style={{ marginLeft: 6, fontSize: 14, color: 'rgba(0, 0, 0, 0.6)' }}>
						{cards.length} {cards.length === 1 ? 'Karte' : 'Karten'}
					</Text>
				</View>

				{/* Action Buttons */}
				<View style={{ gap: spacing.sm }}>
					<Button
						onPress={() => setShowModeSelector(true)}
						variant="primary"
						fullWidth
						leftIcon={<Ionicons name="play-circle-outline" size={20} color="white" />}
						disabled={cards.length === 0}
					>
						Lernen starten
					</Button>
					<Button
						onPress={() => router.push(`/card/create?deckId=${currentDeck.id}`)}
						variant="outline"
						fullWidth
						leftIcon={<Ionicons name="add-circle-outline" size={20} color={colors.foreground} />}
					>
						Karte hinzufügen
					</Button>
				</View>
			</View>

			{/* Study Mode Selector Modal */}
			<StudyModeSelector
				visible={showModeSelector}
				onClose={() => setShowModeSelector(false)}
				onSelectMode={handleStartStudy}
			/>
		</View>
	);
}
