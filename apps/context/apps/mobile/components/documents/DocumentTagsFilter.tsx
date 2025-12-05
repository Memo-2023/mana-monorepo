import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	ScrollView,
	Platform,
	Modal,
	TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';

interface DocumentTagsFilterProps {
	allTags: string[];
	selectedTags: string[];
	onTagsChange: (tags: string[]) => void;
	disabled?: boolean;
}

// TagItem als separate Komponente
const TagItem = ({
	tag,
	onSelect,
	isSelected,
	isDark,
}: {
	tag: string;
	onSelect: () => void;
	isSelected: boolean;
	isDark: boolean;
}) => {
	return (
		<TouchableOpacity
			style={[
				styles.tagItem,
				{
					backgroundColor: isSelected
						? isDark
							? '#374151'
							: '#f3f4f6'
						: isDark
							? '#1f2937'
							: '#ffffff',
				},
			]}
			onPress={onSelect}
		>
			<View style={styles.tagItemContent}>
				<Ionicons
					name={isSelected ? 'checkmark-circle' : 'pricetag-outline'}
					size={18}
					color={isSelected ? (isDark ? '#10b981' : '#059669') : isDark ? '#9ca3af' : '#6b7280'}
					style={{ marginRight: 8 }}
				/>
				<Text style={{ color: isDark ? '#f9fafb' : '#111827', fontSize: 14, fontWeight: '500' }}>
					{tag}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

export const DocumentTagsFilter: React.FC<DocumentTagsFilterProps> = ({
	allTags,
	selectedTags,
	onTagsChange,
	disabled = false,
}) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';
	const [isOpen, setIsOpen] = useState(false);
	const buttonRef = useRef<any>(null);

	// Toggle-Funktion für Tags
	const handleTagSelect = (tag: string) => {
		if (selectedTags.includes(tag)) {
			onTagsChange(selectedTags.filter((t) => t !== tag));
		} else {
			onTagsChange([...selectedTags, tag]);
		}
	};

	// Alle Tags löschen
	const clearAllTags = () => {
		onTagsChange([]);
		setIsOpen(false);
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity
				ref={buttonRef}
				onPress={() => setIsOpen(true)}
				style={[
					styles.button,
					{
						backgroundColor: isDark ? '#1f2937' : '#ffffff',
						borderColor: isDark ? '#374151' : '#e5e7eb',
						opacity: disabled ? 0.5 : 1,
					},
				]}
				disabled={disabled}
			>
				<View style={styles.buttonContent}>
					<Ionicons name="pricetag-outline" size={18} color={isDark ? '#d1d5db' : '#4b5563'} />
					<Text style={[styles.buttonText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>
						{selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'Tags'}
					</Text>
					<Ionicons name="chevron-down" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
				</View>
			</TouchableOpacity>

			<Modal
				visible={isOpen}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setIsOpen(false)}
			>
				<Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
					<View
						style={[
							styles.modalContent,
							{
								backgroundColor: isDark ? '#1f2937' : '#ffffff',
								borderColor: isDark ? '#374151' : '#e5e7eb',
							},
						]}
					>
						<View style={styles.modalHeader}>
							<Text
								style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#f9fafb' : '#111827' }}
							>
								Tags filtern
							</Text>
							<TouchableOpacity onPress={() => setIsOpen(false)}>
								<Ionicons name="close" size={24} color={isDark ? '#d1d5db' : '#4b5563'} />
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.modalScroll}>
							{allTags.length > 0 ? (
								allTags.map((tag) => (
									<TagItem
										key={tag}
										tag={tag}
										onSelect={() => handleTagSelect(tag)}
										isSelected={selectedTags.includes(tag)}
										isDark={isDark}
									/>
								))
							) : (
								<View style={styles.emptyState}>
									<Text style={{ color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>
										Keine Tags verfügbar
									</Text>
								</View>
							)}
						</ScrollView>

						{selectedTags.length > 0 && (
							<TouchableOpacity
								style={[styles.clearButton, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}
								onPress={clearAllTags}
							>
								<Text style={{ color: isDark ? '#f87171' : '#ef4444' }}>Alle Filter löschen</Text>
							</TouchableOpacity>
						)}
					</View>
				</Pressable>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'relative',
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	buttonText: {
		marginLeft: 8,
		marginRight: 8,
		fontSize: 14,
		fontWeight: '500',
	},
	tagItem: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0, 0, 0, 0.05)',
	},
	tagItemContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	clearButton: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderTopWidth: 1,
		alignItems: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '80%',
		maxWidth: 400,
		borderRadius: 8,
		borderWidth: 1,
		overflow: 'hidden',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0, 0, 0, 0.1)',
	},
	modalScroll: {
		maxHeight: 300,
	},
	emptyState: {
		padding: 20,
		alignItems: 'center',
	},
});
