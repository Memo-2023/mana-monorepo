import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, FlatList, Alert, Pressable } from 'react-native';

import { LocationData, deleteLocationEntry } from '../utils/locationService';
import { useTheme } from '../utils/themeContext';

interface LocationHistoryListProps {
	locationHistory: LocationData[];
	onItemPress?: (location: LocationData) => void;
	onDelete?: () => void;
	isDarkMode?: boolean;
}

export const LocationHistoryList: React.FC<LocationHistoryListProps> = ({
	locationHistory,
	onItemPress,
	onDelete,
	isDarkMode = false,
}) => {
	const { colors } = useTheme();
	const getTimestamp = (location: LocationData): number => {
		return location.timestamps?.recordedMs || location.timestamp || 0;
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
		const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' });
		const time = date.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});
		return `${weekday}, ${time} Uhr`;
	};

	const handleDelete = async (location: LocationData, event: any) => {
		event.stopPropagation();
		Alert.alert('Eintrag löschen', 'Möchtest du diesen Standorteintrag wirklich löschen?', [
			{
				text: 'Abbrechen',
				style: 'cancel',
			},
			{
				text: 'Löschen',
				style: 'destructive',
				onPress: async () => {
					try {
						await deleteLocationEntry(location.id);
						onDelete?.();
					} catch (error) {
						Alert.alert('Fehler', 'Der Eintrag konnte nicht gelöscht werden.');
					}
				},
			},
		]);
	};

	const renderItem = ({ item, index }: { item: LocationData; index: number }) => {
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
							{locationHistory.length - index}
						</Text>
					</View>
					<View style={styles.contentContainer}>
						<View style={styles.headerRow}>
							<Text style={[styles.date, isDarkMode && { color: '#FFFFFF' }]}>
								{formatDate(getTimestamp(item))}
							</Text>
							<Text style={[styles.time, isDarkMode && { color: '#AAAAAA' }]}>
								{formatTime(getTimestamp(item))}
							</Text>
						</View>

						{/* Adressinformationen anzeigen */}
						{item.address && (
							<View
								style={[styles.addressContainer, isDarkMode && { borderBottomColor: '#333333' }]}
							>
								{/* Show formatted address if available, otherwise fallback to components */}
								{item.address.formatted ? (
									<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
										{item.address.formatted}
									</Text>
								) : (
									<>
										{item.address.components?.street && item.address.components?.houseNumber && (
											<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
												{item.address.components.street} {item.address.components.houseNumber}
											</Text>
										)}
										{item.address.components?.street && !item.address.components?.houseNumber && (
											<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
												{item.address.components.street}
											</Text>
										)}
										{item.address.components?.postalCode && item.address.components?.city && (
											<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
												{item.address.components.postalCode} {item.address.components.city}
											</Text>
										)}
										{!item.address.components?.postalCode && item.address.components?.city && (
											<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
												{item.address.components.city}
											</Text>
										)}
										{item.address.components?.country && (
											<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
												{item.address.components.country}
											</Text>
										)}
										{/* Legacy fallback */}
										{!item.address.components && (item.address as any).street && (
											<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
												{(item.address as any).street} {(item.address as any).streetNumber || ''}
											</Text>
										)}
										{!item.address.components && (item.address as any).city && (
											<Text style={[styles.addressText, isDarkMode && { color: '#DDDDDD' }]}>
												{(item.address as any).postalCode
													? `${(item.address as any).postalCode} `
													: ''}
												{(item.address as any).city}
											</Text>
										)}
									</>
								)}
							</View>
						)}

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
						{/* Basis-Informationen */}
						<View style={styles.detailsRow}>
							{item.accuracy && (
								<Text style={[styles.detailText, isDarkMode && { color: '#AAAAAA' }]}>
									Genauigkeit: {item.accuracy.toFixed(1)}m
								</Text>
							)}
							{item.speed !== undefined && item.speed !== null && (
								<Text style={[styles.detailText, isDarkMode && { color: '#AAAAAA' }]}>
									Geschwindigkeit: {(item.speed * 3.6).toFixed(1)} km/h
								</Text>
							)}
						</View>

						{/* Neue Metadaten */}
						{item.metadata && (
							<View style={[styles.metadataContainer, isDarkMode && { borderTopColor: '#333333' }]}>
								<View style={styles.metadataRow}>
									{item.metadata.source && (
										<View
											style={[
												styles.metadataTag,
												styles.sourceTag,
												isDarkMode && { backgroundColor: '#1E3A5F' },
											]}
										>
											<Text style={[styles.metadataTagText, isDarkMode && { color: '#B3D9FF' }]}>
												{item.metadata.source === 'foreground'
													? '🔵 Vordergrund'
													: item.metadata.source === 'background'
														? '🟢 Hintergrund'
														: '🟡 Manuell'}
											</Text>
										</View>
									)}
									{item.metadata.deviceMotion && item.metadata.deviceMotion !== 'unknown' && (
										<View
											style={[
												styles.metadataTag,
												styles.motionTag,
												isDarkMode && { backgroundColor: '#3A2A1E' },
											]}
										>
											<Text style={[styles.metadataTagText, isDarkMode && { color: '#E6C2A6' }]}>
												{item.metadata.deviceMotion === 'stationary'
													? '🧍 Stillstehend'
													: item.metadata.deviceMotion === 'walking'
														? '🚶 Gehend'
														: item.metadata.deviceMotion === 'driving'
															? '🚗 Fahrend'
															: '❓ Unbekannt'}
											</Text>
										</View>
									)}
									{item.metadata.connectionType && (
										<View
											style={[
												styles.metadataTag,
												styles.connectionTag,
												isDarkMode && { backgroundColor: '#3A1E4F' },
											]}
										>
											<Text style={[styles.metadataTagText, isDarkMode && { color: '#E1BEE7' }]}>
												{item.metadata.connectionType === 'wifi'
													? '📶 WiFi'
													: item.metadata.connectionType === 'cellular'
														? '📱 Mobil'
														: '❌ Offline'}
											</Text>
										</View>
									)}
								</View>

								{/* Qualitätsinformationen */}
								{item.quality && (
									<View style={styles.metadataRow}>
										<View
											style={[
												styles.metadataTag,
												styles.qualityTag,
												isDarkMode && { backgroundColor: '#1E3A1E' },
											]}
										>
											<Text style={[styles.metadataTagText, isDarkMode && { color: '#B3E5B3' }]}>
												📍 {item.quality.accuracyLevel || 'Standard'}
											</Text>
										</View>
										{item.metadata.batteryLevel && (
											<View
												style={[
													styles.metadataTag,
													styles.batteryTag,
													isDarkMode && { backgroundColor: '#4A3A1E' },
												]}
											>
												<Text style={[styles.metadataTagText, isDarkMode && { color: '#FFE0B3' }]}>
													🔋 {Math.round(item.metadata.batteryLevel * 100)}%
												</Text>
											</View>
										)}
									</View>
								)}

								{/* ID für Debugging */}
								{item.id && (
									<Text style={[styles.idText, isDarkMode && { color: '#666666' }]}>
										ID: {item.id.substring(0, 8)}...
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
			data={[...locationHistory].reverse()}
			renderItem={renderItem}
			keyExtractor={(item, index) => `location-${item.id || getTimestamp(item)}-${index}`}
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
		marginBottom: 8,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	addressText: {
		fontSize: 14,
		color: '#444',
		marginBottom: 2,
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
		marginBottom: 8,
	},
	date: {
		fontSize: 14,
		fontWeight: 'bold',
	},
	time: {
		fontSize: 14,
		color: '#666',
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
	sourceTag: {
		backgroundColor: '#E3F2FD',
	},
	connectionTag: {
		backgroundColor: '#F3E5F5',
	},
	motionTag: {
		backgroundColor: '#FFF8E1',
	},
	qualityTag: {
		backgroundColor: '#E8F5E8',
	},
	batteryTag: {
		backgroundColor: '#FFF3E0',
	},
	metadataTagText: {
		fontSize: 10,
		fontWeight: '600',
		color: '#333',
	},
	idText: {
		fontSize: 9,
		color: '#999',
		fontFamily: 'monospace',
		marginTop: 4,
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
