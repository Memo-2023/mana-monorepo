import React, { useState } from 'react';
import { View, TextInput, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';
import { Text } from '~/components/ui/Text';
import { ThemedButton } from '~/components/ui/ThemedButton';
import { createSpace } from '~/services/supabaseService';

interface SpaceCreatorProps {
	visible: boolean;
	onClose: () => void;
	onCreated: (spaceId: string) => void;
}

export const SpaceCreator: React.FC<SpaceCreatorProps> = ({ visible, onClose, onCreated }) => {
	const { isDark } = useTheme();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Funktion zum Erstellen des Space
	const handleCreateSpace = async () => {
		if (!name.trim()) {
			setError('Der Name darf nicht leer sein.');
			return;
		}

		try {
			setCreating(true);
			setError(null);

			const { data, error: createError } = await createSpace(
				name.trim(),
				description.trim() || undefined
			);

			if (createError) {
				setError(`Fehler beim Erstellen des Space: ${createError.message || createError}`);
				return;
			}

			if (data) {
				// Callback für erfolgreiche Erstellung
				onCreated(data.id);
				// Formular zurücksetzen
				setName('');
				setDescription('');
				// Modal schließen
				onClose();
			}
		} catch (err: any) {
			setError(`Unerwarteter Fehler: ${err.message}`);
		} finally {
			setCreating(false);
		}
	};

	// Formular zurücksetzen, wenn das Modal geschlossen wird
	const handleClose = () => {
		setName('');
		setDescription('');
		setError(null);
		onClose();
	};

	return (
		<Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose}>
			<TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
				<TouchableOpacity
					activeOpacity={1}
					style={[styles.modalContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
					// Verhindert, dass Klicks auf den Inhalt das Modal schließen
					onPress={(e) => {
						e.stopPropagation();
					}}
				>
					<View style={styles.modalHeader}>
						<Text style={[styles.modalTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
							Neuen Space erstellen
						</Text>
						<TouchableOpacity onPress={handleClose}>
							<Ionicons name="close" size={24} color={isDark ? '#d1d5db' : '#4b5563'} />
						</TouchableOpacity>
					</View>

					{error && (
						<View
							style={[styles.errorContainer, { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' }]}
						>
							<Text style={{ color: isDark ? '#fecaca' : '#991b1b' }}>{error}</Text>
						</View>
					)}

					<View style={styles.formGroup}>
						<Text style={[styles.label, { color: isDark ? '#d1d5db' : '#4b5563' }]}>Name</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: isDark ? '#374151' : '#f9fafb',
									color: isDark ? '#f9fafb' : '#111827',
									borderColor: isDark ? '#4b5563' : '#d1d5db',
								},
							]}
							value={name}
							onChangeText={setName}
							placeholder="Space-Name"
							placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
							autoFocus
						/>
					</View>

					<View style={styles.formGroup}>
						<Text style={[styles.label, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
							Beschreibung (optional)
						</Text>
						<TextInput
							style={[
								styles.input,
								styles.textArea,
								{
									backgroundColor: isDark ? '#374151' : '#f9fafb',
									color: isDark ? '#f9fafb' : '#111827',
									borderColor: isDark ? '#4b5563' : '#d1d5db',
								},
							]}
							value={description}
							onChangeText={setDescription}
							placeholder="Beschreibung des Space"
							placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
							multiline
							numberOfLines={4}
							textAlignVertical="top"
						/>
					</View>

					<View style={styles.buttonContainer}>
						<ThemedButton
							title="Abbrechen"
							onPress={handleClose}
							variant="secondary"
							disabled={creating}
							style={{ marginRight: 8 }}
						/>
						<ThemedButton
							title={creating ? 'Erstellen...' : 'Space erstellen'}
							onPress={handleCreateSpace}
							variant="primary"
							disabled={creating || !name.trim()}
						/>
					</View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		padding: 20,
	},
	modalContent: {
		width: '100%',
		maxWidth: 500,
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	errorContainer: {
		padding: 12,
		borderRadius: 6,
		marginBottom: 16,
	},
	formGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 8,
	},
	input: {
		height: 40,
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 12,
		fontSize: 16,
	},
	textArea: {
		height: 100,
		paddingTop: 12,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 16,
	},
});
