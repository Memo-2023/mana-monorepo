import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCardStore } from '../../store/cardStore';
import { CardView } from '../../components/card/CardView';
import { Button } from '../../components/ui/Button';
import { useThemeColors } from '~/utils/themeUtils';

export default function CardDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { fetchCard, currentCard, isLoading } = useCardStore();
	const colors = useThemeColors();

	useEffect(() => {
		if (id) {
			fetchCard(id);
		}
	}, [id]);

	if (isLoading || !currentCard) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: colors.background,
				}}
			>
				<Text style={{ color: colors.mutedForeground }}>Karte wird geladen...</Text>
			</View>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					title: currentCard.title || 'Karte',
					headerStyle: { backgroundColor: colors.surface },
					headerTintColor: colors.foreground,
				}}
			/>
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<ScrollView
					style={{ flex: 1 }}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 200, paddingHorizontal: 16 }}
				>
					<CardView card={currentCard} mode="view" showActions />
				</ScrollView>

				{/* Floating Bottom Bar */}
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
						paddingHorizontal: 16,
						paddingTop: 16,
						paddingBottom: 32,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: -4 },
						shadowOpacity: 0.1,
						shadowRadius: 12,
						elevation: 8,
					}}
				>
					<View style={{ gap: 10 }}>
						<Button
							onPress={() => router.push(`/card/edit/${currentCard.id}`)}
							variant="primary"
							fullWidth
							leftIcon={<Ionicons name="create-outline" size={20} color="white" />}
						>
							Bearbeiten
						</Button>

						<Button onPress={() => router.back()} variant="outline" fullWidth>
							Zurück
						</Button>
					</View>
				</View>
			</View>
		</>
	);
}
