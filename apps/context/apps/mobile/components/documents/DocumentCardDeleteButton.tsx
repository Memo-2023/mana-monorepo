import React, { useState } from 'react';
import { Modal, View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { ThemedButton } from '~/components/ui/ThemedButton';
import { deleteDocument } from '~/services/supabaseService';
import { useTheme } from '~/utils/theme/theme';

interface DocumentCardDeleteButtonProps {
	documentId: string;
	documentTitle: string;
	onDelete: () => void;
	stopPropagation?: boolean;
}

export const DocumentCardDeleteButton: React.FC<DocumentCardDeleteButtonProps> = ({
	documentId,
	documentTitle,
	onDelete,
	stopPropagation = true,
}) => {
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const { mode, colors } = useTheme();
	const isDark = mode === 'dark';

	const handlePress = () => {
		setShowConfirmation(true);
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const { success, error } = await deleteDocument(documentId);
			if (success) {
				setShowConfirmation(false);
				onDelete();
			} else {
				Alert.alert('Fehler', `Dokument konnte nicht gelöscht werden: ${error}`);
			}
		} catch (error) {
			console.error('Fehler beim Löschen des Dokuments:', error);
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
				variant="secondary"
				iconOnly={true}
				size="small"
				tooltip="Dokument löschen"
				onPress={handlePress}
			/>

			<Modal visible={showConfirmation} transparent={true} animationType="fade">
				<View
					style={[
						styles.modalOverlay,
						{ backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' },
					]}
				>
					<View
						style={[
							styles.modalContent,
							{
								backgroundColor: isDark ? colors.gray[800] : colors.gray[50],
								borderColor: isDark ? colors.gray[700] : colors.gray[200],
							},
						]}
					>
						<View
							style={[
								styles.modalHeader,
								{ borderBottomColor: isDark ? colors.gray[700] : colors.gray[200] },
							]}
						>
							<Text
								style={[styles.modalTitle, { color: isDark ? colors.gray[100] : colors.gray[900] }]}
							>
								Dokument löschen
							</Text>
							<ThemedButton
								title="Schließen"
								iconName="close-outline"
								variant="outline"
								size="small"
								iconOnly={true}
								onPress={() => setShowConfirmation(false)}
							/>
						</View>

						<View style={styles.modalBody}>
							<Ionicons
								name="warning-outline"
								size={32}
								color={isDark ? '#f59e0b' : '#d97706'}
								style={styles.warningIcon}
							/>

							<Text
								style={[styles.modalText, { color: isDark ? colors.gray[300] : colors.gray[700] }]}
							>
								Möchten Sie das Dokument "{documentTitle}" wirklich löschen? Diese Aktion kann nicht
								rückgängig gemacht werden.
							</Text>
						</View>

						<View style={styles.buttonContainer}>
							<ThemedButton
								title="Abbrechen"
								variant="outline"
								onPress={() => setShowConfirmation(false)}
								style={{ marginRight: 8 }}
							/>

							<ThemedButton
								title={isDeleting ? 'Löschen...' : 'Löschen'}
								variant="danger"
								onPress={handleDelete}
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
	},
	modalContent: {
		width: '90%',
		maxWidth: 400,
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	modalBody: {
		padding: 16,
		alignItems: 'center',
	},
	warningIcon: {
		marginBottom: 16,
	},
	modalText: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		padding: 16,
		paddingTop: 8,
	},
});
