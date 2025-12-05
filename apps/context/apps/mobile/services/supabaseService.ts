import { supabase } from '../utils/supabase';
import { updateDocumentTokenCount } from './tokenCountingService';

// Typdefinitionen
export type User = {
	id: string;
	email: string;
	name: string | null;
	created_at: string;
};

export type Space = {
	id: string;
	name: string;
	description: string | null;
	user_id: string;
	created_at: string;
	settings: any | null;
	pinned: boolean;
	prefix?: string;
	text_doc_counter?: number;
	context_doc_counter?: number;
	prompt_doc_counter?: number;
};

export type DocumentMetadata = {
	tags?: string[];
	word_count?: number;
	token_count?: number; // Anzahl der Tokens im Dokument
	[key: string]: any; // Erlaubt weitere Metadaten
};

export type Document = {
	id: string;
	title: string;
	content: string | null;
	type: 'text' | 'context' | 'prompt';
	space_id: string | null;
	user_id: string;
	created_at: string;
	updated_at: string;
	metadata: DocumentMetadata | null;
	short_id?: string; // Neue kurze ID für benutzerfreundliche Referenzen
	pinned?: boolean; // Flag, um Dokumente anzupinnen
};

// Benutzer-Services
export const getCurrentUser = async (): Promise<User | null> => {
	const { data: sessionData } = await supabase.auth.getSession();
	const user = sessionData?.session?.user;

	if (!user) return null;

	const { data } = await supabase.from('users').select('*').eq('id', user.id).single();

	return data;
};

export const updateUserProfile = async (
	name: string
): Promise<{ success: boolean; error: any }> => {
	const { data: sessionData } = await supabase.auth.getSession();
	const user = sessionData?.session?.user;

	if (!user) return { success: false, error: 'Nicht angemeldet' };

	const { error } = await supabase.from('users').update({ name }).eq('id', user.id);

	return { success: !error, error };
};

// Space-Services
export const getSpaces = async (): Promise<Space[]> => {
	const { data } = await supabase
		.from('spaces')
		.select('*')
		.order('created_at', { ascending: false });

	return data || [];
};

export const getSpaceById = async (id: string): Promise<Space | null> => {
	const { data } = await supabase.from('spaces').select('*').eq('id', id).single();

	return data;
};

export const createSpace = async (
	name: string,
	description?: string,
	settings?: any,
	pinned: boolean = true
): Promise<{ data: Space | null; error: any }> => {
	const { data: sessionData } = await supabase.auth.getSession();
	const user = sessionData?.session?.user;

	if (!user) return { data: null, error: 'Nicht angemeldet' };

	// Überprüfen, ob der Benutzer bereits in der users-Tabelle existiert
	const { data: existingUser } = await supabase
		.from('users')
		.select('id')
		.eq('id', user.id)
		.single();

	// Wenn der Benutzer nicht existiert, fügen wir ihn hinzu
	if (!existingUser) {
		const { error: userError } = await supabase.from('users').insert([
			{
				id: user.id,
				email: user.email || '',
				name: user.user_metadata?.name || null,
			},
		]);

		if (userError) {
			return { data: null, error: `Fehler beim Erstellen des Benutzers: ${userError.message}` };
		}
	}

	// Jetzt können wir den Space erstellen
	const { data, error } = await supabase
		.from('spaces')
		.insert([
			{
				name,
				description: description || null,
				user_id: user.id,
				settings: settings || null,
				pinned: pinned,
			},
		])
		.select()
		.single();

	return { data, error };
};

export const updateSpace = async (
	id: string,
	updates: Partial<Space>
): Promise<{ success: boolean; error: any }> => {
	const { error } = await supabase.from('spaces').update(updates).eq('id', id);

	return { success: !error, error };
};

export const toggleSpacePinned = async (
	id: string,
	pinned: boolean
): Promise<{ success: boolean; error: any }> => {
	const { error } = await supabase.from('spaces').update({ pinned }).eq('id', id);

	return { success: !error, error };
};

export const deleteSpace = async (id: string): Promise<{ success: boolean; error: any }> => {
	// Zuerst alle Dokumente in diesem Space löschen
	await supabase.from('documents').delete().eq('space_id', id);

	// Dann den Space löschen
	const { error } = await supabase.from('spaces').delete().eq('id', id);

	return { success: !error, error };
};

// Dokument-Services
export const getDocuments = async (spaceId?: string): Promise<Document[]> => {
	let query = supabase
		.from('documents')
		.select('*')
		.order('pinned', { ascending: false }) // Zuerst nach Pinned-Status sortieren
		.order('updated_at', { ascending: false }); // Dann nach Aktualisierungsdatum

	if (spaceId) {
		query = query.eq('space_id', spaceId);
	}

	const { data } = await query;
	return data || [];
};

// Optimierte Funktion für das Laden von Dokumenten mit begrenztem Inhalt für bessere Performance
export const getDocumentsWithPreview = async (
	spaceId?: string,
	limit: number = 50
): Promise<Document[]> => {
	let query = supabase
		.from('documents')
		.select(
			'id, title, content, type, space_id, user_id, created_at, updated_at, metadata, short_id, pinned'
		)
		.order('pinned', { ascending: false })
		.order('updated_at', { ascending: false })
		.limit(limit);

	if (spaceId) {
		query = query.eq('space_id', spaceId);
	}

	const { data } = await query;

	// Truncate content to first 200 characters for preview
	return (data || []).map((doc) => ({
		...doc,
		content:
			doc.content && doc.content.length > 200 ? `${doc.content.substring(0, 200)}...` : doc.content,
	}));
};

// Holt die neuesten Dokumente für den aktuellen Benutzer
export const getRecentDocuments = async (limit: number = 5): Promise<Document[]> => {
	const { data: sessionData } = await supabase.auth.getSession();
	const user = sessionData?.session?.user;

	if (!user) return [];

	const { data } = await supabase
		.from('documents')
		.select('*')
		.eq('user_id', user.id)
		.order('updated_at', { ascending: false })
		.limit(limit);

	return data || [];
};

export const getDocumentById = async (id: string): Promise<Document | null> => {
	const { data } = await supabase.from('documents').select('*').eq('id', id).single();

	return data;
};

// Findet ein Dokument anhand seiner kurzen ID
export const getDocumentByShortId = async (shortId: string): Promise<Document | null> => {
	const { data } = await supabase.from('documents').select('*').eq('short_id', shortId).single();

	return data;
};

import { extractTitleFromMarkdown } from '~/utils/markdown';
import { countWords } from '~/utils/textUtils';

export const createDocument = async (
	content: string,
	type: 'text' | 'context' | 'prompt',
	spaceId?: string,
	metadata?: any,
	title?: string
): Promise<{ data: Document | null; error: any }> => {
	const { data: sessionData } = await supabase.auth.getSession();
	const user = sessionData?.session?.user;

	if (!user) return { data: null, error: 'Nicht angemeldet' };

	// If title is not provided, extract it from content
	const documentTitle = title || extractTitleFromMarkdown(content);

	// Wortanzahl und Token-Anzahl berechnen und zu den Metadaten hinzufügen
	const wordCount = countWords(content);

	// Berechne die Token-Anzahl und aktualisiere die Metadaten
	const { metadata: updatedMetadataWithTokens } = updateDocumentTokenCount({
		content,
		metadata: metadata || {},
	});

	// Füge die Wortanzahl hinzu
	const updatedMetadata = {
		...updatedMetadataWithTokens,
		word_count: wordCount,
	};

	// Generiere eine kurze ID, wenn ein Space angegeben ist
	let shortId: string | undefined;

	if (spaceId) {
		try {
			// Hole Space-Informationen
			const { data: spaceData } = await supabase
				.from('spaces')
				.select('prefix, text_doc_counter, context_doc_counter, prompt_doc_counter')
				.eq('id', spaceId)
				.single();

			console.log('Space-Daten:', spaceData);

			if (!spaceData || !spaceData.prefix) {
				console.error('Space nicht gefunden oder kein Präfix vorhanden');
				// Fallback-ID generieren
				shortId = `DOC-${Math.random().toString(36).substring(2, 8)}`;
			} else {
				// Bestimme den richtigen Zähler basierend auf dem Dokumenttyp
				let counter = 0;
				if (type === 'text') {
					counter = (spaceData.text_doc_counter || 0) + 1;
				} else if (type === 'context') {
					counter = (spaceData.context_doc_counter || 0) + 1;
				} else if (type === 'prompt') {
					counter = (spaceData.prompt_doc_counter || 0) + 1;
				}

				// Aktualisiere den Zähler in der Datenbank
				const counterField = `${type}_doc_counter`;
				await supabase
					.from('spaces')
					.update({ [counterField]: counter })
					.eq('id', spaceId);

				// Generiere die short_id
				const typeChar = type === 'text' ? 'D' : type === 'context' ? 'C' : 'P';
				shortId = `${spaceData.prefix}${typeChar}${counter}`;
				console.log('Generierte short_id:', shortId);
			}
		} catch (error) {
			console.error('Fehler bei der Generierung der kurzen ID:', error);
			// Fallback-ID generieren
			shortId = `DOC-${Math.random().toString(36).substring(2, 8)}`;
		}
	} else {
		// Für Dokumente ohne Space, generiere eine generische ID
		shortId = `DOC-${Math.random().toString(36).substring(2, 8)}`;
	}

	const { data, error } = await supabase
		.from('documents')
		.insert([
			{
				title: documentTitle,
				content,
				type,
				space_id: spaceId || null,
				user_id: user.id,
				metadata: updatedMetadata,
				short_id: shortId,
			},
		])
		.select()
		.single();

	return { data, error };
};

export const updateDocument = async (
	id: string,
	updates: Partial<Document>
): Promise<{ success: boolean; error: any }> => {
	// Hole das aktuelle Dokument, um Metadaten und andere Informationen zu prüfen
	try {
		const document = await getDocumentById(id);
		if (!document) {
			return { success: false, error: 'Dokument nicht gefunden' };
		}

		// Stelle sicher, dass die Metadaten korrekt aktualisiert werden
		if (updates.metadata) {
			// Wenn Metadaten explizit übergeben wurden, stelle sicher, dass sie mit den bestehenden zusammengeführt werden
			updates.metadata = {
				...document.metadata,
				...updates.metadata,
			};
			console.log('Aktualisierte Metadaten in updateDocument:', updates.metadata);
		}

		// Wenn der Inhalt aktualisiert wird, berechne die neue Wortanzahl und Token-Anzahl
		if (updates.content) {
			const wordCount = countWords(updates.content);

			// Berechne die Token-Anzahl und aktualisiere die Metadaten
			const { metadata: updatedMetadataWithTokens } = updateDocumentTokenCount({
				content: updates.content,
				metadata: updates.metadata || document.metadata || {},
			});

			// Füge die Wortanzahl hinzu
			updates.metadata = {
				...updatedMetadataWithTokens,
				word_count: wordCount,
			};
		}

		// Wenn der Typ geändert wird, müssen wir möglicherweise die short_id aktualisieren
		if (updates.type) {
			try {
				// Prüfe, ob die short_id dem Typ-Präfix-Format entspricht (z.B. MD1, MC2, MP3)
				if (document.short_id && document.space_id) {
					const currentShortId = document.short_id;

					// Wenn die ID dem Format entspricht (z.B. MD1), aktualisiere nur den Typ-Buchstaben
					if (/^[A-Z][CDP]\d+$/.test(currentShortId)) {
						const spacePrefix = currentShortId.charAt(0);
						const number = currentShortId.substring(2); // Extrahiere die Nummer
						const newTypeChar =
							updates.type === 'text' ? 'D' : updates.type === 'context' ? 'C' : 'P';

						// Aktualisiere die short_id mit dem neuen Typ-Buchstaben
						updates.short_id = `${spacePrefix}${newTypeChar}${number}`;
						console.log(`Aktualisiere short_id von ${currentShortId} zu ${updates.short_id}`);
					}
				}
			} catch (error) {
				console.error('Fehler beim Aktualisieren der short_id:', error);
			}
		}
	} catch (error) {
		console.error('Fehler beim Laden des Dokuments:', error);
	}

	const { error } = await supabase.from('documents').update(updates).eq('id', id);

	return { success: !error, error };
};

export const deleteDocument = async (id: string): Promise<{ success: boolean; error: any }> => {
	const { error } = await supabase.from('documents').delete().eq('id', id);

	return { success: !error, error };
};

// Setzt oder entfernt das Pinned-Flag für ein Dokument
export const toggleDocumentPinned = async (
	id: string,
	pinned: boolean
): Promise<{ success: boolean; error: any }> => {
	const { error } = await supabase.from('documents').update({ pinned }).eq('id', id);

	return { success: !error, error };
};

/**
 * Speichert Tags für ein Dokument direkt in den Metadaten
 * @param id ID des Dokuments
 * @param tags Array von Tags
 * @returns Erfolg oder Fehler
 */
export const saveDocumentTags = async (
	id: string,
	tags: string[]
): Promise<{ success: boolean; error: any }> => {
	try {
		console.log('saveDocumentTags - Speichere Tags direkt:', tags);

		// Rufe die SQL-Funktion auf, die wir im Supabase SQL Editor erstellt haben
		const { error } = await supabase.rpc('update_document_tags', {
			document_id: id,
			tags_array: tags,
		});

		if (error) {
			console.error('Fehler beim Speichern der Tags mit RPC:', error);

			// Fallback-Methode, wenn die RPC-Funktion nicht funktioniert
			console.log('Verwende Fallback-Methode für Tag-Update');

			// Hole das aktuelle Dokument, um die bestehenden Metadaten zu erhalten
			const document = await getDocumentById(id);
			if (!document) {
				return { success: false, error: 'Dokument nicht gefunden' };
			}

			// Aktualisiere die Metadaten mit den neuen Tags
			const currentMetadata = document.metadata || {};
			const updatedMetadata = {
				...currentMetadata,
				tags: tags,
			};

			console.log('Fallback - Aktualisierte Metadaten:', updatedMetadata);

			// Direktes Update der Metadaten in der Datenbank
			const updateResult = await supabase
				.from('documents')
				.update({
					metadata: updatedMetadata,
					// Füge einen Zeitstempel hinzu, um sicherzustellen, dass die Änderung erkannt wird
					updated_at: new Date().toISOString(),
				})
				.eq('id', id);

			if (updateResult.error) {
				console.error('Fehler beim Fallback-Update der Tags:', updateResult.error);
				return { success: false, error: updateResult.error };
			}
		}

		return { success: true, error: null };
	} catch (error) {
		console.error('Fehler beim Speichern der Tags:', error);
		return { success: false, error };
	}
};

/**
 * Findet alle Versionen eines Dokuments (das Original und alle abgeleiteten Versionen)
 * @param documentId ID des Dokuments, für das Versionen gefunden werden sollen
 * @returns Array von Dokumenten, die Versionen des angegebenen Dokuments sind
 */
export const getDocumentVersions = async (
	documentId: string
): Promise<{ data: Document[]; error: any }> => {
	try {
		// Zuerst das Originaldokument abrufen
		const originalDocument = await getDocumentById(documentId);
		if (!originalDocument) {
			return { data: [], error: 'Dokument nicht gefunden' };
		}

		// Prüfen, ob das Dokument selbst eine abgeleitete Version ist
		const isVersion =
			originalDocument.metadata &&
			originalDocument.metadata.parent_document &&
			originalDocument.metadata.version;

		// Wenn es eine abgeleitete Version ist, verwende die parent_document ID
		const rootDocumentId =
			isVersion && originalDocument.metadata
				? originalDocument.metadata.parent_document
				: documentId;

		// Suche nach allen Dokumenten, die entweder das Original sind oder das Original als parent_document haben
		const { data: versions, error } = await supabase
			.from('documents')
			.select('*')
			.or(`id.eq.${rootDocumentId},metadata->parent_document.eq.${rootDocumentId}`);

		if (error) {
			return { data: [], error };
		}

		// Sortiere die Versionen nach Erstellungsdatum
		const sortedVersions = versions.sort((a, b) => {
			// Das Original soll immer zuerst kommen
			if (a.id === rootDocumentId) return -1;
			if (b.id === rootDocumentId) return 1;

			// Ansonsten nach Erstellungsdatum sortieren
			return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
		});

		return { data: sortedVersions, error: null };
	} catch (error) {
		console.error('Fehler beim Abrufen der Dokumentversionen:', error);
		return { data: [], error: `Fehler beim Abrufen der Versionen: ${error}` };
	}
};

/**
 * Findet die nächste oder vorherige Version eines Dokuments
 * @param documentId ID des aktuellen Dokuments
 * @param direction 'next' oder 'previous' für die Richtung
 * @returns Die ID der nächsten/vorherigen Version oder null, wenn keine existiert
 */
export const getAdjacentDocumentVersion = async (
	documentId: string,
	direction: 'next' | 'previous'
): Promise<{ data: string | null; error: any }> => {
	try {
		// Alle Versionen abrufen
		const { data: versions, error } = await getDocumentVersions(documentId);

		if (error || !versions.length) {
			return { data: null, error: error || 'Keine Versionen gefunden' };
		}

		// Index des aktuellen Dokuments finden
		const currentIndex = versions.findIndex((doc) => doc.id === documentId);

		if (currentIndex === -1) {
			return { data: null, error: 'Aktuelles Dokument nicht in Versionen gefunden' };
		}

		// Nächste oder vorherige Version bestimmen
		let targetIndex;
		if (direction === 'next') {
			targetIndex = currentIndex + 1;
			if (targetIndex >= versions.length) {
				return { data: null, error: 'Keine neuere Version verfügbar' };
			}
		} else {
			// 'previous'
			targetIndex = currentIndex - 1;
			if (targetIndex < 0) {
				return { data: null, error: 'Keine ältere Version verfügbar' };
			}
		}

		return { data: versions[targetIndex].id, error: null };
	} catch (error) {
		console.error(
			`Fehler beim Abrufen der ${direction === 'next' ? 'nächsten' : 'vorherigen'} Version:`,
			error
		);
		return { data: null, error: `Fehler beim Abrufen der Version: ${error}` };
	}
};

/**
 * Erstellt eine neue Version eines Dokuments basierend auf KI-generiertem Text
 * Die alte Version bleibt erhalten und wird in der Metadaten-Historie der neuen Version referenziert
 */
export const createDocumentVersion = async (
	originalDocumentId: string,
	newContent: string,
	generationType: 'summary' | 'continuation' | 'rewrite' | 'ideas',
	aiModel: string,
	prompt: string
): Promise<{ data: Document | null; error: any }> => {
	try {
		// Originaldokument abrufen
		const originalDocument = await getDocumentById(originalDocumentId);
		if (!originalDocument) {
			return { data: null, error: 'Originaldokument nicht gefunden' };
		}

		// Aktuelle Session abrufen
		const { data: sessionData } = await supabase.auth.getSession();
		const user = sessionData?.session?.user;
		if (!user) {
			return { data: null, error: 'Nicht angemeldet' };
		}

		// Berechne die Wortanzahl des neuen Inhalts
		const wordCount = countWords(newContent);

		// Metadaten für die neue Version vorbereiten
		const metadata = {
			parent_document: originalDocumentId,
			original_title: originalDocument.title,
			generation_type: generationType,
			model_used: aiModel,
			prompt_used: prompt,
			created_at: new Date().toISOString(),
			version: 1, // Startet bei 1 für die erste KI-generierte Version
			version_history: [
				{
					id: originalDocumentId,
					title: originalDocument.title,
					type: originalDocument.type,
					created_at: originalDocument.created_at,
					is_original: true,
				},
			],
			word_count: wordCount,
		};

		// Titel für die neue Version basierend auf dem Generationstyp erstellen
		let newTitle = '';
		switch (generationType) {
			case 'summary':
				newTitle = `Zusammenfassung: ${originalDocument.title}`;
				break;
			case 'continuation':
				newTitle = `Fortsetzung: ${originalDocument.title}`;
				break;
			case 'rewrite':
				newTitle = `Umformulierung: ${originalDocument.title}`;
				break;
			case 'ideas':
				newTitle = `Ideen zu: ${originalDocument.title}`;
				break;
			default:
				newTitle = `KI-Version: ${originalDocument.title}`;
		}

		// Neue Version des Dokuments erstellen
		const { data, error } = await supabase
			.from('documents')
			.insert([
				{
					title: newTitle,
					content: newContent,
					type: 'generated', // Immer vom Typ 'generated' für KI-generierte Versionen
					space_id: originalDocument.space_id,
					user_id: user.id,
					metadata,
				},
			])
			.select()
			.single();

		return { data, error };
	} catch (error) {
		console.error('Fehler beim Erstellen der neuen Dokumentversion:', error);
		return { data: null, error: `Fehler beim Erstellen der neuen Version: ${error}` };
	}
};
