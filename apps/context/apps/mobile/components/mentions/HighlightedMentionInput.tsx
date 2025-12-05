import React, { useState, useEffect, forwardRef, ForwardRefRenderFunction } from 'react';
import { View, Text, StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '~/utils/theme';
import { MENTION_REGEX } from '~/utils/mentionProcessor';

interface HighlightedMentionInputProps extends TextInputProps {
	value: string;
	onChangeText: (text: string) => void;
}

/**
 * Ein TextInput, der @-Erwähnungen hervorhebt, indem er sie als formatierte Komponenten anzeigt
 */
const HighlightedMentionInputBase: ForwardRefRenderFunction<
	TextInput,
	HighlightedMentionInputProps
> = ({ value, onChangeText, style, ...props }, ref) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';

	// Teile den Text in normale Textabschnitte und @-Erwähnungen auf
	const renderHighlightedText = () => {
		if (!value) return null;

		const parts = [];
		let lastIndex = 0;
		let match;

		// Regex-Kopie erstellen, um den lastIndex zurückzusetzen
		const regex = new RegExp(MENTION_REGEX);

		while ((match = regex.exec(value)) !== null) {
			// Text vor der @-Erwähnung
			if (match.index > lastIndex) {
				parts.push(
					<Text key={`text-${lastIndex}`} style={styles.plainText}>
						{value.substring(lastIndex, match.index)}
					</Text>
				);
			}

			// Die @-Erwähnung selbst
			const [fullMatch, title, id] = match;
			parts.push(
				<Text
					key={`mention-${match.index}`}
					style={[styles.mention, { color: isDark ? '#60a5fa' : '#2563eb' }]}
				>
					@{title}
				</Text>
			);

			lastIndex = match.index + fullMatch.length;
		}

		// Text nach der letzten @-Erwähnung
		if (lastIndex < value.length) {
			parts.push(
				<Text key={`text-${lastIndex}`} style={styles.plainText}>
					{value.substring(lastIndex)}
				</Text>
			);
		}

		return parts;
	};

	return (
		<View style={styles.container}>
			{/* Hervorgehobener Text (nur zur Anzeige) */}
			<View style={[styles.highlightLayer]}>{renderHighlightedText()}</View>

			{/* Tatsächliches TextInput (transparent für Bearbeitung) */}
			<TextInput
				ref={ref}
				value={value}
				onChangeText={onChangeText}
				style={[styles.input, style]}
				multiline
				{...props}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'relative',
	},
	highlightLayer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		pointerEvents: 'none',
		flexDirection: 'row' as const,
		flexWrap: 'wrap' as const,
	},
	input: {
		color: 'transparent',
		// caretColor ist nur für Web verfügbar, daher entfernen wir es
		backgroundColor: 'transparent',
	},
	plainText: {
		color: 'transparent',
	},
	mention: {
		fontWeight: '500',
		textDecorationLine: 'underline',
	},
});

export const HighlightedMentionInput = forwardRef(HighlightedMentionInputBase);
