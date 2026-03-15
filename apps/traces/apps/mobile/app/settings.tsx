import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
	StyleSheet,
	View,
	Text,
	Switch,
	SafeAreaView,
	ScrollView,
	TouchableOpacity,
	Modal,
	TouchableWithoutFeedback,
	Alert,
} from 'react-native';

import { PhotoImportModal } from '~/components/PhotoImportModal';
import { ThemeVariantPicker } from '~/components/ThemeVariantPicker';
import { ThemeWrapper } from '~/components/ThemeWrapper';
import { TRACKING_INTERVALS } from '~/components/TrackingControls';
import {
	saveDefaultInterval,
	getDefaultInterval,
	SAVE_ADDRESS_KEY,
	getAccuracyLevel,
	saveAccuracyLevel,
	AccuracyLevel,
	accuracyDescriptions,
	clearLocationHistory,
} from '~/utils/locationService';
import { syncLocations, getLastSyncTimestamp } from '~/utils/syncService';
import { getAuthToken } from '~/utils/apiClient';
import { useTheme } from '~/utils/themeContext';

// Keine Konstanten-Definition mehr notwendig, da sie aus locationService importiert werden

export default function SettingsScreen() {
	const [saveAddressEnabled, setSaveAddressEnabled] = useState(true);
	const [defaultInterval, setDefaultInterval] = useState<number | null>(null);
	const [showIntervalModal, setShowIntervalModal] = useState(false);
	const [showAccuracyModal, setShowAccuracyModal] = useState(false);
	const [showPhotoImportModal, setShowPhotoImportModal] = useState(false);
	const [accuracyLevel, setAccuracyLevel] = useState<AccuracyLevel>(AccuracyLevel.Balanced);
	const [isSyncing, setIsSyncing] = useState(false);
	const [lastSyncText, setLastSyncText] = useState<string>('Noch nie');
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	// Lade die Einstellungen beim Start
	useEffect(() => {
		loadSettings();
	}, []);

	// Lade die Einstellungen aus dem AsyncStorage
	const loadSettings = async () => {
		try {
			const savedAddressValue = await AsyncStorage.getItem(SAVE_ADDRESS_KEY);
			// Wenn kein Wert gespeichert ist, verwende true als Standard (opt-in)
			setSaveAddressEnabled(savedAddressValue === null ? true : savedAddressValue === 'true');

			// Lade den Standard-Intervall
			const interval = await getDefaultInterval();
			setDefaultInterval(interval);

			// Lade die Genauigkeitseinstellung
			const accuracy = await getAccuracyLevel();
			setAccuracyLevel(accuracy);

			// Lade Sync-Status
			const token = await getAuthToken();
			setIsLoggedIn(!!token);
			const lastSync = await getLastSyncTimestamp();
			if (lastSync) {
				const date = new Date(lastSync);
				setLastSyncText(
					date.toLocaleDateString('de-DE') +
						' ' +
						date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
				);
			}
		} catch (error) {
			console.error('Fehler beim Laden der Einstellungen:', error);
		}
	};

	// Speichere die Einstellungen im AsyncStorage
	const saveSetting = async (key: string, value: boolean) => {
		try {
			await AsyncStorage.setItem(key, value.toString());
		} catch (error) {
			console.error('Fehler beim Speichern der Einstellungen:', error);
		}
	};

	// Toggle-Handler für die Adress-Speicherung
	const toggleSaveAddress = () => {
		const newValue = !saveAddressEnabled;
		setSaveAddressEnabled(newValue);
		saveSetting(SAVE_ADDRESS_KEY, newValue);
	};

	// Handler für die Auswahl des Standardintervalls
	const handleSelectInterval = async (interval: number | null) => {
		setDefaultInterval(interval);
		setShowIntervalModal(false);

		// Speichern des Intervalls
		await saveDefaultInterval(interval);
	};

	// Handler für die Auswahl der Genauigkeit
	const handleSelectAccuracy = async (level: AccuracyLevel) => {
		setAccuracyLevel(level);
		setShowAccuracyModal(false);

		// Speichern der Genauigkeitseinstellung
		await saveAccuracyLevel(level);
	};

	// Formatiere den Intervalltext
	const getIntervalText = () => {
		if (defaultInterval === null) {
			return 'Nicht festgelegt';
		}
		const selectedInterval = TRACKING_INTERVALS.find(
			(interval) => interval.value === defaultInterval
		);
		return selectedInterval ? selectedInterval.label : 'Nicht festgelegt';
	};

	// Hole die Beschreibung für die aktuelle Genauigkeitsstufe
	const getAccuracyText = () => {
		return accuracyDescriptions[accuracyLevel] || 'Mittel (Standard)';
	};

	// Handler für das Löschen des Verlaufs
	const handleClearHistory = async () => {
		Alert.alert(
			'Verlauf löschen',
			'Möchtest du wirklich deinen gesamten Standortverlauf löschen?',
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: async () => {
						await clearLocationHistory();
						Alert.alert('Erfolg', 'Standortverlauf wurde gelöscht.');
					},
				},
			]
		);
	};

	const { isDarkMode, toggleTheme, themeVariant, setThemeVariant, colors } = useTheme();

	// Dynamic styles based on theme
	const getThemeStyles = () => ({
		container: {
			flex: 1,
			backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
		},
		section: {
			backgroundColor: isDarkMode ? '#1E1E1E' : 'white',
			shadowColor: isDarkMode ? '#000' : '#000',
			shadowOpacity: isDarkMode ? 0.3 : 0.1,
		},
		sectionTitle: {
			color: isDarkMode ? '#E0E0E0' : '#333',
		},
		settingTitle: {
			color: isDarkMode ? '#E0E0E0' : '#333',
		},
		settingDescription: {
			color: isDarkMode ? '#A0A0A0' : '#666',
		},
		infoText: {
			color: isDarkMode ? '#A0A0A0' : '#666',
		},
		valueContainer: {
			backgroundColor: isDarkMode ? '#2A2A2A' : '#f0f0f0',
		},
		valueText: {
			color: isDarkMode ? '#E0E0E0' : '#333',
		},
		modalContent: {
			backgroundColor: isDarkMode ? '#1E1E1E' : 'white',
		},
		modalTitle: {
			color: isDarkMode ? '#E0E0E0' : '#333',
		},
		modalDescription: {
			color: isDarkMode ? '#A0A0A0' : '#666',
		},
		intervalOption: {
			backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5',
		},
		selectedInterval: {
			backgroundColor: isDarkMode ? '#3A3A7A' : '#e0f0ff',
			borderColor: isDarkMode ? '#6366f1' : '#4630EB',
		},
		intervalLabel: {
			color: isDarkMode ? '#E0E0E0' : '#333',
		},
		intervalDescription: {
			color: isDarkMode ? '#A0A0A0' : '#666',
		},
	});

	const themeStyles = getThemeStyles();

	return (
		<ThemeWrapper>
			<SafeAreaView style={[styles.container, themeStyles.container]}>
				<ScrollView>
					<View style={[styles.section, themeStyles.section]}>
						<Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>Erscheinungsbild</Text>

						<View style={styles.settingItem}>
							<View style={styles.settingTextContainer}>
								<Text style={[styles.settingTitle, themeStyles.settingTitle]}>Dark Mode</Text>
								<Text style={[styles.settingDescription, themeStyles.settingDescription]}>
									Wechsle zwischen hellem und dunklem Erscheinungsbild.
								</Text>
							</View>
							<TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
								<FontAwesome
									name={isDarkMode ? 'moon-o' : 'sun-o'}
									size={24}
									color={isDarkMode ? '#FFFFFF' : colors.primary}
								/>
							</TouchableOpacity>
						</View>
					</View>

					<View style={[styles.section, themeStyles.section]}>
						<Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>Farbschema</Text>
						<Text
							style={[
								styles.settingDescription,
								themeStyles.settingDescription,
								{ marginBottom: 16 },
							]}
						>
							Wähle ein Farbschema für die App.
						</Text>
						<ThemeVariantPicker
							selectedVariant={themeVariant}
							onChange={setThemeVariant}
							isDarkMode={isDarkMode}
						/>
					</View>

					<View style={[styles.section, themeStyles.section]}>
						<Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>Datenschutz</Text>

						<View style={styles.settingItem}>
							<View style={styles.settingTextContainer}>
								<Text style={[styles.settingTitle, themeStyles.settingTitle]}>
									Adressen speichern
								</Text>
								<Text style={[styles.settingDescription, themeStyles.settingDescription]}>
									Wenn aktiviert, werden zu jedem Standort die entsprechenden Adressinformationen
									(Stadt, Straße, Hausnummer) gespeichert.
								</Text>
							</View>
							<Switch
								value={saveAddressEnabled}
								onValueChange={toggleSaveAddress}
								trackColor={{ false: '#767577', true: isDarkMode ? '#6366f1' : '#81b0ff' }}
								thumbColor={
									saveAddressEnabled
										? isDarkMode
											? '#8F90FB'
											: '#4630EB'
										: isDarkMode
											? '#d0d0d0'
											: '#f4f3f4'
								}
								ios_backgroundColor={isDarkMode ? '#3A3A3A' : '#eaeaea'}
							/>
						</View>
					</View>

					<View style={[styles.section, themeStyles.section]}>
						<Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>
							Tracking-Einstellungen
						</Text>

						<TouchableOpacity style={styles.settingItem} onPress={() => setShowIntervalModal(true)}>
							<View style={styles.settingTextContainer}>
								<Text style={[styles.settingTitle, themeStyles.settingTitle]}>
									Standard-Intervall
								</Text>
								<Text style={[styles.settingDescription, themeStyles.settingDescription]}>
									Wenn festgelegt, wird dieser Intervall automatisch verwendet, ohne dass ein Modal
									angezeigt wird.
								</Text>
								<View style={styles.currentSettingContainer}>
									<FontAwesome
										name="clock-o"
										size={14}
										color={colors.primary}
										style={styles.settingIcon}
									/>
									<Text style={[styles.currentSettingText, { color: colors.primary }]}>
										{getIntervalText()}
									</Text>
								</View>
							</View>
							<FontAwesome name="chevron-right" size={16} color={isDarkMode ? '#666666' : '#999'} />
						</TouchableOpacity>

						<TouchableOpacity style={styles.settingItem} onPress={() => setShowAccuracyModal(true)}>
							<View style={styles.settingTextContainer}>
								<Text style={[styles.settingTitle, themeStyles.settingTitle]}>Genauigkeit</Text>
								<Text style={[styles.settingDescription, themeStyles.settingDescription]}>
									Bestimmt die Präzision der Standortermittlung. Höhere Genauigkeit verbraucht mehr
									Akku.
								</Text>
								<View style={styles.currentSettingContainer}>
									<FontAwesome
										name="crosshairs"
										size={14}
										color={colors.primary}
										style={styles.settingIcon}
									/>
									<Text style={[styles.currentSettingText, { color: colors.primary }]}>
										{getAccuracyText()}
									</Text>
								</View>
							</View>
							<FontAwesome name="chevron-right" size={16} color={isDarkMode ? '#666666' : '#999'} />
						</TouchableOpacity>
					</View>

					<View style={[styles.section, themeStyles.section]}>
						<Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>Synchronisierung</Text>

						<TouchableOpacity
							style={styles.settingItem}
							onPress={async () => {
								if (isSyncing) return;
								setIsSyncing(true);
								try {
									const result = await syncLocations();
									if (result) {
										Alert.alert(
											'Sync abgeschlossen',
											`${result.synced} Standorte synchronisiert${result.duplicates > 0 ? ` (${result.duplicates} bereits vorhanden)` : ''}.`
										);
										const lastSync = await getLastSyncTimestamp();
										if (lastSync) {
											const date = new Date(lastSync);
											setLastSyncText(
												date.toLocaleDateString('de-DE') +
													' ' +
													date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
											);
										}
									} else {
										Alert.alert('Hinweis', 'Sync nicht möglich. Bitte anmelden.');
									}
								} catch (error: any) {
									Alert.alert('Fehler', error.message || 'Sync fehlgeschlagen.');
								} finally {
									setIsSyncing(false);
								}
							}}
							disabled={isSyncing}
						>
							<View style={styles.settingTextContainer}>
								<Text style={[styles.settingTitle, { color: colors.primary }]}>
									{isSyncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
								</Text>
								<Text style={[styles.settingDescription, themeStyles.settingDescription]}>
									Standortdaten mit dem Server synchronisieren.{'\n'}
									Letzter Sync: {lastSyncText}
								</Text>
								{!isLoggedIn && (
									<Text
										style={[
											styles.settingDescription,
											{ color: isDarkMode ? '#FF6B6B' : '#F44336', marginTop: 4 },
										]}
									>
										Nicht angemeldet - Sync nicht verfügbar
									</Text>
								)}
							</View>
							<FontAwesome name="refresh" size={20} color={colors.primary} />
						</TouchableOpacity>
					</View>

					<View style={[styles.section, themeStyles.section]}>
						<Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>Daten</Text>

						<TouchableOpacity
							style={styles.settingItem}
							onPress={() => setShowPhotoImportModal(true)}
						>
							<View style={styles.settingTextContainer}>
								<Text style={[styles.settingTitle, { color: colors.primary }]}>
									📸 Fotos importieren
								</Text>
								<Text style={[styles.settingDescription, themeStyles.settingDescription]}>
									GPS-Daten aus Fotos extrahieren und als Location-Einträge importieren.
								</Text>
							</View>
							<FontAwesome name="camera" size={20} color={colors.primary} />
						</TouchableOpacity>

						<TouchableOpacity style={styles.settingItem} onPress={handleClearHistory}>
							<View style={styles.settingTextContainer}>
								<Text style={[styles.settingTitle, { color: isDarkMode ? '#FF6B6B' : '#F44336' }]}>
									Verlauf löschen
								</Text>
								<Text style={[styles.settingDescription, themeStyles.settingDescription]}>
									Löscht alle aufgezeichneten Standortdaten unwiderruflich.
								</Text>
							</View>
							<FontAwesome name="trash-o" size={20} color={isDarkMode ? '#FF6B6B' : '#F44336'} />
						</TouchableOpacity>
					</View>

					<View style={[styles.section, themeStyles.section]}>
						<Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>Erweitert</Text>

						<Link href="/logs" asChild>
							<TouchableOpacity style={styles.settingItem}>
								<View style={styles.settingTextContainer}>
									<Text style={[styles.settingTitle, themeStyles.settingTitle]}>Logs anzeigen</Text>
									<Text style={[styles.settingDescription, themeStyles.settingDescription]}>
										Zeige App-Logs und Debug-Informationen an.
									</Text>
								</View>
								<FontAwesome
									name="chevron-right"
									size={16}
									color={isDarkMode ? '#666666' : '#999'}
								/>
							</TouchableOpacity>
						</Link>
					</View>

					<View style={[styles.section, themeStyles.section]}>
						<Text style={[styles.sectionTitle, themeStyles.sectionTitle]}>Über die App</Text>
						<View style={styles.infoContainer}>
							<Text style={[styles.infoText, themeStyles.infoText]}>
								Diese App zeichnet deinen Standortverlauf auf und ermöglicht es dir, deine
								Bewegungen nachzuverfolgen.
							</Text>
							<Text style={[styles.infoText, themeStyles.infoText]}>Version 1.0.0</Text>
						</View>
					</View>
				</ScrollView>
				<StatusBar style={isDarkMode ? 'light' : 'dark'} />

				{/* Photo Import Modal */}
				<PhotoImportModal
					visible={showPhotoImportModal}
					onClose={() => setShowPhotoImportModal(false)}
					onImportComplete={(count) => {
						console.log(`${count} Fotos importiert`);
						// Optional: Reload location history or trigger update
					}}
				/>

				{/* Modal für die Intervallauswahl */}
				<Modal
					visible={showIntervalModal}
					transparent
					animationType="fade"
					onRequestClose={() => setShowIntervalModal(false)}
				>
					<TouchableWithoutFeedback onPress={() => setShowIntervalModal(false)}>
						<View style={styles.modalOverlay}>
							<TouchableWithoutFeedback>
								<View style={[styles.modalContent, themeStyles.modalContent]}>
									<Text style={[styles.modalTitle, themeStyles.modalTitle]}>
										Standard-Intervall wählen
									</Text>
									<Text style={[styles.modalDescription, themeStyles.modalDescription]}>
										Wähle einen Intervall, der standardmäßig verwendet werden soll:
									</Text>

									{TRACKING_INTERVALS.map((interval) => (
										<TouchableOpacity
											key={interval.value}
											style={[
												styles.intervalOption,
												themeStyles.intervalOption,
												defaultInterval === interval.value && styles.selectedInterval,
												defaultInterval === interval.value && themeStyles.selectedInterval,
											]}
											onPress={() => handleSelectInterval(interval.value)}
										>
											<View>
												<Text style={[styles.intervalLabel, themeStyles.intervalLabel]}>
													{interval.label}
												</Text>
												<Text style={[styles.intervalDescription, themeStyles.intervalDescription]}>
													{interval.description}
												</Text>
											</View>
										</TouchableOpacity>
									))}

									<TouchableOpacity
										style={[
											styles.intervalOption,
											themeStyles.intervalOption,
											defaultInterval === null && styles.selectedInterval,
											defaultInterval === null && themeStyles.selectedInterval,
										]}
										onPress={() => handleSelectInterval(null)}
									>
										<View>
											<Text style={[styles.intervalLabel, themeStyles.intervalLabel]}>
												Immer nachfragen
											</Text>
											<Text style={[styles.intervalDescription, themeStyles.intervalDescription]}>
												Zeige immer das Auswahl-Modal an
											</Text>
										</View>
									</TouchableOpacity>

									<TouchableOpacity
										style={[
											styles.closeButton,
											{ backgroundColor: isDarkMode ? '#6366f1' : '#4630EB' },
										]}
										onPress={() => setShowIntervalModal(false)}
									>
										<Text style={styles.closeButtonText}>Schließen</Text>
									</TouchableOpacity>
								</View>
							</TouchableWithoutFeedback>
						</View>
					</TouchableWithoutFeedback>
				</Modal>

				{/* Modal für die Genauigkeitsauswahl */}
				<Modal
					visible={showAccuracyModal}
					transparent
					animationType="fade"
					onRequestClose={() => setShowAccuracyModal(false)}
				>
					<TouchableWithoutFeedback onPress={() => setShowAccuracyModal(false)}>
						<View style={styles.modalOverlay}>
							<TouchableWithoutFeedback>
								<View style={[styles.modalContent, themeStyles.modalContent]}>
									<Text style={[styles.modalTitle, themeStyles.modalTitle]}>
										Genauigkeit wählen
									</Text>
									<Text style={[styles.modalDescription, themeStyles.modalDescription]}>
										Wähle die gewünschte Genauigkeit für die Standortermittlung:
									</Text>

									{Object.values(AccuracyLevel).map((level) => (
										<TouchableOpacity
											key={level}
											style={[
												styles.intervalOption,
												themeStyles.intervalOption,
												accuracyLevel === level && styles.selectedInterval,
												accuracyLevel === level && themeStyles.selectedInterval,
											]}
											onPress={() => handleSelectAccuracy(level as AccuracyLevel)}
										>
											<View>
												<Text style={[styles.intervalLabel, themeStyles.intervalLabel]}>
													{level === AccuracyLevel.Balanced && '✓ '}
													{level.charAt(0).toUpperCase() + level.slice(1)}
												</Text>
												<Text style={[styles.intervalDescription, themeStyles.intervalDescription]}>
													{accuracyDescriptions[level]}
												</Text>
											</View>
										</TouchableOpacity>
									))}

									<TouchableOpacity
										style={[
											styles.closeButton,
											{ backgroundColor: isDarkMode ? '#6366f1' : '#4630EB' },
										]}
										onPress={() => setShowAccuracyModal(false)}
									>
										<Text style={styles.closeButtonText}>Schließen</Text>
									</TouchableOpacity>
								</View>
							</TouchableWithoutFeedback>
						</View>
					</TouchableWithoutFeedback>
				</Modal>
			</SafeAreaView>
		</ThemeWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	section: {
		marginVertical: 10,
		marginHorizontal: 16,
		borderRadius: 10,
		padding: 16,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
		elevation: 2,
	},
	themeToggle: {
		padding: 8,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 16,
		color: '#333',
	},
	settingItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
	},
	settingTextContainer: {
		flex: 1,
		marginRight: 16,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
		color: '#333',
	},
	settingDescription: {
		fontSize: 14,
		color: '#666',
		lineHeight: 20,
		marginBottom: 8,
	},
	currentSettingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 2,
	},
	settingIcon: {
		marginRight: 6,
	},
	currentSettingText: {
		fontSize: 14,
		fontWeight: '500',
	},
	infoContainer: {
		paddingVertical: 8,
	},
	infoText: {
		fontSize: 14,
		color: '#666',
		marginBottom: 8,
		lineHeight: 20,
	},
	valueContainer: {
		backgroundColor: '#f0f0f0',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
		minWidth: 100,
		alignItems: 'center',
	},
	valueText: {
		fontSize: 14,
		color: '#333',
		fontWeight: '500',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		backgroundColor: 'white',
		borderRadius: 12,
		padding: 20,
		width: '100%',
		maxWidth: 400,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#333',
	},
	modalDescription: {
		fontSize: 14,
		color: '#666',
		marginBottom: 16,
	},
	intervalOption: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginBottom: 8,
		backgroundColor: '#f5f5f5',
	},
	selectedInterval: {
		backgroundColor: '#e0f0ff',
		borderColor: '#4630EB',
		borderWidth: 1,
	},
	intervalLabel: {
		fontSize: 16,
		fontWeight: '500',
		color: '#333',
		marginBottom: 4,
	},
	intervalDescription: {
		fontSize: 12,
		color: '#666',
	},
	closeButton: {
		marginTop: 16,
		paddingVertical: 12,
		backgroundColor: '#4630EB',
		borderRadius: 8,
		alignItems: 'center',
	},
	closeButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '500',
	},
});
