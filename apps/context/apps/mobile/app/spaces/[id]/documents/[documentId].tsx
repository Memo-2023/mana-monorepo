import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	TextInput,
	ScrollView,
	Dimensions,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	Switch,
	Text as RNText,
	useWindowDimensions,
	NativeSyntheticEvent,
	NativeScrollEvent,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

import { HighlightedMentionInput } from '~/components/mentions/HighlightedMentionInput';
import { MentionHighlighter } from '~/components/mentions/MentionHighlighter';
import { Screen } from '~/components/layout/Screen';
import { Text } from '~/components/ui/Text';
import { Button } from '~/components/Button';
import { Card } from '~/components/ui/Card';
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs';
import {
	getDocumentById,
	updateDocument,
	createDocument,
	getDocumentVersions,
	getAdjacentDocumentVersion,
	toggleDocumentPinned,
	Document,
	getDocuments,
	getCurrentUser,
	getSpaceById,
	saveDocumentTags,
} from '~/services/supabaseService';

import { documentStyles, useDocumentClasses } from './documentStyles';
import { BottomLLMToolbar } from '~/components/ai/BottomLLMToolbar';

import { VariantCreator } from '~/components/variants/VariantCreator';
import { VersionNavigator } from '~/components/documents/VersionNavigator';
import { DocumentHeader } from '~/components/documents/DocumentHeader';
import { DocumentTypeDropdown, DocumentType } from '~/components/documents/DocumentTypeDropdown';
import { DocumentSkeleton } from '~/components/documents/DocumentSkeleton';
import { Skeleton } from '~/components/ui/Skeleton';
import { DocumentTagsEditor } from '~/components/documents/DocumentTagsEditor';
import {
	SaveStateIndicator,
	SaveStateIndicatorMinimal,
} from '~/components/documents/SaveStateIndicator';
import { MentionRenderer } from '~/components/mentions/MentionRenderer';
import { MentionTextInput } from '~/components/mentions/MentionTextInput';
import { ThemedButton } from '~/components/ui/ThemedButton';
import { useDocumentSave } from '~/hooks/useDocumentSave';
import { extractTitleFromMarkdown } from '~/utils/markdown';
import { processAIContentBlocks } from '~/utils/markdownProcessor';
import { processMentionsInMarkdown } from '~/utils/mentionProcessor';
import { useTheme, twMerge } from '~/utils/theme';
import { themes } from '~/utils/theme/colors';

// Globaler Stil für das Entfernen der blauen Fokus-Outline
if (typeof document !== 'undefined') {
	const style = document.createElement('style');
	style.textContent = `
    .editor-no-focus-outline {
      outline: none !important;
      box-shadow: none !important;
    }
    .editor-no-focus-outline:focus {
      outline: none !important;
      box-shadow: none !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
    }
  `;
	document.head.appendChild(style);
}

// Definiere globalen CSS-Style für sanfte Überblendungen und Erfolgsmeldungen
if (typeof window !== 'undefined' && typeof document !== 'undefined' && document) {
	// Prüfe, ob das Style-Element bereits existiert
	if (!document.getElementById('document-animations-style')) {
		const style = document.createElement('style');
		style.id = 'document-animations-style';
		style.textContent = `
      .document-container {
        transition: opacity 0.3s ease-in-out;
      }
      .document-tags-editor {
        transition: background-color 0.3s ease-in-out;
      }
      .highlight-success {
        background-color: rgba(0, 255, 0, 0.1);
      }
    `;
		document.head.appendChild(style);
	}
}

export default function DocumentScreen() {
	const router = useRouter();
	const {
		id: spaceId,
		documentId,
		mode: urlMode,
	} = useLocalSearchParams<{ id: string; documentId: string; mode?: string }>();
	const isNewDocument = documentId === 'create';
	const { mode, themeName } = useTheme();
	const { width } = useWindowDimensions();
	const isDesktop = width > 1024;
	const isDark = mode === 'dark';
	const documentClasses = useDocumentClasses();

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

	const [document, setDocument] = useState<Document | null>(null);
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
		isNewDocument ? null : documentId
	);
	const [showPreview, setShowPreview] = useState(urlMode === 'preview');

	// Removed showHorizontalView state
	const [spaceDocuments, setSpaceDocuments] = useState<Document[]>([]);
	const [nextDocument, setNextDocument] = useState<Document | null>(null);
	const [showNextDocumentPreview, setShowNextDocumentPreview] = useState(false);
	// Removed editingDocIds state
	const [spaceName, setSpaceName] = useState<string>('');

	const [showVariantCreator, setShowVariantCreator] = useState(false);
	const [isGeneratingText, setIsGeneratingText] = useState(false);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [tags, setTags] = useState<string[]>([]);
	const [metadata, setMetadata] = useState<any>({});
	// Initialisiere showTagsEditor basierend auf dem gespeicherten Zustand
	const [showTagsEditor, setShowTagsEditor] = useState(false);

	// Use the new document save hook
	const {
		saveState,
		lastSavedAt,
		hasUnsavedChanges,
		error: saveError,
		saveDocument,
		setSaveState,
	} = useDocumentSave({
		documentId: currentDocumentId,
		content,
		title,
		tags,
		metadata,
		isNewDocument: isNewDocument && !currentDocumentId,
		spaceId,
		minContentLength: 50,
		debounceDelay: 3000,
		onDocumentCreated: (newDocumentId) => {
			console.log('Document created with ID:', newDocumentId);
			setCurrentDocumentId(newDocumentId);
			// Update URL without page reload
			if (Platform.OS === 'web') {
				window.history.replaceState({}, '', `/spaces/${spaceId}/documents/${newDocumentId}`);
			}
		},
		onSaveSuccess: () => {
			console.log('Save successful');
		},
		onSaveError: (error) => {
			console.error('Save error:', error);
			setError(error);
		},
	});

	// Refs für die Eingabefelder und ScrollView
	const titleInputRef = useRef<TextInput>(null);
	const contentInputRef = useRef<TextInput>(null);
	const scrollViewRef = useRef<ScrollView>(null);

	// Für sanfte Überblendung beim Laden
	const [fadeIn, setFadeIn] = useState(false);

	// Stelle den Zustand des Tag-Editors wieder her und aktiviere sanfte Überblendung
	useEffect(() => {
		// Prüfe, ob der Tag-Editor geöffnet sein sollte
		if (Platform.OS === 'web' && typeof window !== 'undefined') {
			try {
				const savedTagsEditorState = sessionStorage.getItem('showTagsEditor');
				if (savedTagsEditorState === 'true') {
					setShowTagsEditor(true);
					// Lösche den gespeicherten Zustand, damit er nicht bei jedem Laden wiederhergestellt wird
					sessionStorage.removeItem('showTagsEditor');
				}
			} catch (error) {
				console.log('Fehler beim Zugriff auf sessionStorage:', error);
			}
		}

		// Aktiviere sanfte Überblendung nach kurzem Delay
		setTimeout(() => {
			setFadeIn(true);
		}, 10);
	}, []);

	// Lade das Dokument, wenn es sich nicht um ein neues handelt
	useEffect(() => {
		if (!isNewDocument) {
			loadDocument();
		} else {
			setLoading(false);
			// Wenn es ein neues Dokument ist und der URL-Parameter mode=edit ist,
			// setze den Bearbeitungsmodus
			if (urlMode === 'edit') {
				setShowPreview(false);
			}
		}

		// Lade alle Dokumente des Spaces und den Space-Namen
		loadSpaceDocuments();
		loadSpaceName();

		// Lade den aktuellen Benutzer
		const loadUser = async () => {
			const user = await getCurrentUser();
			setCurrentUser(user);
		};

		loadUser();
	}, [documentId, spaceId, urlMode]);

	// Lade den Space-Namen
	const loadSpaceName = async () => {
		try {
			if (!spaceId) return;

			const space = await getSpaceById(spaceId);
			if (space) {
				setSpaceName(space.name);
			}
		} catch (err) {
			console.error('Fehler beim Laden des Space-Namens:', err);
		}
	};

	// Funktion zum Laden aller Dokumente des Spaces
	const loadSpaceDocuments = async () => {
		try {
			if (!spaceId) return;

			const documents = await getDocuments(spaceId);
			setSpaceDocuments(documents);

			// Finde das nächste Dokument in der Liste
			if (!isNewDocument && documents.length > 1) {
				const currentIndex = documents.findIndex((doc) => doc.id === documentId);
				if (currentIndex !== -1) {
					// Nimm das nächste Dokument oder das erste, wenn wir am Ende sind
					const nextIndex = (currentIndex + 1) % documents.length;
					setNextDocument(documents[nextIndex]);
				} else {
					setNextDocument(null);
				}
			} else {
				setNextDocument(null);
			}
		} catch (err) {
			console.error('Fehler beim Laden der Space-Dokumente:', err);
		}
	};

	// Funktion zum Laden des Dokuments
	const loadDocument = async () => {
		try {
			setLoading(true);
			setError(null);

			const doc = await getDocumentById(documentId);

			if (!doc) {
				setError('Dokument nicht gefunden');
				return;
			}

			setDocument(doc);
			setTitle(doc.title || '');
			setContent(doc.content || '');
			// Lade Tags aus den Metadaten, falls vorhanden
			setTags(doc.metadata?.tags || []);
			setMetadata(doc.metadata || {});

			// Standardmäßig im Bearbeitungsmodus öffnen
			setShowPreview(false);
		} catch (err: any) {
			setError(`Fehler beim Laden des Dokuments: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Funktion zum Einfügen von generiertem Text
	const handleInsertGeneratedText = (text: string) => {
		setContent((prev) => prev + '\n\n' + text);
	};

	// Funktion zum Einfügen von KI-generiertem Text aus der Bottom-Toolbar
	const handleInsertLLMGeneratedText = (generatedText: string, mode: 'append' | 'replace') => {
		// Aktuellen Inhalt holen
		const currentContent = content || '';

		// Direkt den mode-Parameter verwenden
		if (mode === 'replace') {
			// Dokument komplett ersetzen
			setContent(generatedText);
			return;
		}

		// Für Abwärtskompatibilität: Prüfen, ob spezielle Marker vorhanden sind
		if (generatedText.startsWith('__INSERT_AT_BEGINNING__')) {
			// Text am Anfang einfügen
			const textToInsert = generatedText.replace('__INSERT_AT_BEGINNING__', '');
			const newContent = textToInsert + currentContent;
			setContent(newContent);
			return;
		}

		if (generatedText.startsWith('__INSERT_AT_END__') || mode === 'append') {
			// Text am Ende einfügen
			const textToInsert = generatedText.startsWith('__INSERT_AT_END__')
				? generatedText.replace('__INSERT_AT_END__', '')
				: generatedText;
			const newContent = currentContent + '\n\n' + textToInsert;
			setContent(newContent);
			return;
		}

		if (generatedText.startsWith('__REPLACE_DOCUMENT__')) {
			// Dokument ersetzen (Legacy-Unterstützung)
			const textToInsert = generatedText.replace('__REPLACE_DOCUMENT__', '');
			setContent(textToInsert);
			return;
		}

		// Standard: Text an der Cursor-Position einfügen
		// Cursor-Position bestimmen (falls verfügbar)
		const selectionStart =
			contentInputRef.current?.props?.selection?.start || currentContent.length;

		// Text einfügen
		const newContent =
			currentContent.substring(0, selectionStart) +
			generatedText +
			currentContent.substring(selectionStart);

		setContent(newContent);
	};

	// Funktion zum Umgang mit neu erstellten Dokumentversionen
	const handleVersionCreated = (newDocumentId: string) => {
		// Navigiere zur neuen Dokumentversion
		router.push(`/spaces/${spaceId}/documents/${newDocumentId}`);
	};

	// Funktion zum Wechseln zwischen Dokumentversionen
	const handleVersionChange = (newDocumentId: string) => {
		// Speichere das aktuelle Dokument, falls es ungespeicherte Änderungen gibt
		if (hasUnsavedChanges && !isNewDocument) {
			saveDocument();
		}
		// Navigiere zur neuen Version
		router.push(`/spaces/${spaceId}/documents/${newDocumentId}`);
	};

	// Funktion zum Aktualisieren der Tags
	const handleTagsChange = async (newTags: string[]) => {
		console.log('handleTagsChange - Neue Tags:', newTags);

		// Setze die neuen Tags im lokalen State
		setTags(newTags);

		// Wenn es ein neues Dokument ist und kein Inhalt vorhanden ist
		if (isNewDocument && !currentDocumentId && (!content || content.trim() === '')) {
			// Setze einen Platzhalterinhalt
			const placeholderContent = '# Neues Dokument';
			setContent(placeholderContent);

			// Der Hook wird automatisch das Dokument erstellen
		}

		// Für bestehende Dokumente wird der Hook automatisch speichern
		// durch die content/tags Änderung
	};

	// Funktion zum Ändern des Dokumenttyps
	const handleTypeChange = async (newType: DocumentType) => {
		if (isNewDocument || !document || !currentDocumentId) return;

		try {
			setError(null);
			setSaveState('saving');

			const { success, error } = await updateDocument(currentDocumentId, {
				type: newType,
			});

			if (!success) {
				// Formatiere den Fehler korrekt
				const errorMessage = error?.message || 'Unbekannter Fehler';
				setError(`Fehler beim Aktualisieren des Dokumenttyps: ${errorMessage}`);
				setSaveState('error');
				return;
			}

			// Aktualisiere den lokalen Dokumenttyp
			setDocument((prev) => (prev ? { ...prev, type: newType } : null));
			setSaveState('saved');

			// Reset save state after 2 seconds
			setTimeout(() => {
				setSaveState('idle');
			}, 2000);
		} catch (err: any) {
			setError(`Unerwarteter Fehler: ${err.message}`);
			setSaveState('error');
		}
	};
	// Handle beforeunload with new save hook
	useEffect(() => {
		if (typeof window === 'undefined' || Platform.OS !== 'web') return;

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue =
					'Es gibt ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
				return e.returnValue;
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [hasUnsavedChanges]);

	// Funktion zum Überprüfen, ob der Benutzer zum Ende des Dokuments gescrollt hat
	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
		const paddingToBottom = 100; // Größerer Wert, damit die Vorschau früher erscheint
		const isCloseToBottom =
			layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

		// Prüfe, ob wir ein nächstes Dokument haben und ob wir nah am Ende sind
		if (isCloseToBottom && nextDocument) {
			// Hier könnte eine Vorschau des nächsten Dokuments angezeigt werden
			// Diese Funktionalität wurde vereinfacht, da wir uns auf das Skeleton Loading konzentrieren
		}
	};

	// Funktion zum Fokussieren des Textfelds
	const focusTextInput = useCallback(() => {
		if (contentInputRef.current) {
			console.log('Setze Fokus auf Textfeld');
			// Direkter Fokus-Befehl
			contentInputRef.current.focus();

			// Fallback: Versuche es nochmal nach einer kurzen Verzögerung
			setTimeout(() => {
				if (contentInputRef.current) {
					contentInputRef.current.focus();
				}
			}, 100);
		} else {
			console.log('Textfeld-Ref nicht verfügbar');
		}
	}, [contentInputRef]);

	// Automatischer Fokus auf das Textfeld, wenn ein Dokument geöffnet wird
	useEffect(() => {
		// Warte, bis das Laden abgeschlossen ist und die Vorschau nicht aktiv ist
		if (!loading && !showPreview) {
			// Mehrere Versuche, den Fokus zu setzen
			const focusAttempts = [100, 300, 500, 1000]; // Versuche nach 100ms, 300ms, 500ms und 1000ms

			const focusTimers = focusAttempts.map((delay) =>
				setTimeout(() => {
					console.log(`Fokus-Versuch nach ${delay}ms`);
					focusTextInput();
				}, delay)
			);

			return () => focusTimers.forEach((timer) => clearTimeout(timer));
		}
	}, [loading, showPreview, documentId, focusTextInput]);

	return (
		<SafeAreaView
			style={{
				flex: 1,
				height: '100%',
				backgroundColor: isDark ? '#111827' : '#f9fafb',
				opacity: fadeIn ? 1 : 0,
			}}
			className="document-container relative"
		>
			<Stack.Screen
				options={{
					title: isNewDocument ? 'Neues Dokument' : title || 'Dokument',
					headerShown: true,
					headerShadowVisible: false,
					headerStyle: { backgroundColor: isDark ? '#111827' : '#f9fafb' },
					headerTintColor: isDark ? '#f9fafb' : '#111827',
					headerRight: () => (
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<SaveStateIndicatorMinimal
								saveState={saveState}
								lastSavedAt={lastSavedAt}
								hasUnsavedChanges={hasUnsavedChanges}
								error={saveError}
							/>

							{/* Varianten-Button */}
							<TouchableOpacity
								onPress={() => {
									console.log('Varianten-Button geklickt');
									setShowVariantCreator(true);
								}}
								style={{
									backgroundColor: '#0891b2',
									paddingHorizontal: 12,
									paddingVertical: 8,
									borderRadius: 6,
									flexDirection: 'row',
									alignItems: 'center',
									marginLeft: 12,
								}}
							>
								<Ionicons name="git-branch-outline" size={18} color="#ffffff" />
								<RNText style={{ color: '#ffffff', marginLeft: 6, fontWeight: '500' }}>
									Varianten
								</RNText>
							</TouchableOpacity>
						</View>
					),
				}}
			/>

			{/* Floating Varianten-Button */}
			<TouchableOpacity
				onPress={() => {
					console.log('Floating Varianten-Button geklickt');
					setShowVariantCreator(true);
				}}
				style={{
					position: 'absolute',
					bottom: 20,
					right: 20,
					backgroundColor: '#0891b2',
					padding: 15,
					borderRadius: 50,
					zIndex: 100,
					elevation: 5,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.25,
					shadowRadius: 3.84,
				}}
			>
				<Ionicons name="git-branch-outline" size={24} color="#ffffff" />
			</TouchableOpacity>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1, height: '100%', backgroundColor: isDark ? '#111827' : '#f9fafb' }}
			>
				{loading ? (
					<View
						className="h-full flex-1 flex-col"
						style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
					>
						{/* Breadcrumb-Navigation mit Skeleton */}
						<View
							className={documentClasses.breadcrumbsContainer}
							style={{
								backgroundColor: isDark ? '#111827' : '#f9fafb',
								borderBottomColor: isDark ? '#374151' : '#e5e7eb',
								borderBottomWidth: 1,
							}}
						>
							<View style={{ maxWidth: isDesktop ? 1200 : '100%', width: '100%' }}>
								<Breadcrumbs
									items={[
										{ label: 'Spaces', href: '/' },
										{ label: '...', href: `/spaces/${spaceId}` },
										{ label: '...' },
									]}
									className="justify-start"
									loading
								/>
							</View>
						</View>

						{/* Document Skeleton */}
						<DocumentSkeleton isPreview={showPreview} />
					</View>
				) : error ? (
					<View className="p-4">
						<Card className="bg-error-100 dark:bg-error-900 mb-4 p-4">
							<Text className="text-red-800 dark:text-red-200">{error}</Text>
							<ThemedButton
								title="Zurück"
								onPress={() => router.back()}
								variant="secondary"
								style={{ marginTop: 16 }}
							/>
						</Card>
					</View>
				) : (
					<View
						className="h-full flex-1 flex-col"
						style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
					>
						{/* Header mit Breadcrumbs und Toolbar */}
						<DocumentHeader
							documentId={documentId}
							spaceId={spaceId}
							title={title}
							spaceName={spaceName}
							showPreview={showPreview}
							setShowPreview={setShowPreview}
							isNewDocument={isNewDocument}
							saving={saveState === 'saving'}
							saveDocument={saveDocument}
							unsavedChanges={hasUnsavedChanges}
							documentType={document?.type}
							handleTypeChange={handleTypeChange}
							handleVersionChange={handleVersionChange}
							spaceDocuments={spaceDocuments}
							showTagsEditor={showTagsEditor}
							setShowTagsEditor={setShowTagsEditor}
						/>

						{/* Hauptinhalt - volle Höhe und zentriert auf Desktop */}
						<View
							className="mx-auto flex-1 flex-col"
							style={{
								maxWidth: isDesktop ? 800 : '100%',
								width: '100%',
								height: Dimensions.get('window').height - 60,
								position: 'relative',
								zIndex: 1, // Niedriger Z-Index für den Hauptinhalt
							}}
						>
							{showPreview ? (
								<View className="flex-1 flex-col">
									{/* Tags-Anzeige im Vorschaumodus */}
									{tags.length > 0 && (
										<View
											style={{
												flexDirection: 'row',
												flexWrap: 'wrap',
												marginBottom: 16,
												paddingHorizontal: 16,
												paddingTop: 16,
											}}
										>
											{tags.map((tag, index) => (
												<View
													key={index}
													style={{
														backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
														paddingHorizontal: 8,
														paddingVertical: 4,
														borderRadius: 9999,
														marginRight: 8,
														marginBottom: 8,
													}}
												>
													<Text
														style={{
															color: isDark ? '#d1d5db' : '#4b5563',
															fontSize: 12,
														}}
													>
														{tag}
													</Text>
												</View>
											))}
										</View>
									)}

									<ScrollView
										style={{
											flex: 1,
											backgroundColor: isDark ? '#1f2937' : '#ffffff',
											marginHorizontal: 0,
											borderWidth: 1,
											borderColor: isDark ? '#374151' : '#e5e7eb',
											borderRadius: 0, // Keine runden Ecken
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 1 },
											shadowOpacity: 0.1,
											shadowRadius: 2,
											elevation: 2,
										}}
										contentContainerStyle={{ flexGrow: 1 }}
										onScroll={handleScroll}
										scrollEventThrottle={16}
									>
										<View className="px-4 py-4" style={{ paddingBottom: 200 }}>
											{content ? (
												<View>
													<Markdown
														style={{
															body: {
																fontSize: 16,
																lineHeight: 24,
																color: isDark ? '#f3f4f6' : '#1f2937',
															},
															heading1: {
																fontSize: 24,
																marginTop: 16,
																marginBottom: 8,
																color: isDark ? '#f3f4f6' : '#1f2937',
															},
															heading2: {
																fontSize: 20,
																marginTop: 16,
																marginBottom: 8,
																color: isDark ? '#f3f4f6' : '#1f2937',
															},
															heading3: {
																fontSize: 18,
																marginTop: 16,
																marginBottom: 8,
																color: isDark ? '#f3f4f6' : '#1f2937',
															},
															paragraph: {
																marginBottom: 16,
																color: isDark ? '#f3f4f6' : '#1f2937',
															},
															list_item: { marginBottom: 8, color: isDark ? '#f3f4f6' : '#1f2937' },
															blockquote: {
																borderLeftWidth: 4,
																paddingLeft: 16,
																borderLeftColor: isDark ? '#4b5563' : '#e5e7eb',
																marginVertical: 16,
																color: isDark ? '#d1d5db' : '#4b5563',
																backgroundColor: 'transparent',
															},
															link: {
																color: isDark
																	? `#${getThemeColor(themeName, 400)}`
																	: `#${getThemeColor(themeName, 600)}`,
															},
															code_inline: {
																backgroundColor: isDark ? '#374151' : '#f3f4f6',
																color: isDark ? '#f3f4f6' : '#1f2937',
																padding: 4,
																borderRadius: 4,
															},
															code_block: {
																backgroundColor: isDark ? '#374151' : '#f3f4f6',
																color: isDark ? '#f3f4f6' : '#1f2937',
																padding: 8,
																borderRadius: 4,
																marginVertical: 8,
															},
															hr: {
																backgroundColor: isDark
																	? 'rgba(255, 255, 255, 0.5)'
																	: 'rgba(31, 41, 55, 0.5)',
																height: 1,
																marginVertical: 16,
															},
															table: {
																borderWidth: 1,
																borderColor: isDark ? '#4b5563' : '#e5e7eb',
																marginVertical: 16,
																backgroundColor: 'transparent',
																alignSelf: 'flex-start',
															},
															thead: { backgroundColor: isDark ? '#374151' : '#f3f4f6' },
															th: {
																padding: 8,
																borderWidth: 1,
																borderColor: isDark ? '#4b5563' : '#e5e7eb',
																color: isDark ? '#f3f4f6' : '#1f2937',
															},
															td: {
																padding: 8,
																borderWidth: 1,
																borderColor: isDark ? '#4b5563' : '#e5e7eb',
																color: isDark ? '#f3f4f6' : '#1f2937',
															},
															tr: {
																flexDirection: 'row',
																borderBottomWidth: 1,
																borderColor: isDark ? '#4b5563' : '#e5e7eb',
															},
														}}
														mergeStyle
														rules={{
															image: () => null, // Bilder nicht rendern
														}}
													>
														{content}
													</Markdown>

													{/* Nächstes Dokument wird als Overlay angezeigt */}
												</View>
											) : (
												<RNText className="italic text-gray-500 dark:text-gray-400">
													Kein Inhalt vorhanden
												</RNText>
											)}
										</View>
									</ScrollView>
								</View>
							) : (
								<View className="flex-1 flex-col">
									{/* Tags-Editor im Bearbeitungsmodus */}
									{showTagsEditor && (
										<View
											style={{
												backgroundColor: isDark ? '#1f2937' : '#ffffff',
												borderWidth: 1,
												borderColor: isDark ? '#374151' : '#e5e7eb',
												borderRadius: 0,
												marginBottom: 16,
												padding: 16,
											}}
										>
											<DocumentTagsEditor
												tags={tags}
												onTagsChange={handleTagsChange}
												themeName={themes[themeName]?.name || 'indigo'}
												documentId={!isNewDocument ? documentId : undefined}
											/>
										</View>
									)}

									<ScrollView
										ref={scrollViewRef}
										style={{
											flex: 1,
											backgroundColor: isDark ? '#1f2937' : '#ffffff',
											marginHorizontal: 0,
											borderWidth: 1,
											borderColor: isDark ? '#374151' : '#e5e7eb',
											borderRadius: 0, // Keine runden Ecken
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 1 },
											shadowOpacity: 0.1,
											shadowRadius: 2,
											elevation: 2,
										}}
										contentContainerStyle={{ flexGrow: 1 }}
										onScroll={handleScroll}
										scrollEventThrottle={16}
									>
										<View style={{ flex: 1 }}>
											{/* Verwende MentionTextInput für die Dropdown-Funktionalität */}
											<MentionTextInput
												ref={contentInputRef}
												value={content}
												spaceId={spaceId}
												autoFocus
												onChangeText={(text) => {
													setContent(text);
												}}
												onMentionInserted={(documentId, documentTitle) => {
													console.log(`Mention inserted: ${documentTitle} (${documentId})`);
												}}
												placeholder="Beginne hier mit dem Schreiben... (unterstützt Markdown und @Erwähnungen)"
												multiline
												style={{
													flex: 1,
													fontSize: 16,
													color: isDark ? '#f3f4f6' : '#1f2937',
													paddingHorizontal: 16,
													paddingTop: 50, // Zusätzlicher Abstand am oberen Rand (ein Viertel so viel wie unten)
													paddingBottom: 200, // Abstand am unteren Rand, damit der nächste Artikel nicht den Text verdeckt
													minHeight: Dimensions.get('window').height - 160, // Höhe des Bildschirms minus Header und Platz für Vorschau
													lineHeight: 24,
													backgroundColor: isDark ? '#1f2937' : '#ffffff',
													borderRadius: 0, // Keine abgerundeten Ecken, komplett eckig
												}}
												autoCapitalize="none"
												autoCorrect={false}
												placeholderTextColor="#9ca3af"
												className="editor-no-focus-outline"
											/>

											{/* Vorschau der @-Erwähnungen im Bearbeitungsmodus */}
											{content && content.includes('@[') && (
												<View
													style={{
														position: 'absolute',
														bottom: 20,
														left: 16,
														right: 16,
														zIndex: 100,
													}}
												>
													<MentionHighlighter text={content} spaceId={spaceId} />
												</View>
											)}
										</View>

										{/* Varianten-Button direkt im Dokument */}
										<View style={{ padding: 16, alignItems: 'center', marginTop: 20 }}>
											<TouchableOpacity
												onPress={() => {
													console.log('Inline Varianten-Button geklickt');
													setShowVariantCreator(true);
												}}
												style={{
													backgroundColor: '#0891b2',
													paddingHorizontal: 16,
													paddingVertical: 12,
													borderRadius: 8,
													flexDirection: 'row',
													alignItems: 'center',
													justifyContent: 'center',
													width: 200,
												}}
											>
												<Ionicons name="git-branch-outline" size={20} color="#ffffff" />
												<RNText style={{ color: '#ffffff', marginLeft: 8, fontWeight: '500' }}>
													Variante erstellen
												</RNText>
											</TouchableOpacity>
										</View>
									</ScrollView>
								</View>
							)}
						</View>
					</View>
				)}
			</KeyboardAvoidingView>

			{/* Varianten-Creator */}
			<VariantCreator
				visible={showVariantCreator}
				onClose={() => setShowVariantCreator(false)}
				documentContent={content}
				documentTitle={title}
				documentId={documentId}
				spaceId={spaceId}
				onVariantCreated={handleVersionCreated}
			/>

			{/* Bottom LLM Toolbar - nur im Bearbeitungsmodus anzeigen */}
			{!showPreview && (
				<BottomLLMToolbar
					onGenerateText={handleInsertLLMGeneratedText}
					documentContent={content}
					isGenerating={isGeneratingText}
					setIsGenerating={setIsGeneratingText}
				/>
			)}

			{/* Overlay für das nächste Dokument */}
			{nextDocument && showNextDocumentPreview && (
				<View
					style={{
						position: 'absolute',
						bottom: 20,
						left: 0,
						right: 0,
						zIndex: 50,
						marginHorizontal: 'auto',
						width: isDesktop ? 600 : '90%',
						alignSelf: 'center',
					}}
				>
					<TouchableOpacity
						onPress={() => router.replace(`/spaces/${spaceId}/documents/${nextDocument.id}`)}
						style={{
							backgroundColor: isDark ? '#1f2937' : '#ffffff',
							borderRadius: 8,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.1,
							shadowRadius: 4,
							elevation: 5,
							borderWidth: 1,
							borderColor: isDark ? '#374151' : '#e5e7eb',
						}}
						className="p-4"
					>
						<View className="mb-2 flex-row items-center justify-between">
							<RNText className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Nächstes Dokument
							</RNText>
							<Ionicons name="chevron-forward" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
						</View>
						<RNText className="mb-1 text-lg font-medium text-indigo-600 dark:text-indigo-400">
							{nextDocument.title || 'Unbenanntes Dokument'}
						</RNText>
						<RNText className="text-xs text-gray-500 dark:text-gray-400">
							{new Date(nextDocument.updated_at).toLocaleDateString()} • {nextDocument.type}
						</RNText>
						<Ionicons name="git-branch-outline" size={24} color="#ffffff" />
					</TouchableOpacity>
				</View>
			)}

			{/* Save State Indicator Overlay */}
			<SaveStateIndicator
				saveState={saveState}
				lastSavedAt={lastSavedAt}
				hasUnsavedChanges={hasUnsavedChanges}
				error={saveError}
			/>
		</SafeAreaView>
	);
}
