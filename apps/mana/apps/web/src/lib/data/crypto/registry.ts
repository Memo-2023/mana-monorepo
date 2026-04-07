/**
 * Encryption registry — single source of truth for which fields on which
 * tables get encrypted.
 *
 * Strict allowlist semantics: anything not listed here stays plaintext.
 * Adding a new module = adding an entry here. Forgetting to add a field
 * means it ships in plaintext, which is the safer failure mode than the
 * inverse (a typo'd field name silently failing to decrypt).
 *
 * Why a central registry instead of per-module config?
 *   - One pull request to audit ahead of a release: "what is encrypted?"
 *   - The Dexie hook in database.ts iterates this map once at startup
 *     instead of looking up per-module config files at write time
 *   - Keeps the encryption surface visible to security review without
 *     hunting through 27 module directories
 *
 * Phasing:
 *   `enabled: false` is the safe default for Phase 1. The actual flip
 *   to `true` happens in Phase 3, table by table, after the server-side
 *   vault is wired up and the key provider is no longer NullKeyProvider.
 *   This means Phase 1 can land on main without changing app behaviour.
 *
 * Field selection rules:
 *   - Encrypt: user-typed text, transcripts, PII, free-form notes,
 *     anything that would embarrass or harm the user if it leaked
 *   - Plaintext: IDs, foreign keys, timestamps, status flags, sort keys,
 *     enum discriminators, anything indexed for queries
 *   - When in doubt about a free-form field, encrypt it
 *   - When in doubt about a structural field, leave it plaintext (the
 *     query layer needs it)
 */

export interface EncryptionConfig {
	/** Field names that get encrypted on write, decrypted on read. */
	readonly fields: readonly string[];
	/** Phase 1 hard-default: false. Flipped table by table in Phase 3. */
	readonly enabled: boolean;
}

export const ENCRYPTION_REGISTRY: Record<string, EncryptionConfig> = {
	// ─── Chat ────────────────────────────────────────────────
	messages: { enabled: false, fields: ['messageText'] },
	conversations: { enabled: false, fields: ['title'] },
	chatTemplates: {
		enabled: false,
		fields: ['name', 'description', 'systemPrompt', 'initialQuestion'],
	},

	// ─── Notes ───────────────────────────────────────────────
	notes: { enabled: false, fields: ['title', 'body', 'content'] },

	// ─── Dreams ──────────────────────────────────────────────
	dreams: { enabled: false, fields: ['title', 'content', 'notes'] },
	dreamSymbols: { enabled: false, fields: ['name', 'meaning'] },

	// ─── Memoro ──────────────────────────────────────────────
	memos: { enabled: false, fields: ['title', 'intro', 'transcript'] },
	memories: { enabled: false, fields: ['title', 'content'] },

	// ─── Contacts ────────────────────────────────────────────
	contacts: {
		enabled: false,
		fields: [
			'firstName',
			'lastName',
			'email',
			'phone',
			'mobile',
			'birthday',
			'street',
			'city',
			'postalCode',
			'country',
			'notes',
			'website',
			'linkedin',
			'twitter',
			'instagram',
			'github',
		],
	},

	// ─── Tasks ───────────────────────────────────────────────
	tasks: { enabled: false, fields: ['title', 'description', 'subtasks', 'metadata'] },

	// ─── Calendar ────────────────────────────────────────────
	events: { enabled: false, fields: ['title', 'description', 'location'] },

	// ─── Cycles ──────────────────────────────────────────────
	cycles: { enabled: false, fields: ['notes'] },
	cycleDayLogs: { enabled: false, fields: ['notes', 'symptoms', 'mood'] },

	// ─── NutriPhi ────────────────────────────────────────────
	meals: { enabled: false, fields: ['description', 'notes', 'aiAnalysis'] },

	// ─── Planta ──────────────────────────────────────────────
	plants: { enabled: false, fields: ['name', 'notes', 'careNotes'] },

	// ─── Cards ───────────────────────────────────────────────
	cards: { enabled: false, fields: ['front', 'back', 'notes'] },
	cardDecks: { enabled: false, fields: ['title', 'description'] },

	// ─── Presi ───────────────────────────────────────────────
	presiDecks: { enabled: false, fields: ['title', 'description'] },
	slides: { enabled: false, fields: ['content', 'notes'] },

	// ─── Context ─────────────────────────────────────────────
	documents: { enabled: false, fields: ['title', 'content', 'body'] },

	// ─── Storage ─────────────────────────────────────────────
	files: { enabled: false, fields: ['name', 'originalName', 'notes'] },

	// ─── Picture ─────────────────────────────────────────────
	images: { enabled: false, fields: ['prompt', 'negativePrompt', 'revisedPrompt', 'notes'] },

	// ─── Music ───────────────────────────────────────────────
	songs: { enabled: false, fields: ['title', 'artist', 'album', 'lyrics', 'notes'] },
	mukkePlaylists: { enabled: false, fields: ['name', 'description'] },

	// ─── Questions ───────────────────────────────────────────
	questions: { enabled: false, fields: ['title', 'body', 'notes'] },
	answers: { enabled: false, fields: ['body'] },

	// ─── Events (social gatherings) ──────────────────────────
	socialEvents: { enabled: false, fields: ['title', 'description', 'notes'] },
	eventGuests: { enabled: false, fields: ['name', 'email', 'phone', 'notes'] },

	// ─── Finance ─────────────────────────────────────────────
	transactions: { enabled: false, fields: ['description', 'notes', 'merchant'] },

	// ─── uLoad ───────────────────────────────────────────────
	links: { enabled: false, fields: ['title', 'description', 'targetUrl'] },
	manaLinks: { enabled: false, fields: ['label', 'url', 'notes'] },

	// ─── Inventar ────────────────────────────────────────────
	invItems: { enabled: false, fields: ['name', 'description', 'notes'] },
};

/**
 * Returns the field allowlist for `tableName`, or `null` if the table is
 * either not registered, currently disabled, or has an empty field list.
 * Hot-path helper used by the Dexie hooks — must stay synchronous and
 * allocation-free for the common (non-encrypted) case.
 */
export function getEncryptedFields(tableName: string): readonly string[] | null {
	const config = ENCRYPTION_REGISTRY[tableName];
	if (!config || !config.enabled || config.fields.length === 0) return null;
	return config.fields;
}

/** True if at least one table is currently flipped to encrypted. Used by
 *  the Phase 3 boot path to decide whether to fetch the master key at
 *  all — no point asking the server for a key when nothing uses it. */
export function hasAnyEncryption(): boolean {
	for (const config of Object.values(ENCRYPTION_REGISTRY)) {
		if (config.enabled) return true;
	}
	return false;
}

/** All table names that have an encryption entry, regardless of whether
 *  they're currently enabled. Used by the rollout audit and the
 *  DATA_LAYER_AUDIT.md doc to confirm coverage. */
export function getRegisteredTables(): string[] {
	return Object.keys(ENCRYPTION_REGISTRY);
}
