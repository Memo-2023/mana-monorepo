import React, { useState } from 'react';
import { Modal, View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { ThemedButton } from '~/components/ui/ThemedButton';
import { deleteSpace } from '~/services/supabaseService';
import { useTheme } from '~/utils/theme/theme';

interface DeleteSpaceButtonProps {
	spaceId: string;
	spaceName: string;
	onDelete: () => void;
	variant?: 'primary' | 'secondary' | 'danger';
	iconOnly?: boolean;
}

export const DeleteSpaceButton: React.FC<DeleteSpaceButtonProps> = ({
	spaceId,
	spaceName,
	onDelete,
	variant = 'secondary',
	iconOnly = true,
}) => {
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const { mode, colors } = useTheme();
	const isDark = mode === 'dark';

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const { success, error } = await deleteSpace(spaceId);
			if (success) {
				setShowConfirmation(false);
				onDelete();
			} else {
				Alert.alert('Fehler', `Space konnte nicht gelöscht werden: ${error}`);
			}
		} catch (error) {
			console.error('Fehler beim Löschen des Space:', error);
			Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<>
			<ThemedButton
				title="Löschen"
				iconName="trash-outline"
				variant={variant}
				iconOnly={iconOnly}
				tooltip="Space löschen"
				onPress={() => setShowConfirmation(true)}
			/>

			<Modal
				visible={showConfirmation}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowConfirmation(false)}
			>
				<View
					style={[
						styles.modalOverlay,
						{ backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' },
					]}
				>
					<View style={[styles.modalContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
						<View style={styles.modalHeader}>
							<Ionicons
								name="warning-outline"
								size={24}
								color={isDark ? '#fbbf24' : '#d97706'}
								style={{ marginRight: 8 }}
							/>
							<Text style={[styles.modalTitle, { color: isDark ? '#f9fafb' : '#111827' }]}>
								Space löschen
							</Text>
						</View>

						<Text style={[styles.modalMessage, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
							Möchtest du den Space "{spaceName}" wirklich löschen? Diese Aktion kann nicht
							rückgängig gemacht werden. Alle Dokumente in diesem Space werden ebenfalls gelöscht.
						</Text>

						<View style={styles.modalActions}>
							<ThemedButton
								title="Abbrechen"
								onPress={() => setShowConfirmation(false)}
								variant="secondary"
								style={{ marginRight: 8 }}
								disabled={isDeleting}
							/>
							<ThemedButton
								title={isDeleting ? 'Wird gelöscht...' : 'Löschen'}
								onPress={handleDelete}
								variant="danger"
								disabled={isDeleting}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	modalContent: {
		width: '100%',
		maxWidth: 400,
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
		alignItems: 'center',
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	modalMessage: {
		fontSize: 16,
		marginBottom: 24,
		lineHeight: 24,
	},
	modalActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
});
