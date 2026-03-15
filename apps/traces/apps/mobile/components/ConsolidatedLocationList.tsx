import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, FlatList, Alert, Pressable } from 'react-native';

import { ConsolidatedLocation, formatDuration } from '../utils/locationHelper';
import { deleteLocationEntry } from '../utils/locationService';
import { useTheme } from '../utils/themeContext';

interface ConsolidatedLocationListProps {
	consolidatedLocations: ConsolidatedLocation[];
	onItemPress?: (location: ConsolidatedLocation) => void;
	onDelete?: () => void;
	isDarkMode?: boolean;
}

export const ConsolidatedLocationList: React.FC<ConsolidatedLocationListProps> = ({
	consolidatedLocations,
	onItemPress,
	onDelete,
	isDarkMode = false,
}) => {
	const { colors } = useTheme();

	const handleDelete = async (consolidatedLocation: ConsolidatedLocation, event: any) => {
		event.stopPropagation();
		const count = consolidatedLocation.originalLocations.length;
		Alert.alert(
			'Standorte löschen',
			`Möchtest du alle ${count} Standort${count > 1 ? 'e' : ''} dieser Gruppe wirklich löschen?`,
			[
				{
					text: 'Abbrechen',
					style: 'cancel',
				},
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: async () => {
						try {
							// Lösche alle Locations in dieser konsolidierten Gruppe
							for (const location of consolidatedLocation.originalLocations) {
								await deleteLocationEntry(location.id);
							}
							onDelete?.();
						} catch (error) {
							Alert.alert('Fehler', 'Die Einträge konnten nicht gelöscht werden.');
						}
					},
				},
			]
		);
	};
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// Eine nützliche Funktion zum Abrufen der primären Adresse
	const getPrimaryAddress = (location: ConsolidatedLocation): string => {
		if (location.addresses.size === 0) {
			return 'Keine Adressinformationen';
		}

		// Einfach die erste Adresse zurückgeben
		return Array.from(location.addresses)[0];
	};

	const renderItem = ({ item, index }: { item: ConsolidatedLocation; index: number }) => {
		// Formatiere den Zeitraum
		const timeRange = `${formatTime(item.startTimestamp)} - ${formatTime(item.endTimestamp)}`;
		const formattedDuration = formatDuration(item.duration);

		return (
			<View
				style={[
					styles.itemContainer,
					isDarkMode && {
						backgroundColor: '#1E1E1E',
					},
				]}
			>
				<Pressable
					style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
					onPress={() => onItemPress && onItemPress(item)}
				>
					<View style={[styles.indexContainer, isDarkMode && { backgroundColor: '#333333' }]}>
						<Text style={[styles.index, isDarkMode && { color: '#AAAAAA' }]}>
							{consolidatedLocations.length - index}
						</Text>
					</View>

					<View style={styles.contentContainer}>
						<View style={styles.headerRow}>
							<Text style={[styles.date, isDarkMode && { color: '#FFFFFF' }]}>
								{formatDate(item.startTimestamp)}
							</Text>
							<View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
								<Text style={styles.countText}>{item.count}</Text>
							</View>
						</View>

						<Text style={[styles.timeRange, isDarkMode && { color: '#AAAAAA' }]}>
							{timeRange} ({formattedDuration})
						</Text>

						<View style={styles.coordinatesRow}>
							<View style={styles.coordinateItem}>
								<Text style={[styles.coordinateLabel, isDarkMode && { color: '#888888' }]}>
									Breitengrad
								</Text>
								<Text style={[styles.coordinateValue, isDarkMode && { color: '#FFFFFF' }]}>
									{item.latitude.toFixed(6)}°
								</Text>
							</View>
							<View style={styles.coordinateItem}>
								<Text style={[styles.coordinateLabel, isDarkMode && { color: '#888888' }]}>
									Längengrad
								</Text>
								<Text style={[styles.coordinateValue, isDarkMode && { color: '#FFFFFF' }]}>
									{item.longitude.toFixed(6)}°
								</Text>
							</View>
						</View>

						{item.accuracy !== undefined && (
							<View style={styles.detailsRow}>
								<Text style={[styles.detailText, isDarkMode && { color: '#AAAAAA' }]}>
									Genauigkeit: ~{item.accuracy.toFixed(1)}m
								</Text>
								{item.altitude !== undefined && (
									<Text style={[styles.detailText, isDarkMode && { color: '#AAAAAA' }]}>
										Höhe: ~{item.altitude.toFixed(1)}m
									</Text>
								)}
							</View>
						)}

						{/* Aggregierte Metadaten für konsolidierte Standorte */}
						{item.originalLocations && item.originalLocations.length > 0 && (
							<View style={[styles.metadataContainer, isDarkMode && { borderTopColor: '#333333' }]}>
								{(() => {
									// Sammle eindeutige Quellen und Verbindungstypen
									const sources = new Set<string>();
									const connections = new Set<string>();
									const accuracyLevels = new Set<string>();
									let hasBattery = false;

									const motions = new Set<string>();

									item.originalLocations.forEach((loc) => {
										if (loc.metadata?.source) sources.add(loc.metadata.source);
										if (loc.metadata?.connectionType) connections.add(loc.metadata.connectionType);
										if (loc.metadata?.deviceMotion && loc.metadata.deviceMotion !== 'unknown')
											motions.add(loc.metadata.deviceMotion);
										if (loc.quality?.accuracyLevel) accuracyLevels.add(loc.quality.accuracyLevel);
										if (loc.metadata?.batteryLevel) hasBattery = true;
									});

									return (
										<View style={styles.metadataRow}>
											{sources.size > 0 && (
												<View
													style={[
														styles.metadataTag,
														styles.aggregatedTag,
														isDarkMode && { backgroundColor: '#2A2A2A' },
													]}
												>
													<Text
														style={[styles.metadataTagText, isDarkMode && { color: '#CCCCCC' }]}
													>
														📊{' '}
														{Array.from(sources)
															.map((s) =>
																s === 'foreground' ? 'VG' : s === 'background' ? 'BG' : 'M'
															)
															.join('+')}
													</Text>
												</View>
											)}
											{motions.size > 0 && (
												<View
													style={[
														styles.metadataTag,
														styles.aggregatedTag,
														isDarkMode && { backgroundColor: '#2A2A2A' },
													]}
												>
													<Text
														style={[styles.metadataTagText, isDarkMode && { color: '#CCCCCC' }]}
													>
														🏃{' '}
														{Array.from(motions)
															.map((m) =>
																m === 'stationary'
																	? 'Still'
																	: m === 'walking'
																		? 'Gehen'
																		: m === 'driving'
																			? 'Fahren'
																			: m
															)
															.join('+')}
													</Text>
												</View>
											)}
											{connections.size > 0 && (
												<View
													style={[
														styles.metadataTag,
														styles.aggregatedTag,
														isDarkMode && { backgroundColor: '#2A2A2A' },
													]}
												>
													<Text
														style={[styles.metadataTagText, isDarkMode && { color: '#CCCCCC' }]}
													>
														🌐{' '}
														{Array.from(connections)
															.map((c) =>
																c === 'wifi' ? 'WiFi' : c === 'cellular' ? 'Mobil' : 'Offline'
															)
															.join('+')}
													</Text>
												</View>
											)}
											{accuracyLevels.size > 0 && (
												<View
													style={[
														styles.metadataTag,
														styles.aggregatedTag,
														isDarkMode && { backgroundColor: '#2A2A2A' },
													]}
												>
													<Text
														style={[styles.metadataTagText, isDarkMode && { color: '#CCCCCC' }]}
													>
														📍 {Array.from(accuracyLevels).join(', ')}
													</Text>
												</View>
											)}
											{hasBattery && (
												<View
													style={[
														styles.metadataTag,
														styles.aggregatedTag,
														isDarkMode && { backgroundColor: '#2A2A2A' },
													]}
												>
													<Text
														style={[styles.metadataTagText, isDarkMode && { color: '#CCCCCC' }]}
													>
														🔋 Verfügbar
													</Text>
												</View>
											)}
										</View>
									);
								})()}
							</View>
						)}

						{/* Adressinformationen anzeigen */}
						{item.addresses.size > 0 && (
							<View style={[styles.addressContainer, isDarkMode && { borderTopColor: '#333333' }]}>
								<Text style={[styles.addressTitle, isDarkMode && { color: '#AAAAAA' }]}>
									Adresse:
								</Text>
								<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
									{getPrimaryAddress(item)}
								</Text>
								{item.addresses.size > 1 && (
									<Text style={[styles.addressCount, isDarkMode && { color: '#888888' }]}>
										+{item.addresses.size - 1} weitere Adressen
									</Text>
								)}
							</View>
						)}
					</View>
				</Pressable>

				<Pressable
					style={({ pressed }) => [styles.deleteIconButton, pressed && { opacity: 0.5 }]}
					onPress={(e) => handleDelete(item, e)}
				>
					<FontAwesome name="trash-o" size={20} color={colors.error || '#F44336'} />
				</Pressable>
			</View>
		);
	};

	return (
		<FlatList
			data={[...consolidatedLocations].reverse()}
			renderItem={renderItem}
			keyExtractor={(item, index) => `consolidated-${item.startTimestamp}-${index}`}
			contentContainerStyle={[styles.listContent, isDarkMode && { backgroundColor: '#121212' }]}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<FontAwesome name="map-marker" size={48} color={isDarkMode ? '#444444' : '#ccc'} />
					<Text style={[styles.emptyText, isDarkMode && { color: '#AAAAAA' }]}>
						Keine Standortdaten vorhanden
					</Text>
					<Text style={[styles.emptySubtext, isDarkMode && { color: '#777777' }]}>
						Starte das Tracking, um deine Bewegungen aufzuzeichnen
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
	addressContainer: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: '#eee',
	},
	addressTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#666',
		marginBottom: 4,
	},
	addressText: {
		fontSize: 14,
		color: '#444',
		marginBottom: 2,
	},
	addressCount: {
		fontSize: 12,
		color: '#888',
		fontStyle: 'italic',
	},
	itemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'white',
		borderRadius: 12,
		marginBottom: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	item: {
		flex: 1,
		flexDirection: 'row',
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
	date: {
		fontSize: 14,
		fontWeight: 'bold',
	},
	timeRange: {
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
	detailsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	detailText: {
		fontSize: 12,
		color: '#666',
		marginRight: 12,
	},
	metadataContainer: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: '#f0f0f0',
	},
	metadataRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 4,
	},
	metadataTag: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		marginRight: 6,
		marginBottom: 4,
	},
	aggregatedTag: {
		backgroundColor: '#F5F5F5',
	},
	metadataTagText: {
		fontSize: 10,
		fontWeight: '600',
		color: '#333',
	},
	arrowContainer: {
		justifyContent: 'center',
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
	deleteIconButton: {
		padding: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
