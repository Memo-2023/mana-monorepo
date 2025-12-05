import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, useWindowDimensions, Pressable, Platform, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

import { Text } from '~/components/ui/Text';
import { Skeleton } from '~/components/ui/Skeleton';
import { Document } from '~/services/supabaseService';
import { useTheme } from '~/utils/theme/theme';

import { DocumentTypeBadge } from './DocumentTypeBadge';
import { DocumentCardToolbar } from './DocumentCardToolbar';

type DocumentGalleryProps = {
	documents: Document[];
	loading?: boolean;
	error?: string | null;
	searchQuery?: string;
	selectedSpaceIds?: string[];
	onCreateDocument?: () => void;
};

export const DocumentGallery = ({
	documents,
	loading = false,
	error = null,
	searchQuery = '',
	selectedSpaceIds = [],
	onCreateDocument,
}: DocumentGalleryProps) => {
	const router = useRouter();
	const { isDark } = useTheme();
	const { width, height } = useWindowDimensions();

	// State für Hover und Pressed für den "Neues Dokument"-Button
	const [newDocHovered, setNewDocHovered] = useState(false);
	const [newDocPressed, setNewDocPressed] = useState(false);

	// State für Hover-Effekte der Dokumente
	const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);

	// State für die Dokumente
	const [documentsList, setDocumentsList] = useState<Document[]>(documents);

	// Markdown-Styles für die Karten-Vorschau
	const markdownStyles = {
		body: {
			fontSize: 14,
			lineHeight: 20,
			color: isDark ? '#f3f4f6' : '#1f2937',
			fontFamily: Platform.OS === 'ios' ? 'system' : 'sans-serif',
		},
		heading1: {
			fontSize: 18,
			fontWeight: 'bold' as const,
			marginTop: 8,
			marginBottom: 8,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		heading2: {
			fontSize: 16,
			fontWeight: 'bold' as const,
			marginTop: 6,
			marginBottom: 6,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		heading3: {
			fontSize: 15,
			fontWeight: 'bold' as const,
			marginTop: 4,
			marginBottom: 4,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		paragraph: {
			marginBottom: 8,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		code_inline: {
			backgroundColor: isDark ? '#374151' : '#f3f4f6',
			color: isDark ? '#f9fafb' : '#1f2937',
			paddingHorizontal: 4,
			paddingVertical: 2,
			borderRadius: 4,
			fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
			fontSize: 13,
		},
		code_block: {
			backgroundColor: isDark ? '#1f2937' : '#f9fafb',
			borderColor: isDark ? '#374151' : '#e5e7eb',
			borderWidth: 1,
			borderRadius: 4,
			padding: 8,
			marginVertical: 8,
			fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
			fontSize: 13,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		list_item: {
			marginBottom: 4,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		blockquote: {
			borderLeftWidth: 3,
			paddingLeft: 8,
			borderLeftColor: isDark ? '#4b5563' : '#e5e7eb',
			marginVertical: 8,
			color: isDark ? '#d1d5db' : '#4b5563',
			fontStyle: 'italic' as const,
		},
		link: {
			color: isDark ? '#93c5fd' : '#3b82f6',
			textDecorationLine: 'underline' as const,
		},
		strong: {
			fontWeight: 'bold' as const,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
		em: {
			fontStyle: 'italic' as const,
			color: isDark ? '#f3f4f6' : '#1f2937',
		},
	};

	// Funktion zum Neuladen der Daten
	const loadData = useCallback(() => {
		// Wenn eine onCreateDocument-Funktion übergeben wurde, nutze diese zum Neuladen
		if (onCreateDocument) {
			// Wir können die Funktion nicht direkt aufrufen, da sie zur Dokumenterstellung dient
			// Stattdessen informieren wir die übergeordnete Komponente, dass ein Reload nötig ist
			// Die übergeordnete Komponente muss dann die Dokumente neu laden
			onCreateDocument();
		}
	}, [onCreateDocument]);

	// Aktualisiere die Dokumentenliste, wenn sich die Props ändern
	// Optimiert: Die Dokumente sind bereits sortiert, daher keine erneute Sortierung nötig
	useEffect(() => {
		if (documents && Array.isArray(documents)) {
			setDocumentsList(documents);
		}
	}, [documents]);

	// Dynamische Kartengrößen basierend auf der Bildschirmbreite
	// Stellt sicher, dass ungefähr 1,5 Karten sichtbar sind
	const cardWidth = Math.min(Math.max(240, width * 0.65), 500); // Mindestens 240px, maximal 500px
	const cardHeight = Math.min(Math.max(340, height * 0.8), 650); // Mindestens 340px, maximal 650px oder 80% der Bildschirmhöhe

	// "Neues Dokument"-Karte ist halb so breit oder doppelt so breit, wenn keine Dokumente vorhanden sind
	const newDocCardWidth =
		documents.length > 0
			? Math.min(cardWidth * 0.5, 250) // Maximal 250px breit, wenn Dokumente vorhanden sind
			: Math.min(cardWidth, 500); // Doppelt so breit, wenn keine Dokumente vorhanden sind

	// Funktionen für den "Neues Dokument"-Button
	const getNewDocBackgroundColor = () => {
		if (newDocPressed) {
			return isDark ? '#4b5563' : '#d1d5db';
		}
		if (newDocHovered) {
			return isDark ? '#374151' : '#e5e7eb';
		}
		return isDark ? '#1f2937' : '#ffffff';
	};

	const getNewDocTextColor = () => {
		if (newDocPressed) {
			return isDark ? '#f9fafb' : '#111827';
		}
		if (newDocHovered) {
			return isDark ? '#f3f4f6' : '#1f2937';
		}
		return isDark ? '#f3f4f6' : '#111827';
	};

	const getNewDocIconColor = () => {
		if (newDocPressed) {
			return isDark ? '#e5e7eb' : '#4b5563';
		}
		if (newDocHovered) {
			return isDark ? '#d1d5db' : '#6b7280';
		}
		return isDark ? '#9ca3af' : '#6b7280';
	};

	const getNewDocBorderColor = () => {
		if (newDocPressed) {
			return isDark ? '#6b7280' : '#9ca3af';
		}
		if (newDocHovered) {
			return isDark ? '#4b5563' : '#d1d5db';
		}
		return isDark ? '#374151' : '#e5e7eb';
	};

	// Funktionen für die Dokumente
	const getDocBackgroundColor = (docId: string) => {
		if (hoveredDocId === docId) {
			return isDark ? '#263548' : '#f9fafb';
		}
		return isDark ? '#1f2937' : '#ffffff';
	};

	const getDocBorderColor = (docId: string) => {
		if (hoveredDocId === docId) {
			return isDark ? '#4b5563' : '#d1d5db';
		}
		return isDark ? '#374151' : '#e5e7eb';
	};

	// Kombiniere "Neues Dokument" Item mit den Dokumenten für FlatList
	const flatListData = useMemo(() => {
		const items: { type: 'new' | 'document'; data?: Document }[] = [];

		// Sicherheitscheck für documentsList
		if (!documentsList || !Array.isArray(documentsList)) {
			return items;
		}

		if (onCreateDocument && documentsList.length > 0) {
			items.push({ type: 'new' });
		}

		documentsList.forEach((doc) => {
			if (doc && doc.id) {
				items.push({ type: 'document', data: doc });
			}
		});

		return items;
	}, [documentsList, onCreateDocument]);

	const renderItem = useCallback(
		({ item, index }: { item: any; index: number }) => {
			// Sicherheitscheck
			if (!item || !item.type) {
				return null;
			}

			if (item.type === 'new') {
				return (
					<View
						style={{
							marginRight: 16,
							width: newDocCardWidth,
							height: cardHeight,
							borderRadius: 4,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.1,
							shadowRadius: 4,
							elevation: 3,
							overflow: 'hidden',
						}}
					>
						<Pressable
							style={({ pressed }) => [
								{
									flex: 1,
									justifyContent: 'center',
									alignItems: 'center',
									padding: 16,
									backgroundColor: getNewDocBackgroundColor(),
									borderWidth: 1,
									borderColor: getNewDocBorderColor(),
									borderStyle: 'dashed',
									borderRadius: 4,
								},
							]}
							onPress={onCreateDocument}
							onHoverIn={() => Platform.OS === 'web' && setNewDocHovered(true)}
							onHoverOut={() => Platform.OS === 'web' && setNewDocHovered(false)}
						>
							<Ionicons
								name="add"
								size={48}
								color={getNewDocIconColor()}
								style={{ marginBottom: 16 }}
							/>
							<Text
								style={{
									fontSize: 16,
									fontWeight: 'bold',
									color: getNewDocTextColor(),
									textAlign: 'center',
								}}
							>
								Neues Dokument
							</Text>
						</Pressable>
					</View>
				);
			}

			const doc = item.data;
			if (!doc) return null;

			return (
				<View
					key={doc.id}
					style={{
						marginRight: 16,
						width: cardWidth,
						height: cardHeight,
						borderRadius: 4,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.1,
						shadowRadius: 4,
						elevation: 3,
						overflow: 'hidden',
					}}
				>
					<Pressable
						style={({ pressed }) => [
							{
								flex: 1,
								padding: 0,
								position: 'relative',
								backgroundColor: getDocBackgroundColor(doc.id),
								borderWidth: 1,
								borderColor: getDocBorderColor(doc.id),
								borderRadius: 4,
							},
						]}
						onPress={() => router.push(`/spaces/${doc.space_id}/documents/${doc.id}?mode=edit`)}
						onHoverIn={() => Platform.OS === 'web' && setHoveredDocId(doc.id)}
						onHoverOut={() => Platform.OS === 'web' && setHoveredDocId(null)}
					>
						{/* Document content - render lazily */}
						<ScrollView
							style={{
								flex: 1,
								height: '100%',
								width: '100%',
							}}
							contentContainerStyle={{
								padding: 16,
								paddingBottom: 60, // Platz für die Toolbar
							}}
						>
							{/* Datum und Tags */}
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
									{new Date(doc.created_at).toLocaleDateString()}
								</Text>

								{/* Tags anzeigen */}
								{doc.metadata?.tags && doc.metadata.tags.length > 0 && (
									<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
										{doc.metadata.tags.slice(0, 2).map((tag: string, index: number) => (
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
										{doc.metadata.tags.length > 2 && (
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
												+{doc.metadata.tags.length - 2}
											</Text>
										)}
									</View>
								)}
							</View>

							{/* Dokumenttitel */}
							<Text
								style={{
									fontSize: 18,
									fontWeight: 'bold',
									marginBottom: 8,
									color: isDark ? '#f3f4f6' : '#111827',
								}}
								numberOfLines={2}
							>
								{doc.title || 'Unbenanntes Dokument'}
							</Text>

							{/* Dokumentinhalt mit Markdown-Rendering */}
							{doc.content ? (
								<View style={{ marginBottom: 16 }}>
									<Markdown style={markdownStyles} mergeStyle>
										{doc.content}
									</Markdown>
								</View>
							) : (
								<Text
									style={{
										fontSize: 14,
										color: isDark ? '#9ca3af' : '#6b7280',
										fontStyle: 'italic',
									}}
								>
									Leeres Dokument
								</Text>
							)}
						</ScrollView>

						{/* Dokument-Toolbar */}
						<View
							style={{
								position: 'absolute',
								bottom: 0,
								left: 0,
								right: 0,
								backgroundColor: isDark ? '#1f2937' : '#ffffff',
								borderTopWidth: 1,
								borderTopColor: isDark ? '#374151' : '#e5e7eb',
								paddingHorizontal: 16,
								paddingVertical: 8,
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<DocumentTypeBadge type={doc.type} />
							<DocumentCardToolbar
								document={doc}
								onDocumentUpdated={(updatedDocument) => {
									// Update local state
									const updatedDocs = documentsList.map((d) =>
										d.id === doc.id ? updatedDocument : d
									);
									setDocumentsList(updatedDocs);
								}}
								onDocumentDeleted={() => {
									// Remove from local state
									const updatedDocs = documentsList.filter((d) => d.id !== doc.id);
									setDocumentsList(updatedDocs);
									loadData();
								}}
								onDocumentPinned={(pinned) => {
									// Update local state
									const updatedDocs = documentsList.map((d) =>
										d.id === doc.id ? { ...d, pinned } : d
									);
									setDocumentsList(updatedDocs);
								}}
							/>
						</View>
					</Pressable>
				</View>
			);
		},
		[
			cardWidth,
			cardHeight,
			newDocCardWidth,
			router,
			onCreateDocument,
			getNewDocBackgroundColor,
			getNewDocBorderColor,
			getNewDocIconColor,
			getNewDocTextColor,
			getDocBackgroundColor,
			getDocBorderColor,
			hoveredDocId,
			isDark,
			documentsList,
			loadData,
		]
	);

	if (loading) {
		return (
			<FlatList
				horizontal
				data={Array.from({ length: 3 })} // Skeleton für 3 Dokumente
				renderItem={({ index }) => (
					<View
						key={index}
						style={{
							marginRight: 16,
							width: cardWidth,
							height: cardHeight,
							borderRadius: 4,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.1,
							shadowRadius: 4,
							elevation: 3,
							overflow: 'hidden',
							borderWidth: 1,
							borderColor: isDark ? '#374151' : '#e5e7eb',
							backgroundColor: isDark ? '#1f2937' : '#ffffff',
							padding: 16,
						}}
					>
						<Skeleton width="100%" height={20} style={{ marginBottom: 8 }} />
						<Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
						<Skeleton width="60%" height={16} style={{ marginBottom: 16 }} />
						<Skeleton width="100%" height={200} />
					</View>
				)}
				keyExtractor={(_, index) => `skeleton-${index}`}
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingLeft: 16, paddingRight: 32 }}
				style={{ flex: 1 }}
			/>
		);
	}

	if (error) {
		return (
			<View
				style={{
					padding: 16,
					backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
					borderRadius: 8,
				}}
			>
				<Text style={{ color: isDark ? '#fecaca' : '#991b1b' }}>{error}</Text>
			</View>
		);
	}

	// Wenn keine Dokumente vorhanden sind, verwenden wir ein anderes Layout
	if (documents.length === 0 && onCreateDocument) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					height: '100%',
					paddingHorizontal: 16,
				}}
			>
				{/* Zentriertes "Neues Dokument"-Element mit Hover-State */}
				<View
					style={{
						width: newDocCardWidth,
						height: cardHeight,
						borderRadius: 4,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.1,
						shadowRadius: 4,
						elevation: 3,
						overflow: 'hidden',
					}}
				>
					<Pressable
						style={({ pressed }) => [
							{
								flex: 1,
								justifyContent: 'center',
								alignItems: 'center',
								padding: 16,
								backgroundColor: getNewDocBackgroundColor(),
								borderWidth: 1,
								borderColor: getNewDocBorderColor(),
								borderStyle: 'dashed',
								borderRadius: 4,
							},
						]}
						onPress={onCreateDocument}
						onHoverIn={() => Platform.OS === 'web' && setNewDocHovered(true)}
						onHoverOut={() => Platform.OS === 'web' && setNewDocHovered(false)}
						onPressIn={() => setNewDocPressed(true)}
						onPressOut={() => setNewDocPressed(false)}
					>
						<Ionicons name="add" size={64} color={getNewDocIconColor()} />
						<Text
							style={{
								fontSize: 16,
								fontWeight: 'bold',
								color: getNewDocTextColor(),
								marginTop: 16,
								textAlign: 'center',
							}}
						>
							Neues Dokument
						</Text>
					</Pressable>
				</View>

				{/* "Keine Dokumente"-Meldung entfernt */}
			</View>
		);
	}

	// Normales Layout für vorhandene Dokumente

	return (
		<FlatList
			horizontal
			data={flatListData}
			renderItem={renderItem}
			keyExtractor={(item, index) =>
				item.type === 'new' ? 'new-doc' : item.data?.id || `doc-${index}`
			}
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{
				paddingLeft: 16,
				paddingRight: 32,
				paddingBottom: 16,
			}}
			style={{
				flex: 1,
				marginTop: 0,
				height: '100%',
				width: '100%',
				paddingBottom: 16,
			}}
			// Optimierungen für bessere Performance
			initialNumToRender={3}
			maxToRenderPerBatch={5}
			windowSize={10}
			removeClippedSubviews={Platform.OS !== 'web'}
			getItemLayout={(data, index) => {
				// Sicherheitscheck
				if (!data || !Array.isArray(data) || index < 0 || index >= data.length) {
					return {
						length: cardWidth + 16,
						offset: (cardWidth + 16) * index,
						index,
					};
				}

				// Berechne die Breite basierend auf dem Item-Typ
				const itemWidth = data[index]?.type === 'new' ? newDocCardWidth : cardWidth;
				const margin = 16;

				// Berechne das Offset basierend auf den vorherigen Items
				let offset = 16; // Anfangs-Padding
				for (let i = 0; i < index; i++) {
					const prevItemWidth = data[i]?.type === 'new' ? newDocCardWidth : cardWidth;
					offset += prevItemWidth + margin;
				}

				return {
					length: itemWidth + margin,
					offset,
					index,
				};
			}}
		/>
	);
};
