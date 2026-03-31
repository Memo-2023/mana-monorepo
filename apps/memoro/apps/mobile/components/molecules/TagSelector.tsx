import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Pill from '~/components/atoms/Pill';
import Icon from '~/components/atoms/Icon';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';

// Tag-Schnittstelle für die interne Verwendung
interface TagItem {
	id: string;
	text: string;
	color: string;
}

interface TagSelectorProps {
	visible: boolean;
	onClose: () => void;
	onTagSelect: (tagId: string) => void;
	selectedTagIds?: string[];
	memoId?: string;
}

/**
 * Eine Komponente, die ein Modal zur Auswahl von Tags anzeigt.
 * Lädt Tags aus der Datenbank und ermöglicht die Auswahl.
 */
const TagSelector: React.FC<TagSelectorProps> = ({
	visible,
	onClose,
	onTagSelect,
	selectedTagIds = [],
	memoId,
}) => {
	const { isDark } = useTheme();
	const [loading, setLoading] = useState(false);
	const [tagItems, setTagItems] = useState<TagItem[]>([]);

	// Hilfsfunktion zum Konvertieren von Tags aus der Datenbank in TagItems
	const convertTagToTagItem = (tag: any): TagItem => {
		// Verwende die Farbe direkt aus dem style-Objekt oder einen Standardwert
		const tagColor = tag.style?.color || '#4FC3F7';

		return {
			id: tag.id,
			text: tag.name,
			color: tagColor,
		};
	};

	// Lade alle verfügbaren Tags
	const loadTags = useCallback(async () => {
		try {
			setLoading(true);
			// Authentifizierten Client holen
			const supabase = await getAuthenticatedClient();

			const { data, error } = await supabase
				.from('tags')
				.select('*')
				.order('is_pinned', { ascending: false })
				.order('sort_order', { ascending: true })
				.order('created_at', { ascending: false });

			if (error) {
				console.debug('Fehler beim Laden der Tags:', error);
				throw error;
			}

			// Tags in TagItems konvertieren
			const items = (data || []).map(convertTagToTagItem);
			setTagItems(items);
		} catch (error) {
			console.debug('Fehler beim Laden der Tags:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Tags beim ersten Laden abrufen
	useEffect(() => {
		if (visible) {
			loadTags();
		}
	}, [visible, loadTags]);

	// Farben für das Modal
	const overlayColor = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)';
	const backgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
	const borderColor = isDark ? '#333333' : '#E0E0E0';
	const textColor = isDark ? '#FFFFFF' : '#000000';
	const headerBgColor = isDark ? '#2D2D2D' : '#F5F5F5';

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<Pressable
				style={[styles.modalContainer, { backgroundColor: overlayColor }]}
				onPress={onClose} // Schließen des Modals beim Klick auf den Hintergrund
			>
				<Pressable
					style={[styles.modalContent, { backgroundColor, borderColor }]}
					onPress={(e) => e.stopPropagation()} // Verhindert, dass Klicks auf den Inhalt das Modal schließen
				>
					{/* Header */}
					<View style={[styles.header, { backgroundColor: headerBgColor }]}>
						<Text style={[styles.title, { color: textColor }]}>Tags auswählen</Text>
						<Pressable style={styles.closeButton} onPress={onClose}>
							<Icon name="close-outline" size={24} color={textColor} />
						</Pressable>
					</View>

					{/* Tags */}
					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
							<Text style={[styles.loadingText, { color: textColor }]}>Lade Tags...</Text>
						</View>
					) : tagItems.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={[styles.emptyText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
								Keine Tags gefunden.
							</Text>
						</View>
					) : (
						<ScrollView style={styles.scrollContainer}>
							<View style={styles.tagsContainer}>
								{tagItems.map((tagItem) => {
									// Stelle sicher, dass die Farbe einen gültigen Wert hat
									const tagColor = tagItem.color || '#4FC3F7';
									const isSelected = selectedTagIds.includes(tagItem.id);

									return (
										<View key={tagItem.id} style={styles.tagWrapper}>
											<Pill
												label={tagItem.text}
												color={tagColor}
												isSelected={isSelected}
												onPress={() => onTagSelect(tagItem.id)}
												size="small"
												maxLength={20}
											/>
										</View>
									);
								})}
							</View>
						</ScrollView>
					)}
				</Pressable>
			</Pressable>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '90%',
		maxHeight: '80%',
		borderRadius: 12,
		overflow: 'hidden',
		borderWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0, 0, 0, 0.1)',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	closeButton: {
		padding: 8,
	},
	scrollContainer: {
		maxHeight: '70%',
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		padding: 16,
		gap: 12,
	},
	tagWrapper: {
		marginBottom: 8,
	},
	loadingContainer: {
		padding: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
	},
	emptyContainer: {
		padding: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyText: {
		fontSize: 16,
	},
});

export default TagSelector;
