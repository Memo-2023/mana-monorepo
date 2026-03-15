import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';

import { PlaceDetail } from '~/components/PlaceDetail';
import { ThemeWrapper } from '~/components/ThemeWrapper';
import { Place } from '~/utils/locationHelper';
import { getSavedPlaces, savePlace, deletePlace } from '~/utils/placeService';
import { useTheme } from '~/utils/themeContext';

export default function PlaceDetailsScreen() {
	const { isDarkMode, colors } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams();
	const { placeId, newPlace } = params;

	const [place, setPlace] = useState<Place | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadPlace();
	}, [placeId]);

	const loadPlace = async () => {
		setLoading(true);

		try {
			// Wenn es ein neuer Ort ist (von der Places-Seite weitergeleitet)
			if (newPlace) {
				// Parse das Place-Objekt aus den Parametern
				const parsedPlace = JSON.parse(newPlace as string);

				// Konvertiere das addresses-Array zurück zu einem Set
				const placeWithAddressSet: Place = {
					...parsedPlace,
					addresses: new Set(parsedPlace.addresses || []),
				};

				setPlace(placeWithAddressSet);
				setLoading(false);
				return;
			}

			// Andernfalls lade den Ort aus dem Speicher
			if (placeId) {
				const places = await getSavedPlaces();
				const foundPlace = places.find((p) => p.id === placeId);

				if (foundPlace) {
					setPlace(foundPlace);
				} else {
					// Ort nicht gefunden, zurück zur Orte-Seite
					console.error('Ort mit ID nicht gefunden:', placeId);
					router.back();
				}
			} else {
				// Keine ID angegeben, zurück zur Orte-Seite
				router.back();
			}
		} catch (error) {
			console.error('Fehler beim Laden des Ortes:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async (updatedPlace: Place) => {
		try {
			const success = await savePlace(updatedPlace);

			if (success) {
				// Zurück zur Orte-Seite
				router.back();
			}
		} catch (error) {
			console.error('Fehler beim Speichern des Ortes:', error);
		}
	};

	const handleDelete = async (placeId: string) => {
		try {
			const success = await deletePlace(placeId);

			if (success) {
				// Zurück zur Orte-Seite
				router.back();
			}
		} catch (error) {
			console.error('Fehler beim Löschen des Ortes:', error);
		}
	};

	return (
		<ThemeWrapper>
			<Stack.Screen
				options={{
					title: place ? place.name : 'Ortdetails',
					headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
				}}
			/>

			<View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={colors.primary} />
						<Text style={[styles.loadingText, isDarkMode && { color: '#AAAAAA' }]}>
							Lade Ortdetails...
						</Text>
					</View>
				) : place ? (
					<PlaceDetail place={place} onSave={handleSave} onDelete={handleDelete} />
				) : (
					<View style={styles.errorContainer}>
						<Text style={[styles.errorText, isDarkMode && { color: '#AAAAAA' }]}>
							Dieser Ort konnte nicht geladen werden.
						</Text>
					</View>
				)}
			</View>
		</ThemeWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#666',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	errorText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
	},
});
