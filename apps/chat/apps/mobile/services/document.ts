/**
 * Document Service - CRUD operations via Backend API
 */
import { documentApi } from './api';
import type { Document as ApiDocument } from './api';

// Re-export type with backwards-compatible naming (snake_case for mobile)
export interface Document {
	id: string;
	conversation_id: string;
	version: number;
	content: string;
	created_at: string;
	updated_at: string;
}

// Helper to convert API response to local format
function toLocalDocument(doc: ApiDocument): Document {
	return {
		id: doc.id,
		conversation_id: doc.conversationId,
		version: doc.version,
		content: doc.content,
		created_at: doc.createdAt,
		updated_at: doc.updatedAt,
	};
}

/**
 * Erstellt ein neues Dokument in einer Konversation
 */
export async function createDocument(
	conversationId: string,
	content: string
): Promise<Document | null> {
	try {
		console.log(
			`Erstelle Dokument für Konversation ${conversationId} mit Inhalt: ${content.substring(0, 50)}...`
		);

		const document = await documentApi.createDocument(conversationId, content);

		if (!document) {
			console.error('Fehler beim Erstellen des Dokuments');
			return null;
		}

		console.log('Dokument erfolgreich erstellt:', document);
		return toLocalDocument(document);
	} catch (error) {
		console.error('Fehler beim Erstellen des Dokuments:', error);
		if (error instanceof Error) {
			console.error('Error details:', error.message, error.stack);
		}
		return null;
	}
}

/**
 * Erstellt eine neue Version eines Dokuments
 */
export async function createDocumentVersion(
	conversationId: string,
	content: string
): Promise<Document | null> {
	try {
		const document = await documentApi.createDocumentVersion(conversationId, content);

		if (!document) {
			console.error('Fehler beim Erstellen der neuen Dokumentversion');
			return null;
		}

		return toLocalDocument(document);
	} catch (error) {
		console.error('Fehler beim Erstellen der neuen Dokumentversion:', error);
		return null;
	}
}

/**
 * Holt die aktuellste Version eines Dokuments für eine Konversation
 */
export async function getLatestDocument(conversationId: string): Promise<Document | null> {
	try {
		console.log(`Lade neuestes Dokument für Konversation ${conversationId}`);

		const document = await documentApi.getLatestDocument(conversationId);

		if (!document) {
			console.log('Kein Dokument gefunden');
			return null;
		}

		console.log(`Neuestes Dokument gefunden: Version ${document.version}, ID ${document.id}`);
		return toLocalDocument(document);
	} catch (error) {
		console.error('Fehler beim Laden des aktuellen Dokuments:', error);
		return null;
	}
}

/**
 * Lädt alle Versionen eines Dokuments für eine Konversation
 */
export async function getAllDocumentVersions(conversationId: string): Promise<Document[]> {
	try {
		console.log(`Lade alle Dokumentversionen für Konversation ${conversationId}`);

		const documents = await documentApi.getAllDocumentVersions(conversationId);

		console.log(`${documents.length} Dokumentversionen geladen`);

		if (documents.length > 0) {
			console.log(`Erstes Dokument: ID=${documents[0].id}, Version=${documents[0].version}`);
		} else {
			console.log('Keine Dokumente gefunden');
		}

		return documents.map(toLocalDocument);
	} catch (error) {
		console.error('Fehler beim Laden der Dokumentversionen:', error);
		return [];
	}
}

/**
 * Prüft, ob für eine Konversation ein Dokument existiert
 */
export async function hasDocument(conversationId: string): Promise<boolean> {
	try {
		return await documentApi.hasDocument(conversationId);
	} catch (error) {
		console.error('Fehler beim Prüfen auf Dokument:', error);
		return false;
	}
}

/**
 * Löscht eine spezifische Dokumentversion
 */
export async function deleteDocumentVersion(documentId: string): Promise<boolean> {
	try {
		console.log(`=== LÖSCH-OPERATION GESTARTET FÜR DOKUMENT ID ${documentId} ===`);

		const success = await documentApi.deleteDocumentVersion(documentId);

		if (success) {
			console.log(`=== DOKUMENT ${documentId} ERFOLGREICH GELÖSCHT ===`);
		} else {
			console.error('Fehler beim Löschen der Dokumentversion');
		}

		return success;
	} catch (error) {
		console.error('Unerwarteter Fehler beim Löschen der Dokumentversion:', error);
		if (error instanceof Error) {
			console.error('Fehlerstack:', error.stack);
		}
		return false;
	}
}
