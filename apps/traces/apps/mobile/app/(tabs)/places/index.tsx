import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Pressable } from 'react-native';

import { CitiesList } from '~/components/CitiesList';
import { CountriesList } from '~/components/CountriesList';
import { PlacesList } from '~/components/PlacesList';
import { SegmentedControl, SegmentedControlOption } from '~/components/SegmentedControl';
import { ThemeWrapper } from '~/components/ThemeWrapper';
import { Place, ConsolidatedLocation } from '~/utils/locationHelper';
import {
	getSavedPlaces,
	getFrequentLocations,
	createPlaceFromLocation,
	getCitiesFromLocations,
	getCountriesFromLocations,
	CityVisit,
	CountryVisit,
} from '~/utils/placeService';
import { useTheme } from '~/utils/themeContext';

export default function PlacesScreen() {
	const { isDarkMode, colors } = useTheme();
	const router = useRouter();
	const navigation = useNavigation();

	const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
	const [frequentLocations, setFrequentLocations] = useState<(ConsolidatedLocation | Place)[]>([]);
	const [cities, setCities] = useState<CityVisit[]>([]);
	const [countries, setCountries] = useState<CountryVisit[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'frequent' | 'cities' | 'countries'>('frequent');

	const segmentedOptions: SegmentedControlOption[] = [
		{ value: 'frequent', label: 'Orte', icon: 'map-marker' },
		{ value: 'cities', label: 'Städte', icon: 'building' },
		{ value: 'countries', label: 'Länder', icon: 'globe' },
	];

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			const places = await getSavedPlaces();
			setSavedPlaces(places);

			const frequentLocs = await getFrequentLocations(1);

			const filteredFrequentLocations = frequentLocs.filter((loc) => {
				return !places.some(
					(place) =>
						Math.abs(place.latitude - loc.latitude) < 0.0005 &&
						Math.abs(place.longitude - loc.longitude) < 0.0005
				);
			});

			const allLocations = [...places, ...filteredFrequentLocations];
			setFrequentLocations(allLocations);

			// Lade Städte
			const citiesData = await getCitiesFromLocations();
			setCities(citiesData);

			// Lade Länder
			const countriesData = await getCountriesFromLocations();
			setCountries(countriesData);
		} catch (error) {
			console.error('Fehler beim Laden der Orte:', error);
			Alert.alert('Fehler', 'Die Orte konnten nicht geladen werden.');
		} finally {
			setLoading(false);
		}
	};

	const handlePlacePress = (place: Place | ConsolidatedLocation) => {
		if ('id' in place) {
			router.push({
				pathname: '/place-details',
				params: { placeId: place.id },
			});
		} else {
			Alert.alert(
				'Ort erstellen',
				'Möchtest du aus diesem häufig besuchten Ort einen benannten Ort erstellen?',
				[
					{ text: 'Abbrechen', style: 'cancel' },
					{
						text: 'Erstellen',
						onPress: () => handleAddPlace(place),
					},
				]
			);
		}
	};

	const handleAddPlace = (location: ConsolidatedLocation) => {
		Alert.prompt(
			'Neuer Ort',
			'Wie soll dieser Ort heißen?',
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Erstellen',
					onPress: async (name: string | undefined) => {
						if (name && name.trim()) {
							const newPlace = createPlaceFromLocation(location, name.trim());
							const { savePlace } = require('~/utils/placeService');
							await savePlace(newPlace);
							await loadData();
						} else {
							Alert.alert('Fehler', 'Bitte gib einen Namen für den Ort ein.');
						}
					},
				},
			],
			'plain-text'
		);
	};

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Pressable
					onPress={() => router.push('/settings')}
					style={({ pressed }) => ({
						opacity: pressed ? 0.5 : 1,
						paddingHorizontal: 16,
						paddingVertical: 8,
					})}
				>
					<FontAwesome name="gear" size={24} color={isDarkMode ? '#FFFFFF' : colors.primary} />
				</Pressable>
			),
			headerRightContainerStyle: {
				paddingRight: 8,
			},
		});
	}, [isDarkMode, navigation, router]);

	return (
		<ThemeWrapper>
			<View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
				<View style={styles.contentContainer}>
					{activeTab === 'frequent' ? (
						<PlacesList
							places={frequentLocations}
							onItemPress={handlePlacePress}
							onAddPlace={handleAddPlace}
							showAddButton
							isDarkMode={isDarkMode}
						/>
					) : activeTab === 'cities' ? (
						<CitiesList cities={cities} isDarkMode={isDarkMode} />
					) : (
						<CountriesList countries={countries} isDarkMode={isDarkMode} />
					)}
				</View>

				<SegmentedControl
					options={segmentedOptions}
					activeValue={activeTab}
					onChange={(value) => setActiveTab(value as 'frequent' | 'cities' | 'countries')}
					isDarkMode={isDarkMode}
				/>
			</View>
		</ThemeWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		flex: 1,
		paddingBottom: 80,
	},
});
