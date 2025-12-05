import { Stack, router } from 'expo-router';
import {
	StyleSheet,
	View,
	ScrollView,
	SafeAreaView,
	ActivityIndicator,
	useWindowDimensions,
	Animated,
	TouchableOpacity,
} from 'react-native';
import React, { useRef, useState as useReactState } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { useTheme } from '~/utils/ThemeContext';
import { ThemedView, ThemedText } from '~/components/ThemedView';
import { useState, useEffect, useMemo } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getPublicFigures } from '~/utils/figureService';
import { VerticalFigureCard } from '~/components/FigureCard';
import { Header } from '~/components/Header';

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
		};
		items?: Array<{
			name?: string;
			description?: string;
		}>;
	};
}

export default function Home() {
	const { theme, isDark } = useTheme();
	const { width } = useWindowDimensions();
	const [figures, setFigures] = useState<Figure[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Create a ref for the ScrollView
	const scrollViewRef = useRef<ScrollView>(null);
	useScrollToTop(scrollViewRef);

	// Animation für das Settings-Icon
	const scrollY = useRef(new Animated.Value(0)).current;
	const settingsOpacity = scrollY.interpolate({
		inputRange: [0, 50],
		outputRange: [1, 0],
		extrapolate: 'clamp',
	});
	const settingsTranslateY = scrollY.interpolate({
		inputRange: [0, 50],
		outputRange: [0, -50],
		extrapolate: 'clamp',
	});

	// Bestimme die Anzahl der Spalten basierend auf der Bildschirmbreite
	const columns = useMemo(() => {
		if (width >= 1200) return 3; // Drei Spalten für sehr breite Bildschirme (Desktop)
		if (width >= 768) return 2; // Zwei Spalten für mittlere Bildschirme (Tablets)
		return 1; // Eine Spalte für schmale Bildschirme (Smartphones)
	}, [width]);

	// Lade öffentliche Figuren aus der Datenbank
	useEffect(() => {
		async function loadPublicFigures() {
			setLoading(true);
			try {
				const data = await getPublicFigures();
				console.log('Public figures data:', data);
				setFigures(data);
			} catch (err: any) {
				console.error('Fehler beim Laden der öffentlichen Figuren:', err);
				setError(err?.message || 'Unbekannter Fehler');
			} finally {
				setLoading(false);
			}
		}

		loadPublicFigures();
	}, []);

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Community',
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
				{/* Header mit App-Icon, Titel und Settings-Icon */}
				<Header title="Figgo's Feed" scrollY={scrollY} />
				{error ? (
					<ThemedView style={styles.errorContainer} debugBorderType="tertiary">
						<ThemedText style={styles.errorText}>Fehler beim Laden der Figuren: {error}</ThemedText>
					</ThemedView>
				) : figures.length === 0 && !loading ? (
					<ThemedView style={styles.emptyContainer} debugBorderType="tertiary">
						<ThemedText style={styles.emptyText}>Keine öffentlichen Figuren gefunden.</ThemedText>
					</ThemedView>
				) : (
					<ScrollView
						ref={scrollViewRef}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
						onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
							useNativeDriver: true,
						})}
						scrollEventThrottle={16}
					>
						<ThemedView style={[styles.cardsContainer]} debugBorderType="secondary">
							<View style={[styles.cardsGrid, { flexDirection: columns === 1 ? 'column' : 'row' }]}>
								{loading
									? // Platzhalter-Karten während des Ladens anzeigen
										Array.from({ length: 6 }).map((_, index) => (
											<View
												key={`placeholder-${index}`}
												style={[
													styles.cardWrapper,
													{
														width: columns === 1 ? '100%' : columns === 2 ? '50%' : '33.33%',
														paddingHorizontal: columns > 1 ? 8 : 0,
													},
												]}
											>
												<VerticalFigureCard
													image={{ uri: 'https://via.placeholder.com/1x1.png' }} // Leeres 1x1 Pixel Bild statt YourCharacter.png
													title="Wird geladen..."
													creator=""
													likes={0}
													characterInfo={undefined}
												/>
											</View>
										))
									: // Tatsächliche Figuren anzeigen, wenn sie geladen sind
										figures.map((figure, index) => (
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
															: {
																	uri: 'https://via.placeholder.com/300x450/333333/666666?text=Kein+Bild',
																}
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
	// Styles für Settings-Icon wurden in die Header-Komponente verschoben
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
		fontSize: 16,
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
		paddingHorizontal: 0, // Kein Padding für die äußeren Ränder
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
	card: {
		width: '100%',
		borderRadius: 10,
		overflow: 'hidden',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	imageContainer: {
		width: '100%',
		height: 300,
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	infoContainer: {
		padding: 15,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	creator: {
		fontSize: 14,
		marginBottom: 5,
		opacity: 0.7,
	},
	likes: {
		fontSize: 12,
		opacity: 0.6,
	},
});
