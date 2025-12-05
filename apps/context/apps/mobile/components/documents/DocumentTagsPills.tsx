import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useTheme } from '~/utils/theme/theme';
import { FilterPill } from '~/components/ui/FilterPill';

interface DocumentTagsPillsProps {
	allTags: string[];
	selectedTags: string[];
	onTagsChange: (tags: string[]) => void;
	disabled?: boolean;
}

export const DocumentTagsPills: React.FC<DocumentTagsPillsProps> = ({
	allTags,
	selectedTags,
	onTagsChange,
	disabled = false,
}) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';

	// Toggle-Funktion für Tags
	const toggleTag = (tag: string) => {
		if (selectedTags.includes(tag)) {
			onTagsChange(selectedTags.filter((t) => t !== tag));
		} else {
			onTagsChange([...selectedTags, tag]);
		}
	};

	// Alle Tags löschen
	const clearAllTags = () => {
		onTagsChange([]);
	};

	return (
		<View style={styles.container}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* "Alle Tags" Pill - nur anzeigen, wenn Tags ausgewählt sind */}
				{selectedTags.length > 0 && (
					<FilterPill
						label="Alle Tags"
						icon="close-circle"
						variant="document"
						onPress={clearAllTags}
						style={{ marginRight: 8 }}
					/>
				)}

				{/* Tag Pills */}
				{allTags.map((tag) => (
					<FilterPill
						key={tag}
						label={tag}
						icon="pricetag-outline"
						variant="document"
						isSelected={selectedTags.includes(tag)}
						onPress={() => toggleTag(tag)}
						disabled={disabled}
						style={{ marginRight: 8 }}
					/>
				))}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	scrollContent: {
		paddingVertical: 4,
		flexDirection: 'row',
		alignItems: 'center',
	},
});
