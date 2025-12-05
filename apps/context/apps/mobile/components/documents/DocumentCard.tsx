import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { Text } from '../ui/Text';
import { useTheme } from '~/utils/theme/theme';
import { DocumentCardDeleteButton } from './DocumentCardDeleteButton';
import { extractTitleFromMarkdown } from '~/utils/markdown';
import { Ionicons } from '@expo/vector-icons';
import { toggleDocumentPinned } from '~/services/supabaseService';
import { ThemedButton } from '../ui/ThemedButton';

type DocumentCardProps = {
	id: string;
	title?: string; // Now optional since we'll extract from content
	content?: string;
	type: 'original' | 'generated' | 'context' | 'prompt';
	created_at: string;
	onPress?: () => void;
	onDelete?: () => void;
	showDeleteButton?: boolean;
	pinned?: boolean;
	onPinToggle?: (pinned: boolean) => void;
	metadata?: any; // Für Tags und andere Metadaten
};

export const DocumentCard = memo(
	({
		id,
		title,
		content,
		type,
		created_at,
		onPress,
		onDelete,
		showDeleteButton = true,
		pinned = false,
		onPinToggle,
		metadata,
	}: DocumentCardProps) => {
		const { isDark } = useTheme();

		// Memoized computed values
		const displayTitle = useMemo(() => {
			return content ? extractTitleFromMarkdown(content) : title || 'Unbenanntes Dokument';
		}, [content, title]);

		const typeColors = useMemo(() => {
			const colors = {
				original: { color: '#2563eb', background: 'rgba(37, 99, 235, 0.1)', label: 'Original' },
				context: { color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', label: 'Kontext' },
				prompt: { color: '#d97706', background: 'rgba(217, 119, 6, 0.1)', label: 'Prompt' },
				generated: { color: '#0891b2', background: 'rgba(8, 145, 178, 0.1)', label: 'Generiert' },
			};
			return (
				colors[type] || {
					color: '#6b7280',
					background: 'rgba(107, 114, 128, 0.1)',
					label: 'Dokument',
				}
			);
		}, [type]);

		const contentPreview = useMemo(() => {
			// Zeige die ersten 150 Zeichen als Vorschau
			if (!content) return null;
			const preview = content.length > 150 ? `${content.substring(0, 150)}...` : content;
			// Entferne Markdown-Syntax für bessere Lesbarkeit
			return preview.replace(/[#*_~`]/g, '');
		}, [content]);

		const formattedDate = useMemo(() => {
			return new Date(created_at).toLocaleDateString();
		}, [created_at]);

		// Funktion zum Umschalten des Pin-Status
		const handleTogglePin = useCallback(() => {
			const newPinnedState = !pinned;

			try {
				// Aktualisiere den Pin-Status in der Datenbank
				toggleDocumentPinned(id, newPinnedState)
					.then(({ success, error }) => {
						if (success) {
							// Benachrichtige die übergeordnete Komponente über die Änderung
							if (onPinToggle) {
								onPinToggle(newPinnedState);
							}
						} else {
							console.error('Fehler beim Ändern des Pin-Status:', error);
						}
					})
					.catch((error) => {
						console.error('Fehler beim Ändern des Pin-Status:', error);
					});
			} catch (error) {
				console.error('Fehler beim Ändern des Pin-Status:', error);
			}
		}, [id, pinned, onPinToggle]);

		return (
			<TouchableOpacity
				style={{
					padding: 12,
					backgroundColor: isDark ? '#1f2937' : '#ffffff',
					borderWidth: 1,
					borderColor: isDark ? '#374151' : '#e5e7eb',
					borderRadius: 0, // Eckige Borders
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.1,
					shadowRadius: 2,
					elevation: 2,
					// Leichter Hintergrund für angepinnte Dokumente
					...(pinned && { backgroundColor: isDark ? '#1a2433' : '#f9fafb' }),
				}}
				onPress={onPress}
			>
				{/* Datum und Tags oben */}
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: 8,
					}}
				>
					<Text
						style={{
							fontSize: 12,
							color: isDark ? '#9ca3af' : '#6b7280',
						}}
					>
						{formattedDate}
					</Text>

					{/* Tags anzeigen, wenn vorhanden */}
					{metadata?.tags && metadata.tags.length > 0 && (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
							{metadata.tags.slice(0, 2).map((tag: string, index: number) => (
								<Text
									key={index}
									style={{
										fontSize: 11,
										color: isDark ? '#d1d5db' : '#4b5563',
										backgroundColor: isDark ? '#374151' : '#f3f4f6',
										paddingHorizontal: 6,
										paddingVertical: 1,
										borderRadius: 9999,
										marginRight: 4,
									}}
								>
									{tag}
								</Text>
							))}
							{metadata.tags.length > 2 && (
								<Text
									style={{
										fontSize: 11,
										color: isDark ? '#d1d5db' : '#4b5563',
										backgroundColor: isDark ? '#374151' : '#f3f4f6',
										paddingHorizontal: 6,
										paddingVertical: 1,
										borderRadius: 9999,
									}}
								>
									+{metadata.tags.length - 2}
								</Text>
							)}
						</View>
					)}
				</View>

				<Text
					style={{
						fontSize: 16,
						fontWeight: 'bold',
						color: isDark ? '#f3f4f6' : '#1f2937',
						marginBottom: 4,
					}}
					numberOfLines={1}
				>
					{displayTitle}
				</Text>

				{contentPreview && (
					<Text
						numberOfLines={2}
						style={{
							fontSize: 14,
							color: isDark ? '#9ca3af' : '#4b5563',
							marginBottom: 8,
						}}
					>
						{contentPreview}
					</Text>
				)}

				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						marginTop: 8,
					}}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
						{/* Dokumenttyp */}
						<Text
							style={{
								fontSize: 12,
								fontWeight: '500',
								color: typeColors.color,
								backgroundColor: typeColors.background,
								paddingHorizontal: 8,
								paddingVertical: 2,
								borderRadius: 4,
							}}
						>
							{typeColors.label}
						</Text>

						{/* Pin-Button */}
						<View style={{ marginLeft: 8 }}>
							<ThemedButton
								title="Anpinnen"
								iconName={pinned ? 'pin' : 'pin-outline'}
								variant="secondary"
								iconOnly={true}
								size="small"
								isActive={pinned}
								tooltip={pinned ? 'Dokument lösen' : 'Dokument anpinnen'}
								onPress={handleTogglePin}
								style={
									pinned
										? {
												backgroundColor: isDark
													? 'rgba(249, 115, 22, 0.4)'
													: 'rgba(255, 237, 213, 0.4)',
											}
										: undefined
								}
							/>
						</View>

						{showDeleteButton && (
							<View style={{ marginLeft: 8 }}>
								<TouchableOpacity
									onPress={(e) => {
										// Prevent the parent TouchableOpacity from being triggered
										e.stopPropagation();
										if (onDelete) {
											onDelete();
										}
									}}
								>
									<DocumentCardDeleteButton
										documentId={id}
										documentTitle={displayTitle}
										onDelete={onDelete ? onDelete : () => {}}
									/>
								</TouchableOpacity>
							</View>
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	}
);
