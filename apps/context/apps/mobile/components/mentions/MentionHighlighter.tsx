import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '~/utils/theme';
import { MENTION_REGEX } from '~/utils/mentionProcessor';
import { useRouter } from 'expo-router';

interface MentionHighlighterProps {
	text: string;
	spaceId?: string;
}

/**
 * Eine Komponente, die Text mit hervorgehobenen @-Erwähnungen anzeigt
 */
export const MentionHighlighter: React.FC<MentionHighlighterProps> = ({ text, spaceId }) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';
	const router = useRouter();

	// Wenn kein Text vorhanden ist, nichts anzeigen
	if (!text) return null;

	// Text in normale Textabschnitte und @-Erwähnungen aufteilen
	const renderHighlightedText = () => {
		const parts = [];
		let lastIndex = 0;
		let match;

		// Regex-Kopie erstellen, um den lastIndex zurückzusetzen
		const regex = new RegExp(MENTION_REGEX);

		while ((match = regex.exec(text)) !== null) {
			// Text vor der @-Erwähnung
			if (match.index > lastIndex) {
				parts.push(
					<Text key={`text-${lastIndex}`} style={styles.plainText}>
						{text.substring(lastIndex, match.index)}
					</Text>
				);
			}

			// Die @-Erwähnung selbst
			const [fullMatch, title, id] = match;
			parts.push(
				<TouchableOpacity
					key={`mention-${match.index}`}
					onPress={() => {
						// Zum referenzierten Dokument navigieren
						if (spaceId) {
							router.push(`/spaces/${spaceId}/documents/${id}`);
						}
					}}
				>
					<Text style={[styles.mention, { color: isDark ? '#60a5fa' : '#2563eb' }]}>@{title}</Text>
				</TouchableOpacity>
			);

			lastIndex = match.index + fullMatch.length;
		}

		// Text nach der letzten @-Erwähnung
		if (lastIndex < text.length) {
			parts.push(
				<Text key={`text-${lastIndex}`} style={styles.plainText}>
					{text.substring(lastIndex)}
				</Text>
			);
		}

		return parts;
	};

	return (
		<View style={styles.container}>
			<View style={styles.textContainer}>{renderHighlightedText()}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: 10,
		marginBottom: 10,
		padding: 10,
		borderRadius: 8,
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
	},
	textContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	plainText: {
		fontSize: 14,
	},
	mention: {
		fontSize: 14,
		fontWeight: '500',
		textDecorationLine: 'underline',
	},
});
