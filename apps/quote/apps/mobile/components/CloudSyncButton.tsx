import React, { useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	Platform,
	Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuotesStore } from '../store/quotesStore';
import { CloudSyncService } from '../services/cloudSync/cloudSyncService';
import { useIsDarkMode } from '~/store/settingsStore';
import * as Haptics from 'expo-haptics';

interface CloudSyncButtonProps {
	className?: string;
}

export const CloudSyncButton: React.FC<CloudSyncButtonProps> = ({ className = '' }) => {
	const [isLoading, setIsLoading] = useState(false);
	const { exportToCloud, importFromCloud, lastSyncDate, isSyncing } = useQuotesStore();
	const isDarkMode = useIsDarkMode();

	const formatLastSyncDate = () => {
		if (!lastSyncDate) return 'Noch nie synchronisiert';

		const date = new Date(lastSyncDate);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

		if (diffInMinutes < 1) return 'Gerade eben';
		if (diffInMinutes < 60) return `Vor ${diffInMinutes} Minuten`;
		if (diffInMinutes < 1440) return `Vor ${Math.floor(diffInMinutes / 60)} Stunden`;
		return date.toLocaleDateString('de-DE');
	};

	const handleExport = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setIsLoading(true);
		try {
			const authenticated = await CloudSyncService.authenticate();
			if (!authenticated && Platform.OS === 'android') {
				Alert.alert('Authentifizierung fehlgeschlagen', 'Bitte überprüfe deine Kontoeinstellungen');
				return;
			}

			const success = await exportToCloud();

			if (Platform.OS === 'ios') {
				// On iOS, the share sheet handles the feedback
				return;
			}

			Alert.alert(
				success ? 'Export erfolgreich' : 'Export fehlgeschlagen',
				success
					? 'Deine Daten wurden erfolgreich gesichert'
					: 'Backup konnte nicht erstellt werden. Bitte versuche es erneut.'
			);
		} catch (error) {
			Alert.alert('Fehler', 'Ein Fehler ist beim Backup aufgetreten');
		} finally {
			setIsLoading(false);
		}
	};

	const handleImport = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Alert.alert(
			'Daten wiederherstellen',
			'Möchtest du deine gespeicherten Daten wiederherstellen? Neue Favoriten werden hinzugefügt, bestehende bleiben erhalten.',
			[
				{
					text: 'Abbrechen',
					style: 'cancel',
				},
				{
					text: 'Wiederherstellen',
					onPress: async () => {
						setIsLoading(true);
						try {
							const success = await importFromCloud();
							Alert.alert(
								success ? 'Import erfolgreich' : 'Import fehlgeschlagen',
								success
									? 'Deine Daten wurden erfolgreich wiederhergestellt'
									: 'Daten konnten nicht wiederhergestellt werden. Bitte wähle eine gültige Backup-Datei.'
							);
						} catch (error) {
							Alert.alert('Fehler', 'Ein Fehler ist bei der Wiederherstellung aufgetreten');
						} finally {
							setIsLoading(false);
						}
					},
				},
			]
		);
	};

	return (
		<View className={className}>
			{/* Main Backup Actions */}
			<View className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl`}>
				{/* Export/Backup Button */}
				<Pressable
					onPress={handleExport}
					disabled={isLoading || isSyncing}
					className={`flex-row justify-between items-center p-4 ${
						isLoading || isSyncing ? 'opacity-50' : ''
					} border-b ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}
				>
					<View className="flex-1">
						<View className="flex-row items-center">
							<Ionicons
								name={Platform.OS === 'ios' ? 'cloud-upload' : 'cloud-upload-outline'}
								size={20}
								color={isDarkMode ? '#60A5FA' : '#3B82F6'}
								style={{ marginRight: 12 }}
							/>
							<View className="flex-1">
								<Text
									className={`${isDarkMode ? 'text-white' : 'text-black'} text-base font-medium`}
								>
									Backup erstellen
								</Text>
								<Text
									className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-xs mt-0.5`}
								>
									Sichere deine Daten in {Platform.OS === 'ios' ? 'iCloud' : 'Google Drive'}
								</Text>
							</View>
						</View>
					</View>
					{isLoading || isSyncing ? (
						<ActivityIndicator size="small" color={isDarkMode ? '#60A5FA' : '#3B82F6'} />
					) : (
						<Ionicons
							name="chevron-forward"
							size={20}
							color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
						/>
					)}
				</Pressable>

				{/* Import/Restore Button */}
				<Pressable
					onPress={handleImport}
					disabled={isLoading || isSyncing}
					className={`flex-row justify-between items-center p-4 ${
						isLoading || isSyncing ? 'opacity-50' : ''
					}`}
				>
					<View className="flex-1">
						<View className="flex-row items-center">
							<Ionicons
								name={Platform.OS === 'ios' ? 'cloud-download' : 'cloud-download-outline'}
								size={20}
								color={isDarkMode ? '#10B981' : '#059669'}
								style={{ marginRight: 12 }}
							/>
							<View className="flex-1">
								<Text
									className={`${isDarkMode ? 'text-white' : 'text-black'} text-base font-medium`}
								>
									Wiederherstellen
								</Text>
								<Text
									className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-xs mt-0.5`}
								>
									Lade dein letztes Backup
								</Text>
							</View>
						</View>
					</View>
					{isLoading || isSyncing ? (
						<ActivityIndicator size="small" color={isDarkMode ? '#10B981' : '#059669'} />
					) : (
						<Ionicons
							name="chevron-forward"
							size={20}
							color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
						/>
					)}
				</Pressable>
			</View>

			{/* Last Sync Info */}
			{lastSyncDate && (
				<View className="mt-3 flex-row items-center justify-center">
					<Ionicons
						name="checkmark-circle"
						size={14}
						color={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
					/>
					<Text className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-xs ml-1.5`}>
						Letzte Synchronisation: {formatLastSyncDate()}
					</Text>
				</View>
			)}
		</View>
	);
};
