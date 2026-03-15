import { FontAwesome } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
	StyleSheet,
	View,
	TouchableOpacity,
	Text,
	Modal,
	TouchableWithoutFeedback,
	ScrollView,
} from 'react-native';

import { getDefaultInterval } from '../utils/locationService';
import { useTheme } from '../utils/themeContext';

export interface TrackingInterval {
	label: string;
	value: number;
	description: string;
}

interface TrackingControlsProps {
	isTracking: boolean;
	onStartTracking: (interval: number) => void;
	onStopTracking: () => void;
	locationCount: number;
	selectedInterval: number;
	isDarkMode?: boolean;
}

export const TRACKING_INTERVALS: TrackingInterval[] = [
	// Sortierung: Längste Intervalle zuerst, Spaziergang am Ende
	{
		label: '🌙 Alle 6 Stunden',
		value: 6 * 60 * 60 * 1000, // 6 Stunden
		description: 'Tagesüberblick - Sehr geringer Akkuverbrauch',
	},
	{
		label: '📅 Alle 3 Stunden',
		value: 3 * 60 * 60 * 1000, // 3 Stunden
		description: 'Langzeit-Tracking - Minimaler Akkuverbrauch',
	},
	{
		label: '⏰ Stündlich',
		value: 60 * 60 * 1000, // 1 Stunde
		description: 'Grober Überblick - Geringer Akkuverbrauch',
	},
	{
		label: '🚗 Auto/Fahrrad',
		value: 5 * 60 * 1000, // 5 Minuten
		description: 'Für Fahrten - Moderate Genauigkeit (~12 Punkte/h)',
	},
	// SPAZIERGANG-MODI - Am Ende für schnellen Zugriff
	{
		label: '🏃 Spaziergang Normal',
		value: 60 * 1000, // 1 Minute
		description: 'Gute Balance - Mittlere Präzision (~60 Punkte/h)',
	},
	{
		label: '🚶 Spaziergang Detailliert',
		value: 30 * 1000, // 30 Sekunden
		description: 'Jede Straße erfassen - Höchste Präzision (~120 Punkte/h)',
	},
];

export const TrackingControls: React.FC<TrackingControlsProps> = ({
	isTracking,
	onStartTracking,
	onStopTracking,
	locationCount,
	selectedInterval,
	isDarkMode = false,
}) => {
	const { colors } = useTheme();
	const [showIntervalModal, setShowIntervalModal] = useState(false);
	const [defaultInterval, setDefaultInterval] = useState<number | null>(null);

	const selectedIntervalObj =
		TRACKING_INTERVALS.find((interval) => interval.value === selectedInterval) ||
		TRACKING_INTERVALS[0];

	// Lade den Standard-Intervall beim Start
	useEffect(() => {
		loadDefaultInterval();
	}, []);

	// Lade den Standard-Intervall mit der neuen Funktion
	const loadDefaultInterval = async () => {
		try {
			const interval = await getDefaultInterval();
			if (interval !== null) {
				setDefaultInterval(interval);
			}
		} catch (error) {
			console.error('Fehler beim Laden des Standard-Intervalls:', error);
		}
	};

	const handleStartTracking = async () => {
		if (isTracking) return;

		// Prüfe, ob ein Standard-Intervall festgelegt ist
		try {
			const interval = await getDefaultInterval();

			if (interval !== null) {
				// Wenn ein Standard-Intervall festgelegt ist, verwende diesen ohne Modal anzuzeigen
				onStartTracking(interval);
			} else {
				// Wenn kein Standard-Intervall festgelegt ist, zeige das Modal an
				setShowIntervalModal(true);
			}
		} catch (error) {
			console.error('Fehler beim Laden des Standard-Intervalls:', error);
			// Im Fehlerfall zeige das Modal an
			setShowIntervalModal(true);
		}
	};

	const handleSelectInterval = (interval: number) => {
		setShowIntervalModal(false);
		if (!isTracking) {
			onStartTracking(interval);
		} else {
			// Wenn bereits am Tracken, stoppe und starte neu mit neuem Intervall
			onStopTracking();
			setTimeout(() => {
				onStartTracking(interval);
			}, 500);
		}
	};
	return (
		<>
			{/* Quick-Switch Button - Immer sichtbar */}
			<TouchableOpacity
				style={[
					styles.quickSwitchButton,
					{ borderColor: colors.primary },
					isDarkMode && {
						backgroundColor: '#1E1E1E',
						borderColor: colors.primary,
					},
				]}
				onPress={() => setShowIntervalModal(true)}
			>
				<View style={styles.quickSwitchContent}>
					<Text style={[styles.quickSwitchLabel, isDarkMode && { color: '#AAAAAA' }]}>
						Tracking-Modus
					</Text>
					<View style={styles.quickSwitchValue}>
						<Text
							style={[styles.quickSwitchModeText, isDarkMode && { color: '#FFFFFF' }]}
							numberOfLines={1}
						>
							{selectedIntervalObj.label}
						</Text>
						<FontAwesome
							name="exchange"
							size={16}
							color={colors.primary}
							style={{ marginLeft: 8 }}
						/>
					</View>
				</View>
			</TouchableOpacity>

			{/* Aktuelles Intervall anzeigen wenn Tracking aktiv */}
			{isTracking && (
				<View
					style={[
						styles.activeTrackingInfo,
						isDarkMode && {
							backgroundColor: '#1E1E1E',
						},
					]}
				>
					<FontAwesome name="circle" size={8} color={colors.primary} style={{ marginRight: 8 }} />
					<Text
						style={[
							styles.activeTrackingText,
							{ color: colors.primary },
							isDarkMode && { color: colors.primary },
						]}
					>
						Tracking aktiv
					</Text>
				</View>
			)}

			{isTracking ? (
				<TouchableOpacity style={[styles.button, styles.stopButton]} onPress={onStopTracking}>
					<FontAwesome name="stop" size={20} color="white" />
					<Text style={styles.buttonText}>Tracking stoppen</Text>
				</TouchableOpacity>
			) : (
				<TouchableOpacity
					style={[styles.button, { backgroundColor: colors.primary }]}
					onPress={handleStartTracking}
				>
					<FontAwesome name="play" size={20} color="white" />
					<Text style={styles.buttonText}>Tracking starten</Text>
				</TouchableOpacity>
			)}

			{/* Interval Selection Modal */}
			<Modal
				visible={showIntervalModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowIntervalModal(false)}
			>
				<TouchableWithoutFeedback onPress={() => setShowIntervalModal(false)}>
					<View style={styles.modalOverlay}>
						<TouchableWithoutFeedback>
							<View
								style={[
									styles.modalContent,
									isDarkMode && {
										backgroundColor: '#1E1E1E',
										shadowColor: '#000000',
										shadowOpacity: 0.5,
									},
								]}
							>
								<Text style={[styles.modalTitle, isDarkMode && { color: '#FFFFFF' }]}>
									{selectedIntervalObj.label}
								</Text>
								<Text style={[styles.modalSubtitle, isDarkMode && { color: '#AAAAAA' }]}>
									{isTracking ? 'Tracking läuft - Modus wechseln?' : 'Tracking-Modus wählen'}
								</Text>

								<ScrollView
									style={styles.modalScrollView}
									showsVerticalScrollIndicator={false}
									bounces={false}
								>
									{TRACKING_INTERVALS.map((interval) => {
										const isActive = interval.value === selectedInterval;
										return (
											<TouchableOpacity
												key={interval.value}
												style={[
													styles.intervalOption,
													isActive && styles.intervalOptionActive,
													isDarkMode && {
														borderColor: isActive ? colors.primary : '#333333',
														backgroundColor: isActive ? '#1a3a1a' : '#2A2A2A',
													},
												]}
												onPress={() => handleSelectInterval(interval.value)}
											>
												<View style={styles.intervalHeader}>
													<Text
														style={[
															styles.intervalLabel,
															isDarkMode && { color: '#FFFFFF' },
															isActive && [styles.intervalLabelActive, { color: colors.primary }],
														]}
													>
														{interval.label}
													</Text>
													{isActive && (
														<FontAwesome name="check-circle" size={20} color={colors.primary} />
													)}
												</View>
											</TouchableOpacity>
										);
									})}
								</ScrollView>

								<TouchableOpacity
									style={styles.cancelButton}
									onPress={() => setShowIntervalModal(false)}
								>
									<Text style={[styles.cancelButtonText, isDarkMode && { color: '#AAAAAA' }]}>
										Abbrechen
									</Text>
								</TouchableOpacity>
							</View>
						</TouchableWithoutFeedback>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	quickSwitchButton: {
		backgroundColor: 'white',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 2,
		// borderColor set dynamically via colors.primary
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
	},
	quickSwitchContent: {
		flexDirection: 'column',
	},
	quickSwitchLabel: {
		fontSize: 12,
		color: '#666',
		fontWeight: '600',
		marginBottom: 4,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	quickSwitchValue: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	quickSwitchModeText: {
		fontSize: 18,
		fontWeight: 'bold',
		flex: 1,
	},
	activeTrackingInfo: {
		backgroundColor: '#E8F5E9',
		borderRadius: 8,
		padding: 10,
		marginBottom: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	activeTrackingText: {
		fontSize: 14,
		// color set dynamically via colors.primary
		fontWeight: '600',
	},
	intervalContainer: {
		backgroundColor: 'white',
		borderRadius: 8,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	statsLabel: {
		fontSize: 14,
		color: '#666',
		marginBottom: 4,
	},
	statsValue: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 18,
		paddingHorizontal: 24,
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 4,
		minHeight: 56,
	},
	buttonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 17,
		marginLeft: 10,
	},
	startButton: {
		// backgroundColor set dynamically via colors.primary
	},
	stopButton: {
		backgroundColor: '#F44336',
	},
	clearButton: {
		backgroundColor: '#607D8B',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: 'white',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		width: '100%',
		maxHeight: '80%',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	modalSubtitle: {
		fontSize: 14,
		color: '#666',
		marginBottom: 16,
		textAlign: 'center',
	},
	modalScrollView: {
		maxHeight: 400,
	},
	intervalOption: {
		borderWidth: 2,
		borderColor: '#e0e0e0',
		borderRadius: 8,
		padding: 16,
		marginBottom: 10,
		backgroundColor: 'transparent',
	},
	intervalOptionActive: {
		// borderColor and backgroundColor set dynamically
		backgroundColor: '#E8F5E9',
	},
	intervalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	intervalLabel: {
		fontSize: 17,
		fontWeight: '600',
	},
	intervalLabelActive: {
		// color set dynamically via colors.primary
		fontWeight: 'bold',
	},
	cancelButton: {
		marginTop: 8,
		paddingVertical: 12,
		alignItems: 'center',
	},
	cancelButtonText: {
		fontSize: 16,
		color: '#666',
	},
});
