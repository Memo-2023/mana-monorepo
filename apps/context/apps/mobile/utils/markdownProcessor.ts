/**
 * Utility functions for processing markdown syntax
 */

/**
 * Processes content in markdown
 *
 * @param content The markdown content to process
 * @param isDark Whether dark mode is enabled
 * @returns Processed markdown content
 */
export const processAIContentBlocks = (content: string, isDark: boolean): string => {
	// Wir entfernen alle speziellen Marker, die früher für die Unterscheidung
	// zwischen Benutzer- und KI-Eingaben verwendet wurden
	if (!content) return '';

	// Entferne alle Marker
	let processedContent = content
		.replace(/\/\/\/ KI Antwort, .*?, .*?\n\n/g, '')
		.replace(/\/\/\/ Nutzer, .*?, .*?\n\n/g, '')
		.replace(/\n\n\/\/\//g, '');

	return processedContent;
};
