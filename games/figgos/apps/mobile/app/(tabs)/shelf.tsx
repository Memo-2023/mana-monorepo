import { Stack } from 'expo-router';
import { StyleSheet, View, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import React, { useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { useTheme } from '~/utils/ThemeContext';
import { ThemedView, ThemedText } from '~/components/ThemedView';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '~/utils/AuthContext';

import { getUserFigures } from '~/utils/figureService';
import { VerticalFigureCard } from '~/components/FigureCard';

// Definiere den Typ für eine Figur
interface Figure {
	id: string;
	name: string;
	subject: string;
	image_url: string;
	theme?: string;
	rarity?: string;
	likes?: number;
	user_id?: string;
	character_info?: {
		character?: {
			description?: string;
			lore?: string;
		};
		items?: Array<{
			name?: string;
			description?: string;
			lore?: string;
		}>;
	};
}

export default function Shelf() {
	const { theme, isDark } = useTheme();
	const { user } = useAuth();
	const { width } = useWindowDimensions();
	const [figures, setFigures] = useState<Figure[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Create a ref for the ScrollView
	const scrollViewRef = useRef<ScrollView>(null);
	useScrollToTop(scrollViewRef);

	// Bestimme die Anzahl der Spalten basierend auf der Bildschirmbreite
	const columns = useMemo(() => {
		if (width >= 1200) return 3; // Drei Spalten für sehr breite Bildschirme (Desktop)
		if (width >= 768) return 2; // Zwei Spalten für mittlere Bildschirme (Tablets)
		return 1; // Eine Spalte für schmale Bildschirme (Smartphones)
	}, [width]);

	// Lade die Figuren des Nutzers aus der Datenbank
	useEffect(() => {
		async function loadUserFigures() {
			if (!user) {
				setError('Du musst angemeldet sein, um deine Figuren zu sehen.');
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const data = await getUserFigures(user.id);
				console.log('User figures data:', data);
				setFigures(data);
			} catch (err: any) {
				console.error('Fehler beim Laden der Figuren des Nutzers:', err);
				setError(err?.message || 'Unbekannter Fehler');
			} finally {
				setLoading(false);
			}
		}

		loadUserFigures();
	}, [user]);

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Collection',
					headerStyle: {
						backgroundColor: theme.colors.background,
					},
					headerTintColor: theme.colors.text,
					headerShadowVisible: false,
				}}
			/>
			<ThemedView
				style={[styles.container, { backgroundColor: theme.colors.background }]}
				debugBorderType="primary"
			>
				{loading ? (
					<ThemedView style={styles.loadingContainer} debugBorderType="tertiary">
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<ThemedText style={styles.loadingText}>Lade deine Figuren...</ThemedText>
					</ThemedView>
				) : error ? (
					<ThemedView style={styles.errorContainer} debugBorderType="tertiary">
						<ThemedText style={styles.errorText}>
							Fehler beim Laden deiner Figuren: {error}
						</ThemedText>
					</ThemedView>
				) : figures.length === 0 ? (
					<ThemedView style={styles.emptyContainer} debugBorderType="tertiary">
						<ThemedText style={styles.emptyText}>Du hast noch keine Figuren erstellt.</ThemedText>
					</ThemedView>
				) : (
					<ScrollView
						ref={scrollViewRef}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
					>
						<ThemedView style={[styles.cardsContainer]} debugBorderType="secondary">
							<View style={[styles.cardsGrid, { flexDirection: columns === 1 ? 'column' : 'row' }]}>
								{figures.map((figure, index) => (
									<View
										key={figure.id}
										style={[
											styles.cardWrapper,
											{
												width: columns === 1 ? '100%' : columns === 2 ? '50%' : '33.33%',
												paddingHorizontal: columns > 1 ? 8 : 0,
											},
										]}
									>
										<VerticalFigureCard
											image={
												figure.image_url
													? { uri: figure.image_url }
													: require('../../assets/actionfigures/YourCharacter.png')
											}
											title={figure.name}
											creator={figure.subject}
											likes={figure.likes || 0}
											characterInfo={figure.character_info}
										/>
									</View>
								))}
							</View>
						</ThemedView>
					</ScrollView>
				)}
			</ThemedView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		overflow: 'visible', // Erlaubt Elementen, über den Container hinauszuragen
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		textAlign: 'center',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	emptyText: {
		fontSize: 18,
		textAlign: 'center',
	},
	scrollContent: {
		paddingTop: 100, // Abstand oben für den Header
		paddingBottom: 20, // Abstand unten
		paddingHorizontal: 0, // Horizontalen Abstand entfernt
		overflow: 'visible', // Erlaubt Elementen, über den Container hinauszuragen
	},
	cardsContainer: {
		width: '100%',
		alignItems: 'center',
		overflow: 'visible', // Erlaubt Elementen, über den Container hinauszuragen
		paddingHorizontal: 8, // Padding für die äußeren Ränder
	},
	cardsGrid: {
		width: '100%',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
	},
	cardWrapper: {
		marginBottom: 20,
	},
});
