import { getDocuments } from './supabaseService';
import { countWords, calculateReadingTime } from '~/utils/textUtils';

/**
 * Berechnet die Gesamtwortanzahl für einen Space
 * @param spaceId ID des Spaces
 * @returns Die Gesamtanzahl der Wörter aller Dokumente im Space
 */
export const calculateSpaceWordCount = async (spaceId: string): Promise<number> => {
	try {
		// Alle Dokumente im Space abrufen
		const documents = await getDocuments(spaceId);

		if (!documents || documents.length === 0) {
			return 0;
		}

		// Wortanzahl aus den Metadaten aller Dokumente summieren
		return documents.reduce((total, doc) => {
			// Wenn die Wortanzahl in den Metadaten gespeichert ist, verwende diese
			if (doc.metadata?.word_count !== undefined) {
				return total + (doc.metadata.word_count || 0);
			}

			// Ansonsten berechne die Wortanzahl aus dem Inhalt
			const contentWordCount = countWords(doc.content || '');
			return total + contentWordCount;
		}, 0);
	} catch (error) {
		console.error('Fehler bei der Berechnung der Wortanzahl:', error);
		return 0;
	}
};

/**
 * Berechnet die Wortanzahl für verschiedene Dokumenttypen in einem Space
 * @param spaceId ID des Spaces
 * @returns Ein Objekt mit der Wortanzahl pro Dokumenttyp
 */
export const calculateWordCountByDocumentType = async (
	spaceId: string
): Promise<{
	total: number;
	text: number;
	context: number;
	prompt: number;
	readingTime: number;
}> => {
	try {
		// Alle Dokumente im Space abrufen
		const documents = await getDocuments(spaceId);

		if (!documents || documents.length === 0) {
			return { total: 0, text: 0, context: 0, prompt: 0, readingTime: 0 };
		}

		// Initialisiere die Zähler
		const counts = {
			total: 0,
			text: 0,
			context: 0,
			prompt: 0,
			readingTime: 0,
		};

		// Zähle die Wörter nach Dokumenttyp
		documents.forEach((doc) => {
			// Bestimme die Wortanzahl des Dokuments
			const wordCount =
				doc.metadata?.word_count !== undefined
					? doc.metadata.word_count || 0
					: countWords(doc.content || '');

			// Erhöhe den entsprechenden Zähler
			counts.total += wordCount;

			if (doc.type === 'text') {
				counts.text += wordCount;
			} else if (doc.type === 'context') {
				counts.context += wordCount;
			} else if (doc.type === 'prompt') {
				counts.prompt += wordCount;
			}
		});

		// Berechne die geschätzte Lesezeit für alle Dokumente
		counts.readingTime = Math.ceil(counts.total / 200); // 200 Wörter pro Minute

		return counts;
	} catch (error) {
		console.error('Fehler bei der Berechnung der Wortanzahl nach Typ:', error);
		return { total: 0, text: 0, context: 0, prompt: 0, readingTime: 0 };
	}
};
