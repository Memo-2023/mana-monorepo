import { useState, useEffect, useCallback, useRef } from 'react';
import {
	View,
	RefreshControl,
	TouchableOpacity,
	useWindowDimensions,
	TextInput,
	Alert,
	Modal,
	Pressable,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '~/components/layout/Screen';
import { Text } from '~/components/ui/Text';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/Button';
import { DocumentCard } from '~/components/documents/DocumentCard';
import { EmptyState } from '~/components/layout/EmptyState';
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs';
import {
	getSpaceById,
	getDocuments,
	getSpaces,
	updateSpace,
	toggleSpacePinned,
	Space,
	Document,
} from '~/services/supabaseService';
import { useTheme } from '~/utils/theme/theme';
import { themes } from '~/utils/theme/colors';
import { useDocumentClasses } from '../[id]/documents/documentStyles';
import { ThemedButton } from '~/components/ui/ThemedButton';
import { DocumentCardDeleteButton } from '~/components/documents/DocumentCardDeleteButton';
import { BatchDocumentCreator } from '~/components/documents/BatchDocumentCreator';
// SpaceEditor-Import entfernt, da die Komponente nicht mehr benötigt wird
import {
	DocumentTypeFilterDropdown,
	FilterType,
} from '~/components/documents/DocumentTypeFilterDropdown';
import { DocumentTagsPills } from '~/components/documents/DocumentTagsPills';
import { SpaceDetailSkeleton } from '~/components/spaces/SpaceDetailSkeleton';
import { Skeleton } from '~/components/ui/Skeleton';
import { DeleteSpaceButton } from '~/components/spaces/DeleteSpaceButton';
import { SpacesLLMToolbar } from '~/components/ai/SpacesLLMToolbar';
import { DocumentSelectionIndicator } from '~/components/documents/DocumentSelectionIndicator';
import { calculateWordCountByDocumentType } from '~/services/wordCountService';

export default function SpaceDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { mode, themeName } = useTheme();
	const { width } = useWindowDimensions();
	const isDark = mode === 'dark';
	const isDesktop = width > 1024;
	const documentClasses = useDocumentClasses();
	const [space, setSpace] = useState<Space | null>(null);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [allSpaces, setAllSpaces] = useState<Space[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [showBatchCreator, setShowBatchCreator] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState('');
	const [editedDescription, setEditedDescription] = useState('');
	const [selectedDocumentType, setSelectedDocumentType] = useState<FilterType | null>(null);
	const [allDocumentTags, setAllDocumentTags] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	// Auswahlmodus ist jetzt immer aktiv
	const [selectionMode, setSelectionMode] = useState(true);
	const [selectedDocuments, setSelectedDocuments] = useState<
		Array<{ id: string; title: string; content: string; type: string }>
	>([]);
	const [showMoreOptions, setShowMoreOptions] = useState(false);
	const moreButtonRef = useRef<View>(null);
	const [wordCounts, setWordCounts] = useState({
		total: 0,
		text: 0,
		context: 0,
		prompt: 0,
		readingTime: 0,
	});
	const [moreButtonPosition, setMoreButtonPosition] = useState({ top: 0, right: 0 });

	const [isGenerating, setIsGenerating] = useState(false);

	// Hilfsfunktion zum Abrufen von Theme-Farben
	const getThemeColor = (theme: string, shade: number): string => {
		if (themes[theme as keyof typeof themes]) {
			const themeObj = themes[theme as keyof typeof themes];
			if (themeObj.primary && themeObj.primary[shade as keyof typeof themeObj.primary]) {
				// Entferne das # vom Farbcode
				return themeObj.primary[shade as keyof typeof themeObj.primary].substring(1);
			}
		}
		// Fallback auf Indigo-Farben
		const indigoColors: { [key: number]: string } = {
			400: '818cf8',
			500: '6366f1',
			600: '4f46e5',
		};
		return indigoColors[shade] || '6366f1';
	};

	// Funktion zum Laden der Space-Details
	const loadSpaceDetails = useCallback(async () => {
		if (!id) {
			setError('Keine Space-ID gefunden');
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			// Aktuellen Space laden
			const space = await getSpaceById(id);

			if (!space) {
				setError('Space nicht gefunden');
				return;
			}

			// Dokumente im Space abrufen
			const docs = await getDocuments(id);

			// Alle Spaces abrufen für das Dropdown
			const spaces = await getSpaces();

			// Lade die Dokumente
			setDocuments(docs);

			// Sammle alle einzigartigen Tags aus den Dokumenten
			const allTags: string[] = [];
			docs.forEach((doc) => {
				if (doc.metadata?.tags && Array.isArray(doc.metadata.tags)) {
					doc.metadata.tags.forEach((tag: string) => {
						if (!allTags.includes(tag)) {
							allTags.push(tag);
						}
					});
				}
			});
			setAllDocumentTags(allTags.sort());

			// Lade die Wortanzahl
			const counts = await calculateWordCountByDocumentType(id);
			setWordCounts(counts);

			setSpace(space);
			setAllSpaces(spaces);
		} catch (err: any) {
			setError(`Unerwarteter Fehler: ${err.message}`);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [id]);

	// Lade die Space-Details beim ersten Rendern
	useEffect(() => {
		loadSpaceDetails();
	}, [loadSpaceDetails]);

	// Funktion zum Aktualisieren der Space-Details (Pull-to-Refresh)
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		loadSpaceDetails();
	}, [loadSpaceDetails]);

	// Funktion zum Erstellen eines neuen Dokuments in diesem Space
	const handleCreateDocument = () => {
		// Verwende die kombinierte Dokument-Seite mit 'create' als documentId und mode=edit
		// um direkt in den Bearbeitungsmodus zu gelangen
		router.push(`/spaces/${id}/documents/create?mode=edit`);
	};

	// Funktion zum Anzeigen/Bearbeiten eines Dokuments
	const handleViewDocument = (documentId: string) => {
		router.push(`/spaces/${id}/documents/${documentId}`);
	};

	// Funktion zum Bearbeiten des Space
	const handleEditSpace = () => {
		setEditedName(space?.name || '');
		setEditedDescription(space?.description || '');
		setIsEditing(true);
	};

	// Funktion zum Speichern der Änderungen
	const handleSaveSpace = async () => {
		if (!editedName.trim()) {
			Alert.alert('Fehler', 'Der Name darf nicht leer sein.');
			return;
		}

		try {
			const { success, error } = await updateSpace(id, {
				name: editedName,
				description: editedDescription || null,
			});

			if (success) {
				// Aktualisiere den Space im State
				if (space) {
					setSpace({
						...space,
						name: editedName,
						description: editedDescription || null,
					});
				}
				setIsEditing(false);
			} else {
				Alert.alert('Fehler', `Space konnte nicht aktualisiert werden: ${error}`);
			}
		} catch (error) {
			console.error('Fehler beim Aktualisieren des Space:', error);
			Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
		}
	};

	// Funktion zum Abbrechen der Bearbeitung
	const handleCancelEdit = () => {
		setIsEditing(false);
	};

	// Funktion zum Löschen des Space
	const handleDeleteSpace = () => {
		// Nach dem Löschen zur Spaces-Übersicht navigieren
		router.replace('/');
	};

	// Funktion zum Umschalten des Pinned-Status
	const handleTogglePinned = async () => {
		if (!space) return;

		try {
			const newPinnedStatus = !space.pinned;
			const { success, error } = await toggleSpacePinned(id, newPinnedStatus);

			if (success) {
				// Aktualisiere den Space im State
				setSpace({
					...space,
					pinned: newPinnedStatus,
				});
			} else {
				Alert.alert('Fehler', `Status konnte nicht aktualisiert werden: ${error}`);
			}
		} catch (error) {
			console.error('Fehler beim Aktualisieren des Pinned-Status:', error);
			Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
		}
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: space?.name || 'Space-Details',
					headerShown: true,
				}}
			/>

			<View
				className="flex-1 flex-col h-full"
				style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
			>
				{/* Header mit Breadcrumbs und Aktionsbuttons */}
				<View
					className={documentClasses.breadcrumbsContainer}
					style={{
						backgroundColor: isDark ? '#111827' : '#f9fafb',
						borderBottomColor: isDark ? '#374151' : '#e5e7eb',
						borderBottomWidth: 1,
					}}
				>
					<View
						style={{
							maxWidth: isDesktop ? 800 : '100%',
							width: '100%',
							marginHorizontal: 'auto',
							paddingHorizontal: 16,
						}}
					>
						{width > 640 ? (
							// Layout für breite Bildschirme: Breadcrumbs und Toolbar nebeneinander
							<View
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
									alignItems: 'center',
									width: '100%',
									flexWrap: 'nowrap',
								}}
							>
								{/* Linke Seite - Breadcrumbs */}
								<View style={{ flex: 1 }}>
									{loading ? (
										<Breadcrumbs
											items={[{ label: 'Spaces', href: '/' }, { label: '...' }]}
											className="justify-start"
											loading={true}
										/>
									) : !error && space ? (
										<Breadcrumbs
											items={[
												{ label: 'Spaces', href: '/' },
												{
													label: space.name,
													dropdownItems: allSpaces.map((s) => ({
														id: s.id,
														label: s.name,
														href: `/spaces/${s.id}`,
													})),
												},
											]}
											className="justify-start"
										/>
									) : (
										<Breadcrumbs
											items={[{ label: 'Spaces', href: '/' }, { label: 'Fehler' }]}
											className="justify-start"
										/>
									)}
								</View>

								{/* Rechte Seite - Aktionsbuttons */}
								{!loading && !error && space && (
									<View
										style={{
											flexDirection: 'row',
											justifyContent: 'flex-end',
											alignItems: 'center',
											flex: 1,
										}}
									>
										<ThemedButton
											title="Neu"
											onPress={handleCreateDocument}
											variant="primary"
											iconName="add-outline"
											style={{ marginRight: 8 }}
										/>
										<ThemedButton
											title="Mehrere"
											onPress={() => setShowBatchCreator(true)}
											variant="secondary"
											iconName="add-outline"
											tooltip="Mehrere Dokumente mit KI erstellen"
											style={{ marginRight: 8 }}
										/>
										<TouchableOpacity
											ref={moreButtonRef}
											style={{
												backgroundColor: isDark ? '#374151' : '#f3f4f6',
												borderRadius: 8,
												padding: 8,
												marginRight: 8,
												justifyContent: 'center',
												alignItems: 'center',
											}}
											onPress={() => {
												if (moreButtonRef.current) {
													moreButtonRef.current.measure(
														(
															x: number,
															y: number,
															width: number,
															height: number,
															pageX: number,
															pageY: number
														) => {
															setMoreButtonPosition({ top: pageY + height, right: width });
															setShowMoreOptions(true);
														}
													);
												}
											}}
										>
											<Ionicons
												name="ellipsis-horizontal"
												size={20}
												color={isDark ? '#d1d5db' : '#4b5563'}
											/>
										</TouchableOpacity>
										<View style={{ flex: 1 }} />
										<DocumentTypeFilterDropdown
											selectedType={selectedDocumentType}
											onTypeChange={setSelectedDocumentType}
										/>
									</View>
								)}
							</View>
						) : (
							// Layout für schmale Bildschirme: Breadcrumbs und Toolbar untereinander
							<>
								{/* Breadcrumbs */}
								<View style={{ marginBottom: 8 }}>
									{loading ? (
										<Breadcrumbs
											items={[{ label: 'Spaces', href: '/' }, { label: '...' }]}
											className="justify-start"
											loading={true}
										/>
									) : !error && space ? (
										<Breadcrumbs
											items={[
												{ label: 'Spaces', href: '/' },
												{
													label: space.name,
													dropdownItems: allSpaces.map((s) => ({
														id: s.id,
														label: s.name,
														href: `/spaces/${s.id}`,
													})),
												},
											]}
											className="justify-start"
										/>
									) : (
										<Breadcrumbs
											items={[{ label: 'Spaces', href: '/' }, { label: 'Fehler' }]}
											className="justify-start"
										/>
									)}
								</View>

								{/* Aktionsbuttons */}
								{!loading && !error && space && (
									<View
										style={{
											flexDirection: 'row',
											justifyContent: 'flex-start',
											alignItems: 'center',
											flexWrap: 'wrap',
											marginBottom: 8,
										}}
									>
										<ThemedButton
											title="Neu"
											onPress={handleCreateDocument}
											variant="primary"
											iconName="add-outline"
											style={{ marginRight: 8, marginBottom: 8 }}
										/>
										<ThemedButton
											title="Mehrere"
											onPress={() => setShowBatchCreator(true)}
											variant="secondary"
											iconName="add-outline"
											tooltip="Mehrere Dokumente mit KI erstellen"
											style={{ marginRight: 8, marginBottom: 8 }}
										/>
										<TouchableOpacity
											ref={moreButtonRef}
											style={{
												backgroundColor: isDark ? '#374151' : '#f3f4f6',
												borderRadius: 8,
												padding: 8,
												marginRight: 8,
												marginBottom: 8,
												justifyContent: 'center',
												alignItems: 'center',
											}}
											onPress={() => {
												if (moreButtonRef.current) {
													moreButtonRef.current.measure(
														(
															x: number,
															y: number,
															width: number,
															height: number,
															pageX: number,
															pageY: number
														) => {
															setMoreButtonPosition({ top: pageY + height, right: width });
															setShowMoreOptions(true);
														}
													);
												}
											}}
										>
											<Ionicons
												name="ellipsis-horizontal"
												size={20}
												color={isDark ? '#d1d5db' : '#4b5563'}
											/>
										</TouchableOpacity>
										<View style={{ flex: 1 }} />
										<DocumentTypeFilterDropdown
											selectedType={selectedDocumentType}
											onTypeChange={setSelectedDocumentType}
										/>
									</View>
								)}
							</>
						)}
					</View>
				</View>

				<Screen
					scrollable
					padded={false} // Deaktiviere das Padding der Screen-Komponente
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							colors={[`#${getThemeColor(themeName, 500)}`]}
							tintColor={`#${getThemeColor(themeName, 500)}`}
						/>
					}
				>
					{loading ? (
						<SpaceDetailSkeleton documentCount={3} />
					) : error ? (
						<View
							style={{
								marginBottom: 16,
								padding: 12,
								backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
								borderRadius: 8,
							}}
						>
							<Text style={{ color: isDark ? '#fecaca' : '#991b1b' }}>{error}</Text>
							<ThemedButton
								title="Zurück"
								onPress={() => router.back()}
								variant="secondary"
								style={{ marginTop: 16 }}
							/>
						</View>
					) : space ? (
						<View
							style={{
								maxWidth: isDesktop ? 800 : '100%',
								width: '100%',
								marginHorizontal: 'auto',
								paddingHorizontal: 16, // Setze das horizontale Padding im Hauptcontainer
							}}
						>
							{/* Space-Informationen */}
							<View style={{ marginTop: 40, marginBottom: 32 }}>
								{isEditing ? (
									<TextInput
										value={editedName}
										onChangeText={setEditedName}
										style={{
											fontSize: 36,
											fontWeight: 'bold',
											marginBottom: 12,
											color: isDark ? '#f9fafb' : '#111827',
											borderWidth: 1,
											borderColor: isDark ? '#374151' : '#d1d5db',
											borderRadius: 4,
											padding: 8,
											backgroundColor: isDark ? '#1f2937' : '#ffffff',
										}}
										placeholder="Space-Name"
									/>
								) : (
									<Text
										style={{
											fontSize: 36,
											fontWeight: 'bold',
											marginBottom: 12,
											color: isDark ? '#f9fafb' : '#111827',
										}}
									>
										{space.name}
									</Text>
								)}

								{/* Metadaten-Anzeige unter der Headline */}
								{!isEditing && (
									<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
										{/* Dokumentenanzahl - immer angezeigt */}
										<View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
											<Text
												style={{
													fontSize: 14,
													fontWeight: '400',
													opacity: 0.7,
													color: isDark ? '#9ca3af' : '#6b7280',
												}}
											>
												{documents.length} Dokument{documents.length !== 1 ? 'e' : ''}
											</Text>
										</View>

										{/* Punkt nach Dokumentenanzahl */}
										<Text
											style={{
												fontSize: 14,
												opacity: 0.7,
												color: isDark ? '#9ca3af' : '#6b7280',
												marginRight: 8,
											}}
										>
											•
										</Text>

										{/* Originaldokumente - immer angezeigt */}
										<View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
											<Text
												style={{
													fontSize: 14,
													fontWeight: '400',
													opacity: 0.7,
													color: isDark ? '#9ca3af' : '#6b7280',
												}}
											>
												{documents.filter((doc) => doc.type === 'text').length} Original
											</Text>
										</View>

										{/* Generierte Dokumente - nur angezeigt, wenn vorhanden */}
										{documents.filter(
											(doc) =>
												doc.type === 'text' && (doc as any).settings?.source === 'ai_analysis'
										).length > 0 && (
											<>
												<Text
													style={{
														fontSize: 14,
														opacity: 0.7,
														color: isDark ? '#9ca3af' : '#6b7280',
														marginRight: 8,
													}}
												>
													•
												</Text>
												<View
													style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}
												>
													<Text
														style={{
															fontSize: 14,
															fontWeight: '400',
															opacity: 0.7,
															color: isDark ? '#9ca3af' : '#6b7280',
														}}
													>
														{
															documents.filter(
																(doc) =>
																	doc.type === 'text' &&
																	(doc as any).settings?.source === 'ai_analysis'
															).length
														}{' '}
														Generiert
													</Text>
												</View>
											</>
										)}

										{/* Kontextdokumente - nur angezeigt, wenn vorhanden */}
										{documents.filter((doc) => doc.type === 'context').length > 0 && (
											<>
												<Text
													style={{
														fontSize: 14,
														opacity: 0.7,
														color: isDark ? '#9ca3af' : '#6b7280',
														marginRight: 8,
													}}
												>
													•
												</Text>

												<View
													style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}
												>
													<Text
														style={{
															fontSize: 14,
															fontWeight: '400',
															opacity: 0.7,
															color: isDark ? '#9ca3af' : '#6b7280',
														}}
													>
														{documents.filter((doc) => doc.type === 'context').length} Kontext
													</Text>
												</View>
											</>
										)}

										{/* Punkt vor Wortanzahl */}
										<Text
											style={{
												fontSize: 14,
												opacity: 0.7,
												color: isDark ? '#9ca3af' : '#6b7280',
												marginRight: 8,
											}}
										>
											•
										</Text>

										{/* Wortanzahl - immer angezeigt */}
										<View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
											<Text
												style={{
													fontSize: 14,
													fontWeight: '400',
													opacity: 0.7,
													color: isDark ? '#9ca3af' : '#6b7280',
												}}
											>
												{wordCounts.total.toLocaleString('de-DE')} Wörter
											</Text>
										</View>

										{/* Punkt vor Lesezeit */}
										<Text
											style={{
												fontSize: 14,
												opacity: 0.7,
												color: isDark ? '#9ca3af' : '#6b7280',
												marginRight: 8,
											}}
										>
											•
										</Text>

										{/* Lesezeit - immer angezeigt */}
										<View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
											<Text
												style={{
													fontSize: 14,
													fontWeight: '400',
													opacity: 0.7,
													color: isDark ? '#9ca3af' : '#6b7280',
												}}
											>
												{wordCounts.readingTime} Min. Lesezeit
											</Text>
										</View>
									</View>
								)}
								{isEditing ? (
									<TextInput
										value={editedDescription}
										onChangeText={setEditedDescription}
										style={{
											fontSize: 16,
											marginBottom: 16,
											color: isDark ? '#d1d5db' : '#4b5563',
											borderWidth: 1,
											borderColor: isDark ? '#374151' : '#d1d5db',
											borderRadius: 4,
											padding: 8,
											backgroundColor: isDark ? '#1f2937' : '#ffffff',
											minHeight: 80,
											textAlignVertical: 'top',
										}}
										placeholder="Beschreibung (optional)"
										multiline
									/>
								) : (
									space.description && (
										<Text
											style={{
												fontSize: 16,
												marginBottom: 16,
												color: isDark ? '#d1d5db' : '#4b5563',
											}}
										>
											{space.description}
										</Text>
									)
								)}

								<View className="flex-row flex-wrap gap-2 mb-1">
									{space.settings?.tags &&
										space.settings.tags.map((tag: string, index: number) => (
											<View
												key={index}
												style={{
													backgroundColor: isDark
														? `#${getThemeColor(themeName, 900)}`
														: `#${getThemeColor(themeName, 100)}`,
													paddingHorizontal: 8,
													paddingVertical: 4,
													borderRadius: 9999,
												}}
											>
												<Text
													style={{
														color: isDark
															? `#${getThemeColor(themeName, 200)}`
															: `#${getThemeColor(themeName, 800)}`,
														fontSize: 12,
													}}
												>
													{tag}
												</Text>
											</View>
										))}
								</View>

								{isEditing && (
									<View className="flex-row justify-end items-center space-x-2 mb-4">
										<ThemedButton
											title="Abbrechen"
											onPress={handleCancelEdit}
											variant="secondary"
										/>
										<ThemedButton title="Speichern" onPress={handleSaveSpace} variant="primary" />
									</View>
								)}
							</View>

							{/* Dokumente */}
							<View style={{ marginBottom: 150 }}>
								{/* Aktionsbuttons wurden in den Header verschoben */}

								{documents.length > 0 ? (
									<View>
										{/* Tag-Filter als horizontale Pills */}
										<DocumentTagsPills
											allTags={allDocumentTags}
											selectedTags={selectedTags}
											onTagsChange={setSelectedTags}
											disabled={loading}
										/>

										{documents
											.filter(
												(doc) =>
													(!selectedDocumentType || doc.type === selectedDocumentType) &&
													(selectedTags.length === 0 ||
														(doc.metadata?.tags &&
															selectedTags.every((tag) => doc.metadata?.tags?.includes(tag))))
											)
											.map((doc) => (
												<View key={doc.id} style={{ position: 'relative', marginBottom: 16 }}>
													<DocumentSelectionIndicator
														isSelected={selectedDocuments.some((d) => d.id === doc.id)}
														onToggle={() => {
															if (selectedDocuments.some((d) => d.id === doc.id)) {
																setSelectedDocuments(
																	selectedDocuments.filter((d) => d.id !== doc.id)
																);
															} else {
																setSelectedDocuments([
																	...selectedDocuments,
																	{
																		id: doc.id,
																		title: doc.title,
																		content: doc.content || '',
																		type: doc.type,
																	},
																]);
															}
														}}
													/>
													<View style={{ marginRight: 40 }}>
														<DocumentCard
															id={doc.id}
															title={doc.title}
															content={doc.content || undefined}
															type={doc.type as 'original' | 'generated' | 'context' | 'prompt'}
															created_at={doc.created_at}
															pinned={doc.pinned || false}
															metadata={doc.metadata} // Übergabe der Metadaten inklusive Tags
															onPress={() => handleViewDocument(doc.id)}
															onDelete={() => {
																// Dokument aus der Liste entfernen
																setDocuments((prevDocs) => prevDocs.filter((d) => d.id !== doc.id));
															}}
															onPinToggle={(pinned) => {
																// Aktualisiere den Pin-Status in der lokalen Liste und sortiere neu
																setDocuments((prevDocs) => {
																	// Erst den Pin-Status aktualisieren
																	const updatedDocs = prevDocs.map((d) =>
																		d.id === doc.id ? { ...d, pinned } : d
																	);

																	// Dann nach Pin-Status und Aktualisierungsdatum sortieren
																	return [...updatedDocs].sort((a, b) => {
																		// Zuerst nach Pin-Status sortieren (angepinnte zuerst)
																		if ((a.pinned || false) && !(b.pinned || false)) return -1;
																		if (!(a.pinned || false) && (b.pinned || false)) return 1;

																		// Bei gleichem Pin-Status nach Aktualisierungsdatum sortieren (neueste zuerst)
																		const dateA = new Date(a.updated_at || a.created_at);
																		const dateB = new Date(b.updated_at || b.created_at);
																		return dateB.getTime() - dateA.getTime();
																	});
																});
															}}
															showDeleteButton={true}
														/>
													</View>
												</View>
											))}
									</View>
								) : (
									<View
										style={{
											alignItems: 'center',
											justifyContent: 'center',
											padding: 32,
											backgroundColor: isDark ? '#1f2937' : '#f9fafb',
											borderWidth: 1,
											borderColor: isDark ? '#374151' : '#e5e7eb',
											borderRadius: 8,
											marginTop: 16,
										}}
									>
										<Ionicons
											name="document-outline"
											size={48}
											color={isDark ? '#9ca3af' : '#6b7280'}
										/>
										<Text
											style={{
												fontSize: 18,
												fontWeight: 'bold',
												color: isDark ? '#f9fafb' : '#111827',
												marginTop: 16,
												marginBottom: 8,
											}}
										>
											Keine Dokumente vorhanden
										</Text>
										<Text
											style={{
												fontSize: 14,
												color: isDark ? '#d1d5db' : '#4b5563',
												textAlign: 'center',
											}}
										>
											Erstelle ein neues Dokument, um loszulegen.
										</Text>
										<ThemedButton
											title="Dokument erstellen"
											onPress={handleCreateDocument}
											variant="primary"
											iconName="add-outline"
											style={{ marginTop: 16 }}
										/>
									</View>
								)}
							</View>
						</View>
					) : null}
				</Screen>
			</View>

			{/* LLM-Toolbar für die Dokumentanalyse */}
			{!loading && space && (
				<SpacesLLMToolbar
					spaceId={id}
					documents={documents.map((doc) => ({
						id: doc.id,
						title: doc.title,
						content: doc.content || '',
						type: doc.type,
					}))}
					isGenerating={isGenerating}
					setIsGenerating={setIsGenerating}
					onDocumentCreated={loadSpaceDetails}
					selectionMode={selectionMode}
					setSelectionMode={setSelectionMode}
					selectedDocuments={selectedDocuments}
					setSelectedDocuments={setSelectedDocuments}
				/>
			)}

			{/* Batch Creator Modal */}
			<BatchDocumentCreator
				visible={showBatchCreator}
				onClose={() => setShowBatchCreator(false)}
				spaceId={id}
				onDocumentsCreated={loadSpaceDetails}
			/>

			{/* Space Editor Modal wurde entfernt, da die Bearbeitung direkt in der Seite erfolgt */}

			{/* Mehr-Optionen Dropdown */}
			<Modal
				transparent={true}
				visible={showMoreOptions}
				animationType="fade"
				onRequestClose={() => setShowMoreOptions(false)}
			>
				<Pressable
					style={{
						flex: 1,
						backgroundColor: 'rgba(0, 0, 0, 0.2)',
					}}
					onPress={() => setShowMoreOptions(false)}
				>
					<View
						style={{
							position: 'absolute',
							top: moreButtonPosition.top,
							right: 16,
							backgroundColor: isDark ? '#1f2937' : '#ffffff',
							borderRadius: 8,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.25,
							shadowRadius: 3.84,
							elevation: 5,
							padding: 8,
							width: 250,
						}}
					>
						<TouchableOpacity
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								padding: 12,
								borderRadius: 6,
								backgroundColor: isDark ? '#1f2937' : '#ffffff',
							}}
							onPress={() => {
								setShowMoreOptions(false);
								handleEditSpace();
							}}
						>
							<Ionicons
								name="pencil-outline"
								size={20}
								color={isDark ? '#d1d5db' : '#4b5563'}
								style={{ marginRight: 12 }}
							/>
							<Text style={{ color: isDark ? '#f9fafb' : '#111827' }}>Space bearbeiten</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								padding: 12,
								borderRadius: 6,
								backgroundColor: isDark ? '#1f2937' : '#ffffff',
							}}
							onPress={() => {
								setShowMoreOptions(false);
								handleTogglePinned();
							}}
						>
							<Ionicons
								name={space?.pinned ? 'pin' : 'pin-outline'}
								size={20}
								color={
									space?.pinned ? (isDark ? '#3b82f6' : '#2563eb') : isDark ? '#d1d5db' : '#4b5563'
								}
								style={{ marginRight: 12 }}
							/>
							<Text style={{ color: isDark ? '#f9fafb' : '#111827' }}>
								{space?.pinned ? 'Space von Startseite entfernen' : 'Space auf Startseite anzeigen'}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								padding: 12,
								borderRadius: 6,
								backgroundColor: isDark ? '#1f2937' : '#ffffff',
							}}
							onPress={() => {
								setShowMoreOptions(false);
								// Bestätigungsdialog für das Löschen anzeigen
								Alert.alert(
									'Space löschen',
									`Möchtest du den Space "${space?.name || ''}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
									[
										{
											text: 'Abbrechen',
											style: 'cancel',
										},
										{
											text: 'Löschen',
											onPress: handleDeleteSpace,
											style: 'destructive',
										},
									]
								);
							}}
						>
							<Ionicons
								name="trash-outline"
								size={20}
								color={isDark ? '#ef4444' : '#dc2626'}
								style={{ marginRight: 12 }}
							/>
							<Text style={{ color: isDark ? '#ef4444' : '#dc2626' }}>Space löschen</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Modal>
		</>
	);
}
