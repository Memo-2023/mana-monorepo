/**
 * Hilfsfunktionen für Textverarbeitung
 */

/**
 * Zählt die Anzahl der Wörter in einem Text
 * @param text Der zu zählende Text
 * @returns Die Anzahl der Wörter im Text
 */
export const countWords = (text: string): number => {
	if (!text) return 0;
	return text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;
};

/**
 * Berechnet die geschätzte Lesezeit in Minuten
 * @param text Der zu lesende Text
 * @param wordsPerMinute Wörter pro Minute (Standard: 200)
 * @returns Die geschätzte Lesezeit in Minuten
 */
export const calculateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
	const words = countWords(text);
	return Math.ceil(words / wordsPerMinute);
};
