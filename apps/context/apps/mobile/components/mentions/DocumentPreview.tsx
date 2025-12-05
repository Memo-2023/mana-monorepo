import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Document } from '~/services/supabaseService';
import { useTheme } from '~/utils/theme';
import Markdown from 'react-native-markdown-display';

interface DocumentPreviewProps {
	document: Document | null;
	position?: { top: number; left: number };
	visible?: boolean;
	maxHeight?: number;
	maxWidth?: number;
	inline?: boolean; // Wenn true, wird die Vorschau inline angezeigt (nicht absolut positioniert)
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
	document,
	position,
	visible = true,
	maxHeight = 300,
	maxWidth = 400,
	inline = false,
}) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';

	if ((!visible && !inline) || !document) {
		return null;
	}

	// Get document type color
	const getTypeColor = (type: 'text' | 'context' | 'prompt'): string => {
		switch (type) {
			case 'text':
				return isDark ? '#818cf8' : '#4f46e5'; // Indigo
			case 'context':
				return isDark ? '#34d399' : '#16a34a'; // Green
			case 'prompt':
				return isDark ? '#fbbf24' : '#d97706'; // Amber
			default:
				return isDark ? '#818cf8' : '#4f46e5'; // Default to indigo
		}
	};

	// Truncate content for preview
	const previewContent = document.content
		? document.content.substring(0, 500) + (document.content.length > 500 ? '...' : '')
		: 'Kein Inhalt vorhanden';

	// Wir verwenden den Originalinhalt, da die Markdown-Komponente die Links verarbeitet

	return (
		<View
			style={[
				inline ? styles.inlineContainer : styles.container,
				position && !inline
					? {
							top: position.top,
							left: position.left,
						}
					: {},
				{
					maxHeight: inline ? undefined : maxHeight,
					maxWidth: inline ? undefined : maxWidth,
					backgroundColor: isDark ? '#1f2937' : '#ffffff',
					borderColor: isDark ? '#374151' : '#e5e7eb',
				},
			]}
		>
			<View style={styles.header}>
				<Text
					style={{
						fontSize: 16,
						fontWeight: '600',
						color: isDark ? '#f3f4f6' : '#1f2937',
					}}
				>
					{document.title}
				</Text>
				<View style={[styles.typeTag, { backgroundColor: getTypeColor(document.type) + '20' }]}>
					<Text
						style={{
							fontSize: 12,
							color: getTypeColor(document.type),
							fontWeight: '500',
						}}
					>
						{document.type === 'text' ? 'Text' : document.type === 'context' ? 'Kontext' : 'Prompt'}
					</Text>
				</View>
			</View>
			<ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 8 }}>
				<Markdown
					style={{
						body: { fontSize: 14, color: isDark ? '#f3f4f6' : '#1f2937' },
						paragraph: { marginVertical: 8 },
						heading1: {
							fontSize: 18,
							marginVertical: 8,
							fontWeight: 'bold',
							color: isDark ? '#f3f4f6' : '#1f2937',
						},
						heading2: {
							fontSize: 16,
							marginVertical: 6,
							fontWeight: 'bold',
							color: isDark ? '#f3f4f6' : '#1f2937',
						},
						heading3: {
							fontSize: 14,
							marginVertical: 4,
							fontWeight: 'bold',
							color: isDark ? '#f3f4f6' : '#1f2937',
						},
						code_inline: {
							backgroundColor: isDark ? '#374151' : '#f3f4f6',
							padding: 2,
							borderRadius: 3,
						},
						code_block: {
							backgroundColor: isDark ? '#374151' : '#f3f4f6',
							padding: 8,
							borderRadius: 4,
						},
						link: { color: isDark ? '#60a5fa' : '#2563eb' }, // Blau für Links
					}}
					rules={{
						image: () => null, // Bilder nicht rendern
					}}
				>
					{previewContent}
				</Markdown>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		zIndex: 1000,
		padding: 16,
		borderRadius: 8,
		borderWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	inlineContainer: {
		padding: 16,
		borderRadius: 8,
		borderWidth: 1,
		marginVertical: 8,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
		paddingBottom: 8,
	},
	typeTag: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
	},
	content: {
		flex: 1,
		maxHeight: 200, // Begrenzte Höhe für Scrollbarkeit
	},
});
