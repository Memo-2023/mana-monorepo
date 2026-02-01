import { Injectable } from '@nestjs/common';

/**
 * Formats text responses for natural German speech synthesis.
 * Converts markdown, numbers, times, lists etc. to spoken language.
 */
@Injectable()
export class VoiceFormatterService {
	private readonly MAX_AUDIO_CHARS = 800;
	private readonly MAX_LIST_ITEMS = 3;

	/**
	 * Main entry point - formats text for TTS
	 */
	format(text: string): string {
		if (!text || text.trim().length === 0) {
			return '';
		}

		let result = text;

		// Remove code blocks first (they shouldn't be read)
		result = this.removeCodeBlocks(result);

		// Handle lists before other formatting
		result = this.formatLists(result);

		// Remove markdown formatting
		result = this.removeMarkdown(result);

		// Convert task metadata (!p1, @heute, #projekt)
		result = this.formatTaskMetadata(result);

		// Convert times to German speech
		result = this.formatTimes(result);

		// Convert dates to German speech
		result = this.formatDates(result);

		// Convert numbers to words for small numbers
		result = this.formatNumbers(result);

		// Remove emojis
		result = this.removeEmojis(result);

		// Remove URLs
		result = this.removeUrls(result);

		// Clean up whitespace and punctuation
		result = this.cleanupText(result);

		// Truncate if too long
		result = this.truncateIfNeeded(result);

		return result.trim();
	}

	/**
	 * Format for confirmations (short, friendly)
	 */
	formatConfirmation(action: string, item: string): string {
		return `Erledigt. ${action} ${item}.`;
	}

	/**
	 * Format for errors (clear, helpful)
	 */
	formatError(message: string): string {
		const cleanMessage = this.removeEmojis(message).trim();
		return `Es gab ein Problem: ${cleanMessage}`;
	}

	/**
	 * Format for list summaries
	 */
	formatListSummary(items: string[], itemType: string): string {
		const count = items.length;

		if (count === 0) {
			return `Du hast keine ${itemType}.`;
		}

		if (count === 1) {
			return `Du hast eine ${itemType.replace(/n$/, '')}: ${items[0]}.`;
		}

		if (count <= this.MAX_LIST_ITEMS) {
			const lastItem = items[items.length - 1];
			const otherItems = items.slice(0, -1).join(', ');
			return `Du hast ${this.numberToWord(count)} ${itemType}: ${otherItems} und ${lastItem}.`;
		}

		// Summarize long lists
		const topItems = items.slice(0, this.MAX_LIST_ITEMS);
		const remaining = count - this.MAX_LIST_ITEMS;
		const topItemsText = topItems.join(', ');
		return `Du hast ${this.numberToWord(count)} ${itemType}. Die wichtigsten: ${topItemsText}. Und ${this.numberToWord(remaining)} weitere.`;
	}

	// --- Private helper methods ---

	private removeCodeBlocks(text: string): string {
		// Remove fenced code blocks
		let result = text.replace(/```[\s\S]*?```/g, '');
		// Remove inline code
		result = result.replace(/`[^`]+`/g, '');
		return result;
	}

	private formatLists(text: string): string {
		// Find bullet point lists and format them
		const bulletListRegex = /(?:^[•\-\*]\s+.+$\n?)+/gm;
		let result = text.replace(bulletListRegex, (match) => {
			const items = match
				.split('\n')
				.map((line) => line.replace(/^[•\-\*]\s+/, '').trim())
				.filter((line) => line.length > 0);

			if (items.length <= this.MAX_LIST_ITEMS) {
				return items.join('. ') + '. ';
			}

			// Summarize long lists
			const topItems = items.slice(0, this.MAX_LIST_ITEMS);
			const remaining = items.length - this.MAX_LIST_ITEMS;
			return `${topItems.join('. ')}. Und ${this.numberToWord(remaining)} weitere. `;
		});

		// Format numbered lists
		const numberedListRegex = /(?:^\d+\.\s+.+$\n?)+/gm;
		result = result.replace(numberedListRegex, (match) => {
			const items = match
				.split('\n')
				.map((line) => line.replace(/^\d+\.\s+/, '').trim())
				.filter((line) => line.length > 0);

			if (items.length <= this.MAX_LIST_ITEMS) {
				return items.map((item, i) => `${this.ordinalWord(i + 1)}, ${item}`).join('. ') + '. ';
			}

			const topItems = items.slice(0, this.MAX_LIST_ITEMS);
			const remaining = items.length - this.MAX_LIST_ITEMS;
			const formattedTop = topItems
				.map((item, i) => `${this.ordinalWord(i + 1)}, ${item}`)
				.join('. ');
			return `${formattedTop}. Und ${this.numberToWord(remaining)} weitere. `;
		});

		return result;
	}

	private removeMarkdown(text: string): string {
		let result = text;

		// Bold
		result = result.replace(/\*\*(.+?)\*\*/g, '$1');
		// Italic
		result = result.replace(/\*(.+?)\*/g, '$1');
		// Strikethrough
		result = result.replace(/~~(.+?)~~/g, '$1');
		// Headers
		result = result.replace(/^#{1,6}\s*/gm, '');
		// Links [text](url)
		result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
		// Block quotes
		result = result.replace(/^>\s*/gm, '');

		return result;
	}

	private formatTaskMetadata(text: string): string {
		let result = text;

		// Priority: !p1, !p2, !p3, !p4
		result = result.replace(/!p1\b/gi, 'mit höchster Priorität');
		result = result.replace(/!p2\b/gi, 'mit hoher Priorität');
		result = result.replace(/!p3\b/gi, 'mit normaler Priorität');
		result = result.replace(/!p4\b/gi, 'mit niedriger Priorität');

		// Due dates: @heute, @morgen, @übermorgen
		result = result.replace(/@heute\b/gi, 'fällig heute');
		result = result.replace(/@morgen\b/gi, 'fällig morgen');
		result = result.replace(/@übermorgen\b/gi, 'fällig übermorgen');

		// Projects: #projektname -> im Projekt "projektname"
		result = result.replace(/#(\w+)/g, 'im Projekt $1');

		return result;
	}

	private formatTimes(text: string): string {
		// Convert 24h time format to German speech
		return text.replace(/(\d{1,2}):(\d{2})(?:\s*Uhr)?/g, (_, h, m) => {
			const hour = parseInt(h);
			const min = parseInt(m);

			if (min === 0) {
				return `${this.numberToWord(hour)} Uhr`;
			} else if (min === 30) {
				return `halb ${this.numberToWord(hour + 1)}`;
			} else if (min === 15) {
				return `viertel nach ${this.numberToWord(hour)}`;
			} else if (min === 45) {
				return `viertel vor ${this.numberToWord(hour + 1)}`;
			}
			return `${this.numberToWord(hour)} Uhr ${this.numberToWord(min)}`;
		});
	}

	private formatDates(text: string): string {
		let result = text;

		// German date format: DD.MM. or DD.MM.YYYY
		result = result.replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})?/g, (_, d, m, y) => {
			const day = parseInt(d);
			const month = parseInt(m);
			const monthNames = [
				'Januar',
				'Februar',
				'März',
				'April',
				'Mai',
				'Juni',
				'Juli',
				'August',
				'September',
				'Oktober',
				'November',
				'Dezember',
			];
			const monthName = monthNames[month - 1] || '';

			if (y) {
				return `${day}. ${monthName} ${y}`;
			}
			return `${day}. ${monthName}`;
		});

		return result;
	}

	private formatNumbers(text: string): string {
		// Only convert small standalone numbers (1-12) to words
		// Larger numbers are fine as digits for speech synthesis
		return text.replace(/\b(\d+)\b/g, (match, numStr) => {
			const num = parseInt(numStr);
			if (num >= 1 && num <= 12) {
				return this.numberToWord(num);
			}
			return match;
		});
	}

	private numberToWord(n: number): string {
		const words = [
			'null',
			'eins',
			'zwei',
			'drei',
			'vier',
			'fünf',
			'sechs',
			'sieben',
			'acht',
			'neun',
			'zehn',
			'elf',
			'zwölf',
			'dreizehn',
			'vierzehn',
			'fünfzehn',
			'sechzehn',
			'siebzehn',
			'achtzehn',
			'neunzehn',
			'zwanzig',
			'einundzwanzig',
			'zweiundzwanzig',
			'dreiundzwanzig',
			'vierundzwanzig',
		];

		if (n >= 0 && n < words.length) {
			return words[n];
		}
		return n.toString();
	}

	private ordinalWord(n: number): string {
		const ordinals = [
			'',
			'Erstens',
			'Zweitens',
			'Drittens',
			'Viertens',
			'Fünftens',
			'Sechstens',
			'Siebtens',
			'Achtens',
			'Neuntens',
			'Zehntens',
		];

		if (n >= 1 && n < ordinals.length) {
			return ordinals[n];
		}
		return `${n}.`;
	}

	private removeEmojis(text: string): string {
		// Remove common emojis used in bot responses
		return text.replace(
			/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[✅❌⏱️📋📅🔮💡🎤🔊☀️💪🔔✓]/gu,
			''
		);
	}

	private removeUrls(text: string): string {
		return text.replace(/https?:\/\/[^\s]+/g, '');
	}

	private cleanupText(text: string): string {
		let result = text;

		// Multiple newlines to single period
		result = result.replace(/\n{2,}/g, '. ');
		// Single newlines to space
		result = result.replace(/\n/g, ' ');
		// Multiple spaces to single
		result = result.replace(/\s{2,}/g, ' ');
		// Remove space before punctuation
		result = result.replace(/\s+([.,!?;:])/g, '$1');
		// Remove duplicate punctuation
		result = result.replace(/([.,!?;:])\s*([.,!?;:])/g, '$1');
		// Ensure space after punctuation
		result = result.replace(/([.,!?;:])([A-Za-zÄÖÜäöüß])/g, '$1 $2');
		// Remove trailing/leading punctuation from text
		result = result.replace(/^[.,!?;:\s]+/, '');
		result = result.replace(/[.,!?;:\s]+$/, '');

		return result;
	}

	private truncateIfNeeded(text: string): string {
		if (text.length <= this.MAX_AUDIO_CHARS) {
			return text;
		}

		// Try to truncate at sentence boundary
		const truncated = text.slice(0, this.MAX_AUDIO_CHARS);
		const lastSentenceEnd = Math.max(
			truncated.lastIndexOf('. '),
			truncated.lastIndexOf('! '),
			truncated.lastIndexOf('? ')
		);

		if (lastSentenceEnd > this.MAX_AUDIO_CHARS * 0.5) {
			return truncated.slice(0, lastSentenceEnd + 1) + ' Und so weiter.';
		}

		// Fallback: truncate at word boundary
		const lastSpace = truncated.lastIndexOf(' ');
		if (lastSpace > 0) {
			return truncated.slice(0, lastSpace) + '. Und so weiter.';
		}

		return truncated + '. Und so weiter.';
	}
}
