import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';

import { ConsolidatedLocation, Place, formatDuration } from '../utils/locationHelper';
import { useTheme } from '../utils/themeContext';

interface PlacesListProps {
	places: (Place | ConsolidatedLocation)[];
	onItemPress?: (place: Place | ConsolidatedLocation) => void;
	onAddPlace?: (place: ConsolidatedLocation) => void;
	showAddButton?: boolean;
	isDarkMode?: boolean;
}

export const PlacesList: React.FC<PlacesListProps> = ({
	places,
	onItemPress,
	onAddPlace,
	showAddButton = false,
	isDarkMode = false,
}) => {
	const { colors } = useTheme();
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	// Eine nützliche Funktion zum Abrufen der primären Adresse
	const getPrimaryAddress = (place: Place | ConsolidatedLocation): string => {
		if ('customAddress' in place && place.customAddress) {
			return place.customAddress;
		}

		if (place.addresses.size === 0) {
			return 'Keine Adressinformationen';
		}

		// Einfach die erste Adresse zurückgeben
		return Array.from(place.addresses)[0];
	};

	const renderItem = ({ item, index }: { item: Place | ConsolidatedLocation; index: number }) => {
		// Prüfe, ob der Eintrag ein Place oder ConsolidatedLocation ist
		const isPlace = 'name' in item;

		// Formatiere den Zeitraum
		const formattedVisitCount = item.count;
		const formattedDuration = formatDuration(item.duration);

		return (
			<TouchableOpacity
				style={[
					styles.item,
					isDarkMode && {
						backgroundColor: '#1E1E1E',
						shadowColor: '#000000',
						shadowOpacity: 0.3,
					},
				]}
				onPress={() => onItemPress && onItemPress(item)}
			>
				<View style={[styles.indexContainer, isDarkMode && { backgroundColor: '#333333' }]}>
					<Text style={[styles.index, isDarkMode && { color: '#AAAAAA' }]}>
						{places.length - index}
					</Text>
				</View>

				<View style={styles.contentContainer}>
					<View style={styles.headerRow}>
						<Text style={[styles.placeName, isDarkMode && { color: '#FFFFFF' }]}>
							{isPlace ? item.name : `Häufiger Ort #${index + 1}`}
						</Text>
						<View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
							<Text style={styles.countText}>{formattedVisitCount}x</Text>
						</View>
					</View>

					<Text style={[styles.address, isDarkMode && { color: '#AAAAAA' }]}>
						{getPrimaryAddress(item)}
					</Text>

					<View style={styles.coordinatesRow}>
						<View style={styles.coordinateItem}>
							<Text style={[styles.coordinateLabel, isDarkMode && { color: '#888888' }]}>
								Gesamtdauer
							</Text>
							<Text style={[styles.coordinateValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formattedDuration}
							</Text>
						</View>
						<View style={styles.coordinateItem}>
							<Text style={[styles.coordinateLabel, isDarkMode && { color: '#888888' }]}>
								Letzter Besuch
							</Text>
							<Text style={[styles.coordinateValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formatDate(item.endTimestamp)}
							</Text>
						</View>
					</View>
				</View>

				{showAddButton && !isPlace && onAddPlace ? (
					<TouchableOpacity
						style={styles.addButton}
						onPress={() => onAddPlace(item as ConsolidatedLocation)}
					>
						<FontAwesome name="plus-circle" size={22} color={colors.primary} />
					</TouchableOpacity>
				) : (
					<View style={styles.arrowContainer}>
						<FontAwesome name="chevron-right" size={16} color={isDarkMode ? '#666666' : '#ccc'} />
					</View>
				)}
			</TouchableOpacity>
		);
	};

	return (
		<FlatList
			data={places}
			renderItem={renderItem}
			keyExtractor={(item, index) => {
				if ('id' in item) {
					return `place-${item.id}`;
				}
				return `frequent-${item.startTimestamp}-${index}`;
			}}
			contentContainerStyle={[styles.listContent, isDarkMode && { backgroundColor: '#121212' }]}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<FontAwesome name="map-marker" size={48} color={isDarkMode ? '#444444' : '#ccc'} />
					<Text style={[styles.emptyText, isDarkMode && { color: '#AAAAAA' }]}>
						Keine häufigen Orte gefunden
					</Text>
					<Text style={[styles.emptySubtext, isDarkMode && { color: '#777777' }]}>
						Besuche einen Ort häufiger, um ihn hier anzuzeigen
					</Text>
				</View>
			}
		/>
	);
};

const styles = StyleSheet.create({
	listContent: {
		padding: 16,
		paddingBottom: 32,
	},
	item: {
		flexDirection: 'row',
		backgroundColor: 'white',
		borderRadius: 8,
		marginBottom: 12,
		padding: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	indexContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#f0f0f0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	index: {
		fontWeight: 'bold',
		fontSize: 14,
		color: '#666',
	},
	contentContainer: {
		flex: 1,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	placeName: {
		fontSize: 16,
		fontWeight: 'bold',
		flex: 1,
		marginRight: 8,
	},
	address: {
		fontSize: 14,
		color: '#666',
		marginBottom: 8,
	},
	countBadge: {
		// backgroundColor set dynamically via colors.primary
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		minWidth: 24,
		alignItems: 'center',
	},
	countText: {
		color: 'white',
		fontSize: 12,
		fontWeight: 'bold',
	},
	coordinatesRow: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	coordinateItem: {
		flex: 1,
		marginRight: 8,
	},
	coordinateLabel: {
		fontSize: 12,
		color: '#999',
		marginBottom: 2,
	},
	coordinateValue: {
		fontSize: 14,
	},
	arrowContainer: {
		justifyContent: 'center',
		paddingLeft: 8,
	},
	addButton: {
		justifyContent: 'center',
		alignItems: 'center',
		width: 40,
		paddingLeft: 8,
	},
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 48,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#666',
		marginTop: 16,
	},
	emptySubtext: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		marginTop: 8,
	},
});
