import React, { useState, useRef, useEffect } from 'react';
import { Text, TouchableOpacity, View, Platform, Modal, ScrollView, Pressable } from 'react-native';
import {
	Document,
	getDocumentById,
	getDocumentByShortId,
	getDocuments,
} from '~/services/supabaseService';
import { DocumentPreview } from './DocumentPreview';
import { useTheme } from '~/utils/theme';
import { useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';

interface MentionRendererProps {
	documentId?: string; // Optional für das neue Format
	documentTitle: string;
	spaceId?: string; // Optional space ID für Navigation
	children?: React.ReactNode; // Für den anzuzeigenden Text
}

export const MentionRenderer: React.FC<MentionRendererProps> = ({
	documentId,
	documentTitle,
	spaceId,
	children,
}) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';
	const router = useRouter();
	const [showPreview, setShowPreview] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [document, setDocument] = useState<Document | null>(null);
	const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
	const mentionRef = useRef<View>(null);
	const previewTimeout = useRef<NodeJS.Timeout | null>(null);

	// Load document on mount if documentId is provided
	useEffect(() => {
		const loadDocument = async () => {
			if (!documentId) {
				// Wenn keine ID vorhanden ist, versuche das Dokument anhand des Titels zu finden
				// Dies ist für das neue Format [[Dokumenttitel]] ohne ID
				try {
					// Hier müsste eine Funktion implementiert werden, die nach Titel sucht
					// Für jetzt lassen wir es leer, da wir die Vorschau ohne Dokument anzeigen können
					console.log('Suche nach Dokument mit Titel:', documentTitle);
				} catch (error) {
					console.error('Error searching for document by title:', error);
				}
				return;
			}

			try {
				let doc;

				// Prüfe, ob es sich um eine UUID oder eine kurze ID handelt
				const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
					documentId
				);

				if (isUuid) {
					// Wenn es eine UUID ist, verwende getDocumentById
					doc = await getDocumentById(documentId);
				} else {
					// Wenn es eine kurze ID ist, verwende die neue getDocumentByShortId-Funktion
					doc = await getDocumentByShortId(documentId);
				}

				setDocument(doc);
			} catch (error) {
				console.error('Error fetching document:', error);
			}
		};

		loadDocument();
	}, [documentId, documentTitle]);

	// Einfache Funktionen für Hover-Effekte
	const handleMouseEnter = () => {
		if (Platform.OS !== 'web') return;

		console.log('Mouse enter event triggered');

		// Direkte DOM-Manipulation für Web
		if (typeof window !== 'undefined') {
			try {
				// Verwende direkten DOM-Zugriff für Web
				const element = mentionRef.current as any;
				if (element) {
					// Verwende getBoundingClientRect für präzisere Positionierung
					if (element.getBoundingClientRect) {
						const rect = element.getBoundingClientRect();
						const scrollTop = window.scrollY || 0;
						const scrollLeft = window.scrollX || 0;

						// Setze Position relativ zum Viewport
						const newPosition = {
							top: rect.bottom + scrollTop,
							left: rect.left + scrollLeft,
						};

						console.log('Preview position calculated:', newPosition);
						setPreviewPosition(newPosition);
					} else {
						// Fallback für React Native Web
						console.log('Using React Native measure method');
						element.measure?.(
							(
								x: number,
								y: number,
								width: number,
								height: number,
								pageX: number,
								pageY: number
							) => {
								const newPosition = {
									top: pageY + height + 5,
									left: pageX,
								};
								console.log('Preview position from measure:', newPosition);
								setPreviewPosition(newPosition);
							}
						);
					}
				} else {
					console.warn('Reference to element is null');
				}

				// Sofort anzeigen
				console.log('Setting showPreview to true');
				setShowPreview(true);
			} catch (error) {
				console.error('Error measuring element:', error);
				// Fallback
				const newPosition = {
					top: 100,
					left: 20,
				};
				console.log('Using fallback position:', newPosition);
				setPreviewPosition(newPosition);
				setShowPreview(true);
			}
		}
	};

	const handleMouseLeave = () => {
		if (Platform.OS !== 'web') return;

		// Kurze Verzögerung vor dem Ausblenden
		if (previewTimeout.current) {
			clearTimeout(previewTimeout.current);
		}

		previewTimeout.current = setTimeout(() => {
			setShowPreview(false);
		}, 300);
	};

	// Cleanup-Funktion
	useEffect(() => {
		return () => {
			if (previewTimeout.current) {
				clearTimeout(previewTimeout.current);
			}
		};
	}, []);

	return (
		<View>
			<Pressable
				ref={mentionRef}
				onPress={() => {
					// Zeige Modal-Vorschau beim Klicken an
					if (document) {
						setShowModal(true);
					} else if (documentId) {
						// Lade das Dokument, wenn es noch nicht geladen wurde
						getDocumentById(documentId)
							.then((doc) => {
								setDocument(doc);
								setShowModal(true);
							})
							.catch((error) => {
								console.error('Fehler beim Laden des Dokuments:', error);
							});
					} else {
						// Hier könnte eine Suche nach dem Titel implementiert werden
						console.log('Dokument mit Titel anzeigen:', documentTitle);
						// Für jetzt zeigen wir nur den Titel an
						setShowModal(true);
					}
				}}
				onLongPress={() => {
					// Bei langem Drücken direkt zum Dokument navigieren
					if (spaceId && documentId) {
						router.push(`/spaces/${spaceId}/documents/${documentId}`);
					}
				}}
				delayLongPress={500}
				// Web-spezifische Hover-Events
				{...(Platform.OS === 'web'
					? {
							onMouseEnter: handleMouseEnter,
							onMouseLeave: handleMouseLeave,
						}
					: {})}
			>
				<Text
					style={{
						color: isDark ? '#60a5fa' : '#2563eb', // Blau für Links
						textDecorationLine: 'underline',
						fontWeight: '500',
					}}
				>
					{children || documentTitle}
				</Text>
			</Pressable>

			{/* Document preview (shown on hover/press) - direktes Rendering mit fester Position */}
			{showPreview && Platform.OS === 'web' && (
				<div
					style={{
						position: 'fixed',
						top: `${previewPosition.top}px`,
						left: `${previewPosition.left}px`,
						zIndex: 99999, // Sehr hoher z-index
						backgroundColor: isDark ? '#1f2937' : '#ffffff',
						borderRadius: '8px',
						padding: '16px',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
						maxWidth: '350px',
						minWidth: '250px',
						border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
						maxHeight: '300px',
						overflowY: 'auto',
						pointerEvents: 'auto',
					}}
				>
					{document ? (
						<div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
									paddingBottom: '8px',
									marginBottom: '8px',
								}}
							>
								<div
									style={{
										fontSize: '16px',
										fontWeight: 600,
										color: isDark ? '#f3f4f6' : '#1f2937',
									}}
								>
									{document.title}
								</div>
								<div
									style={{
										backgroundColor:
											(document.type === 'context'
												? '#16a34a'
												: document.type === 'prompt'
													? '#d97706'
													: '#4f46e5') + '20',
										padding: '2px 8px',
										borderRadius: '12px',
										fontSize: '12px',
										color:
											document.type === 'context'
												? '#16a34a'
												: document.type === 'prompt'
													? '#d97706'
													: '#4f46e5',
										fontWeight: 500,
									}}
								>
									{document.type === 'text'
										? 'Text'
										: document.type === 'context'
											? 'Kontext'
											: document.type === 'prompt'
												? 'Prompt'
												: 'Dokument'}
								</div>
							</div>
							<div
								style={{
									maxHeight: '200px',
									overflowY: 'auto',
									color: isDark ? '#f3f4f6' : '#1f2937',
									fontSize: '14px',
								}}
							>
								{document.content ? (
									<Markdown
										style={{
											body: { color: isDark ? '#f3f4f6' : '#1f2937' },
											paragraph: { marginVertical: 8 },
											heading1: { fontSize: 18, marginVertical: 8, fontWeight: 'bold' },
											heading2: { fontSize: 16, marginVertical: 6, fontWeight: 'bold' },
											heading3: { fontSize: 14, marginVertical: 4, fontWeight: 'bold' },
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
											link: { color: isDark ? '#60a5fa' : '#2563eb' },
										}}
									>
										{document.content.substring(0, 500) +
											(document.content.length > 500 ? '...' : '')}
									</Markdown>
								) : (
									<Text style={{ fontStyle: 'italic' }}>Kein Inhalt vorhanden</Text>
								)}
							</div>
						</div>
					) : (
						<div style={{ padding: '8px' }}>
							<div style={{ color: isDark ? '#d1d5db' : '#4b5563', fontStyle: 'italic' }}>
								Vorschau wird geladen...
							</div>
							<div
								style={{
									marginTop: '8px',
									fontSize: '14px',
									color: isDark ? '#9ca3af' : '#6b7280',
								}}
							>
								Dokument: {documentTitle}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Modal-Vorschau beim Klicken */}
			<Modal
				visible={showModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowModal(false)}
			>
				<TouchableOpacity
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'center',
						alignItems: 'center',
						padding: 20,
					}}
					activeOpacity={1}
					onPress={() => setShowModal(false)}
				>
					<View
						style={{
							backgroundColor: isDark ? '#1f2937' : '#ffffff',
							borderRadius: 8,
							padding: 16,
							width: '100%',
							maxWidth: 600,
							maxHeight: '80%',
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 3.84,
							elevation: 5,
						}}
						onStartShouldSetResponder={() => true}
						onTouchEnd={(e) => e.stopPropagation()}
					>
						{document ? (
							<>
								<View
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
										marginBottom: 12,
									}}
								>
									<Text
										style={{
											fontSize: 18,
											fontWeight: 'bold',
											color: isDark ? '#f3f4f6' : '#1f2937',
										}}
									>
										{document.title}
									</Text>
									<TouchableOpacity onPress={() => setShowModal(false)}>
										<Text style={{ fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280' }}>
											Schließen
										</Text>
									</TouchableOpacity>
								</View>
								<View style={{ maxHeight: '90%' }}>
									<ScrollView>
										<View
											style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}
										>
											<TouchableOpacity
												onPress={() => setShowModal(false)}
												style={{
													backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
													paddingVertical: 10,
													paddingHorizontal: 20,
													borderRadius: 8,
													marginRight: 10,
												}}
											>
												<Text style={{ color: isDark ? '#f3f4f6' : '#1f2937' }}>Schließen</Text>
											</TouchableOpacity>

											{spaceId && documentId && (
												<TouchableOpacity
													onPress={() => {
														setShowModal(false);
														router.push(`/spaces/${spaceId}/documents/${documentId}`);
													}}
													style={{
														backgroundColor: isDark ? '#2563eb' : '#3b82f6',
														paddingVertical: 10,
														paddingHorizontal: 20,
														borderRadius: 8,
													}}
												>
													<Text style={{ color: '#ffffff' }}>Dokument öffnen</Text>
												</TouchableOpacity>
											)}

											{/* Wenn keine ID vorhanden ist, zeige einen Button zum Suchen nach dem Titel */}
											{spaceId && !documentId && (
												<TouchableOpacity
													onPress={() => {
														setShowModal(false);
														// Hier könnte eine Suche nach dem Titel implementiert werden
														// Für jetzt navigieren wir zur Spaces-Seite
														router.push(
															`/spaces/${spaceId}?search=${encodeURIComponent(documentTitle)}`
														);
													}}
													style={{
														backgroundColor: isDark ? '#2563eb' : '#3b82f6',
														paddingVertical: 10,
														paddingHorizontal: 20,
														borderRadius: 8,
													}}
												>
													<Text style={{ color: '#ffffff' }}>Nach Dokument suchen</Text>
												</TouchableOpacity>
											)}
										</View>
										<Text style={{ color: isDark ? '#f3f4f6' : '#1f2937' }}>
											{document.content}
										</Text>
									</ScrollView>
								</View>
							</>
						) : (
							<Text style={{ color: isDark ? '#f3f4f6' : '#1f2937' }}>
								Dokument wird geladen...
							</Text>
						)}
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
};
