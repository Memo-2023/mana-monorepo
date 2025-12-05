import React, { useRef, useEffect, useCallback } from 'react';
import { View, TextInput, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Text } from '~/components/ui/Text';
import { useTheme } from '~/utils/theme/theme';
import { MentionTextInput } from '~/components/mentions/MentionTextInput';
import { DocumentMode } from '~/types/documentEditor';
import { EDITOR_CONFIG } from '~/config/editorConfig';
import Markdown from 'react-native-markdown-display';

export interface DocumentContentProps {
	mode: DocumentMode;
	content: string;
	onContentChange: (content: string) => void;
	isNewDocument: boolean;
	autoFocus?: boolean;
	className?: string;
}

/**
 * Komponente für den Dokumentinhalt - Edit und Preview Mode
 * Extrahiert aus dem ursprünglichen DocumentEditor
 */
export const DocumentContent: React.FC<DocumentContentProps> = ({
	mode,
	content,
	onContentChange,
	isNewDocument,
	autoFocus = false,
	className,
}) => {
	const { isDark } = useTheme();
	const { width } = useWindowDimensions();
	const isDesktop = width > 1024;
	const textInputRef = useRef<TextInput>(null);

	// Auto-Focus für neue Dokumente
	useEffect(() => {
		if (autoFocus && mode === 'edit' && isNewDocument) {
			// Slight delay to ensure component is fully rendered
			const timer = setTimeout(() => {
				textInputRef.current?.focus();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [autoFocus, mode, isNewDocument]);

	const handleContentChange = useCallback(
		(text: string) => {
			onContentChange(text);
		},
		[onContentChange]
	);

	// Markdown-Styles für Preview
	const markdownStyles = {
		body: {
			fontSize: 16,
			lineHeight: 24,
			color: isDark ? '#f3f4f6' : '#1f2937',
			fontFamily: Platform.OS === 'ios' ? 'system' : 'sans-serif',
		},
		heading1: {
			fontSize: 32,
			fontWeight: 'bold',
			marginTop: 24,
			marginBottom: 16,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		heading2: {
			fontSize: 24,
			fontWeight: 'bold',
			marginTop: 20,
			marginBottom: 12,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		heading3: {
			fontSize: 20,
			fontWeight: 'bold',
			marginTop: 16,
			marginBottom: 8,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		paragraph: {
			marginBottom: 16,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		list_item: {
			marginBottom: 8,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		blockquote: {
			borderLeftWidth: 4,
			paddingLeft: 16,
			borderLeftColor: isDark ? '#4b5563' : '#e5e7eb',
			marginVertical: 16,
			color: isDark ? '#d1d5db' : '#4b5563',
			backgroundColor: 'transparent',
			fontStyle: 'italic',
		},
		link: {
			color: isDark ? '#93c5fd' : '#3b82f6',
			textDecorationLine: 'underline',
		},
		code_inline: {
			backgroundColor: isDark ? '#374151' : '#f3f4f6',
			color: isDark ? '#f3f4f6' : '#1f2937',
			padding: 4,
			borderRadius: 4,
			fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
		},
		code_block: {
			backgroundColor: isDark ? '#374151' : '#f3f4f6',
			color: isDark ? '#f3f4f6' : '#1f2937',
			padding: 16,
			borderRadius: 8,
			marginVertical: 16,
			fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
		},
		table: {
			borderWidth: 1,
			borderColor: isDark ? '#374151' : '#e5e7eb',
			borderRadius: 8,
			marginVertical: 16,
		},
		thead: {
			backgroundColor: isDark ? '#374151' : '#f9fafb',
		},
		tbody: {
			backgroundColor: isDark ? '#1f2937' : '#ffffff',
		},
		th: {
			fontWeight: 'bold',
			padding: 12,
			borderBottomWidth: 1,
			borderBottomColor: isDark ? '#4b5563' : '#e5e7eb',
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		td: {
			padding: 12,
			borderBottomWidth: 1,
			borderBottomColor: isDark ? '#374151' : '#f3f4f6',
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
	};

	if (mode === 'edit') {
		return (
			<View
				className={className}
				style={{
					flex: 1,
					maxWidth: isDesktop ? 800 : '100%',
					width: '100%',
					marginHorizontal: 'auto',
				}}
			>
				<MentionTextInput
					ref={textInputRef}
					value={content}
					onChangeText={handleContentChange}
					placeholder={
						isNewDocument ? 'Beginne mit dem Schreiben...' : 'Dokumentinhalt bearbeiten...'
					}
					placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
					style={{
						flex: 1,
						fontSize: 16,
						lineHeight: 24,
						color: isDark ? '#f3f4f6' : '#1f2937',
						fontFamily: Platform.OS === 'ios' ? 'system' : 'sans-serif',
						paddingTop: EDITOR_CONFIG.PREVIEW_PADDING.TOP,
						paddingBottom: EDITOR_CONFIG.PREVIEW_PADDING.BOTTOM,
						paddingHorizontal: 16,
						textAlignVertical: 'top',
					}}
					multiline
					scrollEnabled={false} // ScrollView handles this
					autoFocus={autoFocus && isNewDocument}
					// Accessibility
					accessibilityLabel="Dokumentinhalt bearbeiten"
					accessibilityHint="Hier können Sie Ihren Dokumentinhalt eingeben und bearbeiten"
					accessibilityRole="textbox"
				/>
			</View>
		);
	}

	// Preview Mode
	return (
		<View
			className={className}
			style={{
				flex: 1,
				maxWidth: isDesktop ? 800 : '100%',
				width: '100%',
				marginHorizontal: 'auto',
			}}
		>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingTop: EDITOR_CONFIG.PREVIEW_PADDING.TOP,
					paddingBottom: EDITOR_CONFIG.PREVIEW_PADDING.BOTTOM,
					paddingHorizontal: 16,
				}}
				showsVerticalScrollIndicator={false}
			>
				{content ? (
					<Markdown style={markdownStyles}>{content}</Markdown>
				) : (
					<View
						style={{
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
							paddingTop: 100,
						}}
					>
						<Text
							style={{
								fontSize: 16,
								color: isDark ? '#9ca3af' : '#6b7280',
								fontStyle: 'italic',
								textAlign: 'center',
							}}
						>
							{isNewDocument
								? 'Beginne mit dem Schreiben im Edit-Modus'
								: 'Dieses Dokument ist leer'}
						</Text>
					</View>
				)}
			</ScrollView>
		</View>
	);
};
