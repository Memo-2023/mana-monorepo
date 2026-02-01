/**
 * Keyword command mapping
 */
export interface KeywordCommand {
	/** Keywords that trigger this command (lowercase) */
	keywords: string[];
	/** Command name to return when matched */
	command: string;
}

/**
 * Options for keyword detection
 */
export interface KeywordDetectorOptions {
	/** Maximum message length to check (default: 60) */
	maxLength?: number;
	/** Whether to match partial words (default: false) */
	partialMatch?: boolean;
}

/**
 * Detect commands from natural language keywords
 *
 * Used by Matrix bots to respond to natural language instead of just !commands.
 *
 * @example
 * ```typescript
 * const detector = new KeywordCommandDetector([
 *   { keywords: ['hilfe', 'help'], command: 'help' },
 *   { keywords: ['status', 'info'], command: 'status' },
 * ]);
 *
 * detector.detect('hilfe bitte'); // Returns 'help'
 * detector.detect('was ist los'); // Returns null
 * ```
 */
export class KeywordCommandDetector {
	private readonly maxLength: number;
	private readonly partialMatch: boolean;

	constructor(
		private readonly commands: KeywordCommand[],
		options: KeywordDetectorOptions = {}
	) {
		this.maxLength = options.maxLength ?? 60;
		this.partialMatch = options.partialMatch ?? false;
	}

	/**
	 * Detect a command from a message
	 *
	 * @param message - The user's message
	 * @returns The command name if matched, null otherwise
	 */
	detect(message: string): string | null {
		const lowerMessage = message.toLowerCase().trim();

		// Skip long messages (likely not commands)
		if (lowerMessage.length > this.maxLength) {
			return null;
		}

		for (const { keywords, command } of this.commands) {
			for (const keyword of keywords) {
				if (this.matches(lowerMessage, keyword)) {
					return command;
				}
			}
		}

		return null;
	}

	/**
	 * Check if message matches a keyword
	 */
	private matches(message: string, keyword: string): boolean {
		// Exact match
		if (message === keyword) {
			return true;
		}

		// Message starts with keyword followed by space
		if (message.startsWith(keyword + ' ')) {
			return true;
		}

		// Partial match (keyword appears anywhere)
		if (this.partialMatch && message.includes(keyword)) {
			return true;
		}

		return false;
	}

	/**
	 * Add more commands dynamically
	 */
	addCommands(commands: KeywordCommand[]): void {
		this.commands.push(...commands);
	}

	/**
	 * Get all registered commands
	 */
	getCommands(): KeywordCommand[] {
		return [...this.commands];
	}
}

/**
 * Common German/English keywords used across bots
 */
export const COMMON_KEYWORDS: KeywordCommand[] = [
	{ keywords: ['hilfe', 'help', 'befehle', 'commands', '?'], command: 'help' },
	{ keywords: ['status', 'info'], command: 'status' },
	{ keywords: ['abbrechen', 'cancel', 'stop'], command: 'cancel' },
];
