import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Alert } from 'react-native';

import { useTheme } from '~/utils/themeContext';
import { pickAndImportFiles } from '~/services/importService';
import { useLibraryStore } from '~/stores/libraryStore';

export function ImportButton() {
	const { colors } = useTheme();
	const [importing, setImporting] = useState(false);
	const loadAll = useLibraryStore((s) => s.loadAll);

	const handleImport = async () => {
		if (importing) return;
		setImporting(true);
		try {
			const songs = await pickAndImportFiles();
			if (songs.length > 0) {
				await loadAll();
				Alert.alert('Importiert', `${songs.length} Song${songs.length > 1 ? 's' : ''} importiert.`);
			}
		} catch (error) {
			console.error('Import failed:', error);
			Alert.alert('Fehler', 'Beim Import ist ein Fehler aufgetreten.');
		} finally {
			setImporting(false);
		}
	};

	return (
		<Pressable onPress={handleImport} disabled={importing} style={{ padding: 8 }}>
			<Ionicons name={importing ? 'hourglass' : 'add'} size={28} color={colors.primary} />
		</Pressable>
	);
}
