import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Switch, ScrollView, Alert, Pressable } from 'react-native';

import { useTheme, type ThemeVariant } from '~/utils/themeContext';
import { getStorageInfo, formatFileSize } from '~/services/fileService';
import { getSongCount } from '~/services/libraryService';
import { pickAndImportFiles } from '~/services/importService';
import { useLibraryStore } from '~/stores/libraryStore';

export default function SettingsScreen() {
	const { colors, isDarkMode, toggleTheme, themeVariant, setThemeVariant } = useTheme();
	const loadAll = useLibraryStore((s) => s.loadAll);
	const [storageInfo, setStorageInfo] = useState({ musicSize: 0, artworkSize: 0, totalFiles: 0 });
	const [songCount, setSongCount] = useState(0);

	useEffect(() => {
		loadInfo();
	}, []);

	const loadInfo = async () => {
		const [storage, count] = await Promise.all([getStorageInfo(), getSongCount()]);
		setStorageInfo(storage);
		setSongCount(count);
	};

	const handleImport = async () => {
		try {
			const songs = await pickAndImportFiles();
			if (songs.length > 0) {
				await loadAll();
				await loadInfo();
				Alert.alert('Importiert', `${songs.length} Song${songs.length > 1 ? 's' : ''} importiert.`);
			}
		} catch (error) {
			Alert.alert('Fehler', 'Beim Import ist ein Fehler aufgetreten.');
		}
	};

	const variants: { key: ThemeVariant; label: string; color: string }[] = [
		{ key: 'classic', label: 'Orange', color: '#FF6B35' },
		{ key: 'ocean', label: 'Blau', color: '#2196F3' },
		{ key: 'sunset', label: 'Rot', color: '#FF6B6B' },
	];

	return (
		<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
			<Stack.Screen options={{ title: 'Einstellungen' }} />

			{/* Appearance */}
			<Text
				style={{
					fontSize: 13,
					color: colors.textSecondary,
					marginTop: 24,
					marginHorizontal: 16,
					marginBottom: 8,
					textTransform: 'uppercase',
				}}
			>
				Darstellung
			</Text>
			<View style={{ backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16 }}>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: 16,
					}}
				>
					<Text style={{ fontSize: 16, color: colors.text }}>Dark Mode</Text>
					<Switch value={isDarkMode} onValueChange={toggleTheme} />
				</View>
				<View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 16 }} />
				<View style={{ padding: 16 }}>
					<Text style={{ fontSize: 16, color: colors.text, marginBottom: 12 }}>Akzentfarbe</Text>
					<View style={{ flexDirection: 'row', gap: 12 }}>
						{variants.map((v) => (
							<Pressable
								key={v.key}
								onPress={() => setThemeVariant(v.key)}
								style={{
									width: 36,
									height: 36,
									borderRadius: 18,
									backgroundColor: v.color,
									borderWidth: themeVariant === v.key ? 3 : 0,
									borderColor: colors.text,
								}}
							/>
						))}
					</View>
				</View>
			</View>

			{/* Import */}
			<Text
				style={{
					fontSize: 13,
					color: colors.textSecondary,
					marginTop: 24,
					marginHorizontal: 16,
					marginBottom: 8,
					textTransform: 'uppercase',
				}}
			>
				Musik
			</Text>
			<View style={{ backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16 }}>
				<Pressable
					onPress={handleImport}
					style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
				>
					<Ionicons
						name="add-circle-outline"
						size={22}
						color={colors.primary}
						style={{ marginRight: 12 }}
					/>
					<Text style={{ fontSize: 16, color: colors.primary }}>Songs importieren</Text>
				</Pressable>
			</View>

			{/* Storage */}
			<Text
				style={{
					fontSize: 13,
					color: colors.textSecondary,
					marginTop: 24,
					marginHorizontal: 16,
					marginBottom: 8,
					textTransform: 'uppercase',
				}}
			>
				Speicher
			</Text>
			<View style={{ backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16 }}>
				<View style={{ padding: 16 }}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
						<Text style={{ fontSize: 15, color: colors.text }}>Songs</Text>
						<Text style={{ fontSize: 15, color: colors.textSecondary }}>{songCount}</Text>
					</View>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
						<Text style={{ fontSize: 15, color: colors.text }}>Musik</Text>
						<Text style={{ fontSize: 15, color: colors.textSecondary }}>
							{formatFileSize(storageInfo.musicSize)}
						</Text>
					</View>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
						<Text style={{ fontSize: 15, color: colors.text }}>Cover Art</Text>
						<Text style={{ fontSize: 15, color: colors.textSecondary }}>
							{formatFileSize(storageInfo.artworkSize)}
						</Text>
					</View>
				</View>
			</View>

			{/* About */}
			<Text
				style={{
					fontSize: 13,
					color: colors.textSecondary,
					marginTop: 24,
					marginHorizontal: 16,
					marginBottom: 8,
					textTransform: 'uppercase',
				}}
			>
				Info
			</Text>
			<View style={{ backgroundColor: colors.card, borderRadius: 12, marginHorizontal: 16 }}>
				<View style={{ padding: 16 }}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
						<Text style={{ fontSize: 15, color: colors.text }}>Version</Text>
						<Text style={{ fontSize: 15, color: colors.textSecondary }}>1.0.0</Text>
					</View>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
						<Text style={{ fontSize: 15, color: colors.text }}>Mukke</Text>
						<Text style={{ fontSize: 15, color: colors.textSecondary }}>Offline Music Player</Text>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}
