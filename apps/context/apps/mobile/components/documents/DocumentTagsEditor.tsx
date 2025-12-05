import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Keyboard,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { useTheme } from '~/utils/theme/theme';
import { themes } from '~/utils/theme/colors';
// Import von saveDocumentTags entfernt, da die Speicherung jetzt in der übergeordneten Komponente erfolgt

interface DocumentTagsEditorProps {
	tags: string[];
	onTagsChange: (tags: string[]) => void;
	themeName?: string;
	documentId?: string;
}

export const DocumentTagsEditor: React.FC<DocumentTagsEditorProps> = ({
	tags,
	onTagsChange,
	themeName = 'indigo',
	documentId,
}) => {
	// Debug-Ausgabe
	console.log('DocumentTagsEditor - documentId:', documentId);
	console.log('DocumentTagsEditor - tags:', tags);
	const { isDark } = useTheme();
	const [newTag, setNewTag] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const inputRef = useRef<TextInput>(null);

	// Funktion zum Hinzufügen eines neuen Tags
	const handleAddTag = () => {
		const trimmedTag = newTag.trim();
		if (trimmedTag && !tags.includes(trimmedTag)) {
			const newTags = [...tags, trimmedTag];

			// Setze den neuen Tag im Eingabefeld zurück
			setNewTag('');

			// Setze den Lade-Indikator
			setIsSaving(true);

			// Rufe die übergeordnete onTagsChange-Funktion auf, die sich um die Speicherung kümmert
			onTagsChange(newTags);

			// Setze den Lade-Indikator nach einer kurzen Verzögerung zurück
			setTimeout(() => {
				setIsSaving(false);
			}, 2000);
		}
	};

	// Funktion zum Entfernen eines Tags
	const handleRemoveTag = (tagToRemove: string) => {
		const newTags = tags.filter((tag) => tag !== tagToRemove);

		// Setze den Lade-Indikator
		setIsSaving(true);

		// Rufe die übergeordnete onTagsChange-Funktion auf, die sich um die Speicherung kümmert
		onTagsChange(newTags);

		// Setze den Lade-Indikator nach einer kurzen Verzögerung zurück
		setTimeout(() => {
			setIsSaving(false);
		}, 2000);
	};

	// Tastatur-Event-Handler für Enter-Taste
	const handleKeyPress = (e: any) => {
		if (e.nativeEvent.key === 'Enter' || e.nativeEvent.key === ',') {
			e.preventDefault();
			handleAddTag();
		}
	};

	return (
		<View style={styles.container} className="document-tags-editor">
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Text style={[styles.label, { color: isDark ? '#d1d5db' : '#4b5563' }]}>Tags</Text>
				{isSaving && <ActivityIndicator size="small" color={isDark ? '#d1d5db' : '#4b5563'} />}
			</View>

			{/* Tag-Liste */}
			<View style={styles.tagsContainer}>
				{tags.map((tag, index) => (
					<View
						key={index}
						style={[
							styles.tag,
							{
								backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
							},
						]}
					>
						<Text
							style={{
								color: isDark ? '#d1d5db' : '#4b5563',
								fontSize: 12,
							}}
						>
							{tag}
						</Text>
						<TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveTag(tag)}>
							<Ionicons name="close-circle" size={16} color={isDark ? '#d1d5db' : '#4b5563'} />
						</TouchableOpacity>
					</View>
				))}
			</View>

			{/* Eingabefeld für neue Tags */}
			<View
				style={[
					styles.inputContainer,
					{
						borderColor: isDark ? '#374151' : '#d1d5db',
						backgroundColor: isDark ? '#1f2937' : '#ffffff',
					},
				]}
			>
				<TextInput
					ref={inputRef}
					value={newTag}
					onChangeText={setNewTag}
					onKeyPress={handleKeyPress}
					onSubmitEditing={handleAddTag}
					placeholder="Neuen Tag hinzufügen (mit Enter oder Komma bestätigen)"
					placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
					style={[styles.input, { color: isDark ? '#f3f4f6' : '#111827' }]}
				/>
				<TouchableOpacity
					style={[
						styles.addButton,
						{
							backgroundColor: newTag.trim()
								? isDark
									? '#4f46e5'
									: '#6366f1'
								: isDark
									? '#374151'
									: '#e5e7eb',
							opacity: newTag.trim() ? 1 : 0.5,
						},
					]}
					onPress={handleAddTag}
					disabled={!newTag.trim()}
				>
					<Ionicons name="add" size={20} color="#ffffff" />
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 8,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 8,
	},
	tag: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 9999,
		marginRight: 8,
		marginBottom: 8,
	},
	removeButton: {
		marginLeft: 4,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 4,
		overflow: 'hidden',
	},
	input: {
		flex: 1,
		height: 40,
		paddingHorizontal: 12,
	},
	addButton: {
		height: 40,
		width: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
