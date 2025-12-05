/**
 * Utility functions for processing document mentions in markdown content
 */

// Regex to match XML tags with attributes
export const XML_TAG_REGEX = /<mention[^>]*>(.*?)<\/mention>/g;

// Regular expression to match document mentions in the format [[Document Title]]
export const MENTION_REGEX = /\[\[(.*?)\]\]/g;

// Standard Markdown-Link-Format: [Titel](ID)
export const MARKDOWN_LINK_REGEX = /\[(.*?)\]\((.*?)\)/g;

// Legacy format for backward compatibility
export const LEGACY_MENTION_REGEX = /@\[(.*?)\]\((.*?)\)/g;

/**
 * Extract all document mentions from markdown content
 */
export const extractMentions = (content: string): Array<{ title: string; id?: string }> => {
	const mentions: Array<{ title: string; id?: string }> = [];
	let match;

	// Neue Format: [[Dokumenttitel]]
	const regex = new RegExp(MENTION_REGEX);
	while ((match = regex.exec(content)) !== null) {
		mentions.push({
			title: match[1],
		});
	}

	// Standard Markdown-Link-Format: [Titel](ID)
	const markdownRegex = new RegExp(MARKDOWN_LINK_REGEX);
	while ((match = markdownRegex.exec(content)) !== null) {
		mentions.push({
			title: match[1],
			id: match[2],
		});
	}

	// Legacy Format: @[Dokumenttitel](dokumentId)
	const legacyRegex = new RegExp(LEGACY_MENTION_REGEX);
	while ((match = legacyRegex.exec(content)) !== null) {
		mentions.push({
			title: match[1],
			id: match[2],
		});
	}

	return mentions;
};

/**
 * Replace document mentions in markdown content with custom components
 * This is used by the markdown renderer to render mentions as interactive components
 */
export const processMentionsInMarkdown = (content: string): string => {
	let processedContent = content;

	// Verarbeite das neue Format [[Dokumenttitel]]
	processedContent = processedContent.replace(MENTION_REGEX, (match, title) => {
		// Verwende einen speziellen Markdown-Link mit einem data-Attribut
		return `<mention documentTitle="${title}">${title}</mention>`;
	});

	// Verarbeite Standard Markdown-Links [Titel](ID)
	processedContent = processedContent.replace(MARKDOWN_LINK_REGEX, (match, title, id) => {
		// Prüfe, ob der Link eine Dokument-ID ist (keine URL)
		if (!id.startsWith('http') && !id.startsWith('www') && !id.includes('/')) {
			// Verwende einen speziellen Markdown-Link mit einem data-Attribut
			return `<mention documentId="${id}" documentTitle="${title}">${title}</mention>`;
		}

		// Wenn es ein normaler Link ist, nicht verändern
		return match;
	});

	// Verarbeite das Legacy-Format @[Dokumenttitel](dokumentId) für Abwärtskompatibilität
	processedContent = processedContent.replace(LEGACY_MENTION_REGEX, (match, title, id) => {
		// Verwende einen speziellen Markdown-Link mit einem data-Attribut
		return `<mention documentId="${id}" documentTitle="${title}">${title}</mention>`;
	});

	return processedContent;
};

/**
 * Entfernt XML-Tags aus dem Markdown-Inhalt und ersetzt sie durch den Inhalt des Tags
 * Dies ist nützlich, wenn die Markdown-Komponente die benutzerdefinierten Tags nicht korrekt verarbeitet
 */
export const cleanMentionTags = (content: string): string => {
	if (!content) return '';

	// Entferne alle <mention>-Tags und ersetze sie durch den Inhalt des documentTitle-Attributs
	let cleanedContent = content;

	// Ersetze alle Vorkommen von <mention>-Tags mit ihrem documentTitle
	// Dieses Pattern ist sehr spezifisch für die Struktur der Tags
	cleanedContent = cleanedContent.replace(
		/<mention[^>]*documentTitle="([^"]*)"[^>]*>.*?<\/mention>/g,
		(match, title) => {
			return title;
		}
	);

	return cleanedContent;
};

/**
 * Check if text contains a potential mention
 */
export const containsPotentialMention = (text: string): boolean => {
	return text.includes('[[') || text.includes('@') || (text.includes('[') && text.includes(']('));
};
