import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '~/context/AuthProvider';
import {
	getDocumentById,
	getDocumentByShortId,
	createDocument,
	updateDocument,
	getDocuments,
	saveDocumentTags,
	getSpaceById,
	Document,
} from '~/services/supabaseService';
import { useAutoSave } from './useAutoSave';
import {
	DocumentEditorState,
	DocumentEditorAction,
	initialDocumentEditorState,
	documentEditorReducer,
} from '~/types/documentEditor';
import { EDITOR_CONFIG } from '~/config/editorConfig';

export interface UseDocumentEditorOptions {
	spaceId: string;
	documentId: string;
	initialMode?: 'edit' | 'preview';
}

export interface UseDocumentEditorResult {
	state: DocumentEditorState;
	dispatch: React.Dispatch<DocumentEditorAction>;

	// Actions
	saveDocument: () => Promise<void>;
	toggleMode: () => void;
	updateContent: (content: string) => void;
	updateTitle: (title: string) => void;
	updateTags: (tags: string[]) => void;

	// Auto-save
	autoSave: {
		saveState: 'idle' | 'saving' | 'saved' | 'error';
		forceSave: () => Promise<void>;
		lastSaved: Date | null;
		error: Error | null;
	};

	// Navigation
	navigateToNextDocument: () => void;
	navigateToSpace: () => void;

	// Utilities
	isNewDocument: boolean;
	canSave: boolean;
}

/**
 * Custom Hook für die gesamte Dokumenten-Editor-Logik
 * Ersetzt das komplexe State Management aus dem DocumentEditor Component
 */
export const useDocumentEditor = (options: UseDocumentEditorOptions): UseDocumentEditorResult => {
	const { spaceId, documentId, initialMode = 'edit' } = options;
	const router = useRouter();
	const { user } = useAuth();
	const params = useLocalSearchParams();

	const [state, dispatch] = useReducer(documentEditorReducer, {
		...initialDocumentEditorState,
		mode: initialMode,
	});

	const isNewDocument = documentId === 'create';
	const canSave = state.content.length >= EDITOR_CONFIG.MIN_CONTENT_LENGTH;

	// Refs für Performance-Optimierung
	const loadingRef = useRef(false);
	const saveInProgressRef = useRef(false);

	// Auto-Save Setup
	const handleAutoSave = useCallback(
		async (content: string) => {
			if (saveInProgressRef.current) return;

			try {
				saveInProgressRef.current = true;

				if (isNewDocument) {
					// Neues Dokument erstellen
					const { data, error } = await createDocument(
						content,
						'text', // Default type
						spaceId,
						{ tags: state.tags },
						state.title
					);

					if (error) throw new Error(error);
					if (data) {
						dispatch({ type: 'SET_DOCUMENT', payload: data });
						// Navigation zur neuen Dokument-URL
						router.replace(`/spaces/${spaceId}/documents/${data.id}`);
					}
				} else {
					// Bestehendes Dokument aktualisieren
					const { success, error } = await updateDocument(documentId, {
						title: state.title,
						content: content,
						metadata: {
							...state.document?.metadata,
							tags: state.tags,
						},
					});

					if (!success) throw new Error(error);
					dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
				}
			} catch (error) {
				console.error('Auto-save failed:', error);
				throw error;
			} finally {
				saveInProgressRef.current = false;
			}
		},
		[isNewDocument, spaceId, state.tags, state.title, state.document, documentId, router]
	);

	const autoSave = useAutoSave(state.content, {
		enabled: canSave,
		onSave: handleAutoSave,
		onError: (error) => {
			dispatch({ type: 'SET_ERROR', payload: error.message });
		},
	});

	// Document Loading
	const loadDocument = useCallback(async () => {
		if (loadingRef.current) return;

		try {
			loadingRef.current = true;
			dispatch({ type: 'SET_LOADING', payload: true });
			dispatch({ type: 'SET_ERROR', payload: null });

			if (isNewDocument) {
				// Neues Dokument - nur Space-Daten laden
				const space = await getSpaceById(spaceId);
				if (space) {
					dispatch({ type: 'SET_SPACE_NAME', payload: space.name });
				}

				// Modus aus URL-Parameter setzen
				const mode = (params.mode as 'edit' | 'preview') || 'edit';
				dispatch({ type: 'SET_MODE', payload: mode });

				dispatch({ type: 'SET_LOADING', payload: false });
				return;
			}

			// Bestehendes Dokument laden
			let document: Document | null = null;

			// Versuche zuerst mit normaler ID
			document = await getDocumentById(documentId);

			// Falls nicht gefunden, versuche mit Short-ID
			if (!document) {
				document = await getDocumentByShortId(documentId);
			}

			if (!document) {
				dispatch({ type: 'SET_ERROR', payload: 'Dokument nicht gefunden' });
				return;
			}

			dispatch({ type: 'SET_DOCUMENT', payload: document });

			// Space-Daten laden
			if (document.space_id) {
				const space = await getSpaceById(document.space_id);
				if (space) {
					dispatch({ type: 'SET_SPACE_NAME', payload: space.name });
				}

				// Andere Dokumente im Space laden
				const spaceDocuments = await getDocuments(document.space_id);
				dispatch({ type: 'SET_SPACE_DOCUMENTS', payload: spaceDocuments });

				// Nächstes Dokument für Navigation finden
				const currentIndex = spaceDocuments.findIndex((doc) => doc.id === document!.id);
				const nextDoc =
					currentIndex >= 0 && currentIndex < spaceDocuments.length - 1
						? spaceDocuments[currentIndex + 1]
						: null;
				dispatch({ type: 'SET_NEXT_DOCUMENT', payload: nextDoc });
			}

			// Modus aus URL-Parameter setzen
			const mode = (params.mode as 'edit' | 'preview') || 'preview';
			dispatch({ type: 'SET_MODE', payload: mode });

			// Fade-in Animation
			dispatch({ type: 'SET_FADE_IN', payload: true });
		} catch (error) {
			console.error('Failed to load document:', error);
			dispatch({ type: 'SET_ERROR', payload: 'Fehler beim Laden des Dokuments' });
		} finally {
			dispatch({ type: 'SET_LOADING', payload: false });
			loadingRef.current = false;
		}
	}, [documentId, spaceId, isNewDocument, params.mode]);

	// Load document on mount
	useEffect(() => {
		if (user && spaceId && documentId) {
			loadDocument();
		}
	}, [user, spaceId, documentId, loadDocument]);

	// Actions
	const saveDocument = useCallback(async () => {
		if (!canSave || saveInProgressRef.current) return;

		try {
			await autoSave.forceSave();
		} catch (error) {
			console.error('Manual save failed:', error);
		}
	}, [canSave, autoSave]);

	const toggleMode = useCallback(() => {
		dispatch({ type: 'TOGGLE_MODE' });
	}, []);

	const updateContent = useCallback((content: string) => {
		dispatch({ type: 'SET_CONTENT', payload: content });
	}, []);

	const updateTitle = useCallback((title: string) => {
		dispatch({ type: 'SET_TITLE', payload: title });
	}, []);

	const updateTags = useCallback(
		async (tags: string[]) => {
			dispatch({ type: 'SET_TAGS', payload: tags });

			// Für bestehende Dokumente sofort speichern
			if (!isNewDocument && state.document) {
				try {
					await saveDocumentTags(state.document.id, tags);
				} catch (error) {
					console.error('Failed to save tags:', error);
					dispatch({ type: 'SET_ERROR', payload: 'Fehler beim Speichern der Tags' });
				}
			}
		},
		[isNewDocument, state.document]
	);

	// Navigation
	const navigateToNextDocument = useCallback(() => {
		if (state.nextDocument) {
			router.push(`/spaces/${spaceId}/documents/${state.nextDocument.id}`);
		}
	}, [state.nextDocument, spaceId, router]);

	const navigateToSpace = useCallback(() => {
		router.push(`/spaces/${spaceId}`);
	}, [spaceId, router]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Cleanup any pending operations
			saveInProgressRef.current = false;
			loadingRef.current = false;
		};
	}, []);

	return {
		state,
		dispatch,
		saveDocument,
		toggleMode,
		updateContent,
		updateTitle,
		updateTags,
		autoSave,
		navigateToNextDocument,
		navigateToSpace,
		isNewDocument,
		canSave,
	};
};
