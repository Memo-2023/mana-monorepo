import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from '~/utils/debounce';
import {
	createDocument,
	updateDocument,
	saveDocumentTags,
	Document,
} from '~/services/supabaseService';
import { extractTitleFromMarkdown } from '~/utils/markdown';
import { SaveState, DocumentSaveState, UseDocumentSaveOptions } from '~/types/document';

export function useDocumentSave({
	documentId,
	content,
	title,
	tags,
	metadata,
	isNewDocument,
	spaceId,
	minContentLength = 50,
	debounceDelay = 3000,
	onDocumentCreated,
	onSaveSuccess,
	onSaveError,
}: UseDocumentSaveOptions): DocumentSaveState & {
	saveDocument: () => Promise<void>;
	setSaveState: (state: SaveState) => void;
} {
	// State Management
	const [saveState, setSaveState] = useState<SaveState>('idle');
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Refs
	const saveLockRef = useRef(false);
	const firstSaveCompletedRef = useRef(false);
	const currentDocumentIdRef = useRef<string | null>(documentId);
	const lastSavedContentRef = useRef<string>(content);

	// Update current document ID when it changes
	useEffect(() => {
		currentDocumentIdRef.current = documentId;
	}, [documentId]);

	// Track unsaved changes
	useEffect(() => {
		const contentChanged = content !== lastSavedContentRef.current;
		const shouldTrackChanges = !isNewDocument || content.trim().length >= minContentLength;

		if (contentChanged && shouldTrackChanges) {
			setHasUnsavedChanges(true);
		}
	}, [content, isNewDocument, minContentLength]);

	// Core save function
	const saveDocument = useCallback(async () => {
		// Prevent concurrent saves
		if (saveLockRef.current || saveState === 'saving') {
			console.log('Save already in progress, skipping...');
			return;
		}

		// Validate content for new documents
		if (isNewDocument && content.trim().length < minContentLength && tags.length === 0) {
			console.log('Not enough content to save new document');
			return;
		}

		try {
			saveLockRef.current = true;
			setSaveState('saving');
			setError(null);

			let documentContent = content;

			// Add placeholder content if only tags exist
			if (isNewDocument && !content.trim() && tags.length > 0) {
				documentContent = '# Neues Dokument';
			}

			const extractedTitle = extractTitleFromMarkdown(documentContent);

			if (isNewDocument) {
				// Prevent duplicate saves for new documents
				if (firstSaveCompletedRef.current) {
					console.log('Document already created, skipping...');
					return;
				}

				console.log('Creating new document...');
				const { data, error: createError } = await createDocument(
					documentContent,
					'text',
					spaceId,
					{ ...metadata, tags },
					extractedTitle || 'Neues Dokument'
				);

				if (createError) {
					throw new Error(createError);
				}

				if (data) {
					firstSaveCompletedRef.current = true;
					currentDocumentIdRef.current = data.id;
					lastSavedContentRef.current = documentContent;
					setLastSavedAt(new Date());
					setHasUnsavedChanges(false);
					setSaveState('saved');

					// Notify parent component
					if (onDocumentCreated) {
						onDocumentCreated(data.id);
					}

					if (onSaveSuccess) {
						onSaveSuccess();
					}

					console.log('Document created successfully:', data.id);
				}
			} else if (currentDocumentIdRef.current) {
				// Update existing document
				console.log('Updating document...');
				const { success, error: updateError } = await updateDocument(currentDocumentIdRef.current, {
					content: documentContent,
					title: extractedTitle,
					updated_at: new Date().toISOString(),
					metadata: { ...metadata, tags },
				});

				if (!success || updateError) {
					throw new Error(updateError?.message || 'Update failed');
				}

				lastSavedContentRef.current = documentContent;
				setLastSavedAt(new Date());
				setHasUnsavedChanges(false);
				setSaveState('saved');

				if (onSaveSuccess) {
					onSaveSuccess();
				}

				console.log('Document updated successfully');
			}

			// Reset save state after 2 seconds
			setTimeout(() => {
				setSaveState('idle');
			}, 2000);
		} catch (err: any) {
			console.error('Save error:', err);
			setError(err.message);
			setSaveState('error');

			if (onSaveError) {
				onSaveError(err.message);
			}
		} finally {
			saveLockRef.current = false;
		}
	}, [
		content,
		tags,
		metadata,
		isNewDocument,
		spaceId,
		minContentLength,
		saveState,
		onDocumentCreated,
		onSaveSuccess,
		onSaveError,
	]);

	// Debounced auto-save
	const debouncedSave = useCallback(
		debounce(() => {
			if (hasUnsavedChanges) {
				saveDocument();
			}
		}, debounceDelay),
		[saveDocument, hasUnsavedChanges, debounceDelay]
	);

	// Auto-save on content change
	useEffect(() => {
		if (hasUnsavedChanges && content) {
			debouncedSave();
		}

		return () => {
			debouncedSave.cancel();
		};
	}, [content, hasUnsavedChanges, debouncedSave]);

	// Save on unmount if needed
	useEffect(() => {
		return () => {
			if (hasUnsavedChanges && !saveLockRef.current) {
				// Synchronous save attempt on unmount
				saveDocument();
			}
		};
	}, [hasUnsavedChanges, saveDocument]);

	// Local backup for recovery
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const shouldBackup =
			hasUnsavedChanges && content && (!isNewDocument || content.trim().length >= minContentLength);

		if (!shouldBackup) return;

		const backupKey = isNewDocument
			? 'document_new_backup'
			: `document_${currentDocumentIdRef.current}_backup`;

		const backupInterval = setInterval(() => {
			if (content) {
				localStorage.setItem(backupKey, content);
				localStorage.setItem(`${backupKey}_time`, new Date().toISOString());
				console.log('Local backup created');
			}
		}, 30000); // Backup every 30 seconds

		return () => clearInterval(backupInterval);
	}, [content, hasUnsavedChanges, isNewDocument, minContentLength]);

	return {
		saveState,
		lastSavedAt,
		hasUnsavedChanges,
		error,
		saveDocument,
		setSaveState,
	};
}
