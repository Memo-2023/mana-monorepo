import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';
import { ThemedButton } from '~/components/ui/ThemedButton';
import {
	Document,
	deleteDocument,
	updateDocument,
	toggleDocumentPinned,
} from '~/services/supabaseService';
import { DocumentTypeDropdown, DocumentType } from '~/components/documents/DocumentTypeDropdown';
import { SpaceDropdown } from '~/components/spaces/SpaceDropdown';
import { ConfirmationModal } from '~/components/ui/ConfirmationModal';

interface DocumentCardToolbarProps {
	document: Document;
	onDocumentUpdated?: (updatedDocument: Document) => void;
	onDocumentDeleted?: () => void;
	onDocumentPinned?: (pinned: boolean) => void;
}

export const DocumentCardToolbar: React.FC<DocumentCardToolbarProps> = ({
	document,
	onDocumentUpdated,
	onDocumentDeleted,
	onDocumentPinned,
}) => {
	const { isDark } = useTheme();
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUpdatingType, setIsUpdatingType] = useState(false);
	const [isUpdatingSpace, setIsUpdatingSpace] = useState(false);
	const [isTogglingPin, setIsTogglingPin] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	// Funktion zum Öffnen des Lösch-Bestätigungsdialogs
	const handleDeleteDocument = () => {
		if (isDeleting) return;
		setShowDeleteConfirmation(true);
	};

	const performDelete = async () => {
		try {
			setIsDeleting(true);
			const { success, error } = await deleteDocument(document.id);

			if (!success) {
				console.error('Fehler beim Löschen des Dokuments:', error);
				alert(`Dokument konnte nicht gelöscht werden: ${error}`);
				return;
			}

			// Callback aufrufen, wenn das Dokument erfolgreich gelöscht wurde
			if (onDocumentDeleted) {
				onDocumentDeleted();
			}
		} catch (err: any) {
			console.error('Unerwarteter Fehler beim Löschen:', err);
			alert(`Unerwarteter Fehler: ${err.message}`);
		} finally {
			setIsDeleting(false);
		}
	};

	// Funktion zum Ändern des Dokumenttyps
	const handleTypeChange = async (newType: DocumentType) => {
		if (isUpdatingType) return;

		try {
			setIsUpdatingType(true);

			// Aktualisiere den Dokumenttyp in der Datenbank
			const { success, error } = await updateDocument(document.id, {
				type: newType,
			});

			if (!success) {
				console.error('Fehler beim Aktualisieren des Dokumenttyps:', error);
				alert(`Dokumenttyp konnte nicht aktualisiert werden: ${error}`);
				return;
			}

			// Lokale Aktualisierung des Dokuments
			document.type = newType;

			// Callback aufrufen, wenn das Dokument erfolgreich aktualisiert wurde
			if (onDocumentUpdated) {
				onDocumentUpdated(document);
			}
		} catch (err: any) {
			console.error('Unerwarteter Fehler beim Aktualisieren des Typs:', err);
			alert(`Unerwarteter Fehler: ${err.message}`);
		} finally {
			setIsUpdatingType(false);
		}
	};

	// Funktion zum Ändern des Space
	const handleSpaceChange = async (newSpaceId: string) => {
		if (isUpdatingSpace) return;

		try {
			setIsUpdatingSpace(true);

			// Aktualisiere den Space in der Datenbank
			const { success, error } = await updateDocument(document.id, {
				space_id: newSpaceId,
			});

			if (!success) {
				console.error('Fehler beim Aktualisieren des Space:', error);
				alert(`Space konnte nicht aktualisiert werden: ${error}`);
				return;
			}

			// Lokale Aktualisierung des Dokuments
			document.space_id = newSpaceId;

			// Callback aufrufen, wenn das Dokument erfolgreich aktualisiert wurde
			if (onDocumentUpdated) {
				onDocumentUpdated(document);
			}
		} catch (err: any) {
			console.error('Unerwarteter Fehler beim Aktualisieren des Space:', err);
			alert(`Unerwarteter Fehler: ${err.message}`);
		} finally {
			setIsUpdatingSpace(false);
		}
	};

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(249, 250, 251, 0.95)' },
			]}
		>
			<View style={styles.toolbarContent}>
				{/* Rechts ausgerichtete Buttons */}
				<View style={{ flex: 1 }} />

				<View style={styles.buttonsContainer}>
					{/* Space-Dropdown */}
					<SpaceDropdown
						currentSpaceId={document.space_id}
						onSpaceChange={handleSpaceChange}
						disabled={isUpdatingSpace}
						openUpwards={true}
					/>

					{/* Dokumenttyp-Dropdown */}
					<DocumentTypeDropdown
						currentType={document.type as DocumentType}
						onTypeChange={handleTypeChange}
						disabled={isUpdatingType}
						openUpwards={true}
						style={{ marginLeft: 8 }}
					/>

					{/* Pin-Button */}
					<ThemedButton
						title="Anpinnen"
						onPress={async () => {
							if (isTogglingPin) return;

							try {
								setIsTogglingPin(true);
								const newPinnedState = !(document.pinned || false);

								const { success, error } = await toggleDocumentPinned(document.id, newPinnedState);

								if (success) {
									// Lokale Aktualisierung des Dokuments
									document.pinned = newPinnedState;

									// Callback aufrufen, wenn das Dokument erfolgreich aktualisiert wurde
									if (onDocumentPinned) {
										onDocumentPinned(newPinnedState);
									}

									if (onDocumentUpdated) {
										onDocumentUpdated(document);
									}
								} else {
									console.error('Fehler beim Ändern des Pin-Status:', error);
								}
							} catch (err) {
								console.error('Unerwarteter Fehler beim Ändern des Pin-Status:', err);
							} finally {
								setIsTogglingPin(false);
							}
						}}
						variant="secondary"
						iconName={document.pinned || false ? 'pin' : 'pin-outline'}
						iconOnly={true}
						disabled={isTogglingPin}
						tooltip={document.pinned || false ? 'Dokument lösen' : 'Dokument anpinnen'}
						style={{
							marginLeft: 8,
							backgroundColor:
								document.pinned || false
									? isDark
										? 'rgba(249, 115, 22, 0.4)'
										: 'rgba(255, 237, 213, 0.4)'
									: undefined,
						}}
						isActive={document.pinned || false}
					/>

					{/* Löschen-Button */}
					<ThemedButton
						title="Dokument löschen"
						onPress={handleDeleteDocument}
						variant="secondary"
						iconName="trash-outline"
						iconOnly={true}
						disabled={isDeleting}
						tooltip="Dokument löschen"
						style={{ marginLeft: 8 }}
					/>
				</View>
			</View>

			{/* Lösch-Bestätigungsdialog */}
			<ConfirmationModal
				visible={showDeleteConfirmation}
				title="Dokument löschen"
				message="Möchten Sie dieses Dokument wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
				confirmText="Löschen"
				cancelText="Abbrechen"
				onConfirm={async () => {
					await performDelete();
					setShowDeleteConfirmation(false);
				}}
				onCancel={() => setShowDeleteConfirmation(false)}
				confirmVariant="danger"
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 8,
		borderBottomLeftRadius: 4,
		borderBottomRightRadius: 4,
		zIndex: 10,
	},
	toolbarContent: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	buttonsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});
