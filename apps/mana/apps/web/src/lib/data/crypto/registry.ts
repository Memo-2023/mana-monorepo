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
	// Phase 5: messageText is the highest-value target in the entire app.
	messages: { enabled: true, fields: ['messageText'] },
	conversations: { enabled: true, fields: ['title'] },
	chatTemplates: {
		enabled: true,
		fields: ['name', 'description', 'systemPrompt', 'initialQuestion'],
	},

	// ─── Notes ───────────────────────────────────────────────
	// Phase 4 pilot — first table flipped to enabled:true. The schema
	// uses `title` + `content` (no separate `body` column).
	notes: { enabled: true, fields: ['title', 'content'] },

	// ─── Dreams ──────────────────────────────────────────────
	// LocalDream uses content + transcript + interpretation, no `notes`.
	dreams: {
		enabled: true,
		fields: ['title', 'content', 'transcript', 'interpretation', 'aiInterpretation', 'location'],
	},
	// Symbol `name` stays plaintext — it's used as the unique lookup key
	// in touchSymbols / updateSymbol via where('name').equals(...). Only
	// the user-written `meaning` (which is the actually sensitive part)
	// is encrypted.
	dreamSymbols: { enabled: true, fields: ['meaning'] },

	// ─── Memoro ──────────────────────────────────────────────
	// Voice transcripts are typically the largest plaintext blobs in the
	// whole app — encrypting them yields the biggest disk-footprint win
	// of any single field.
	memos: { enabled: true, fields: ['title', 'intro', 'transcript'] },
	memories: { enabled: true, fields: ['title', 'content'] },

	// ─── Contacts ────────────────────────────────────────────
	contacts: {
		enabled: true,
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
	// Phase 7.1: tasks coordinated with timeBlocks below — title and
	// description are duplicated to the TimeBlock for calendar display,
	// so both sides have to be encrypted in lockstep.
	tasks: { enabled: true, fields: ['title', 'description', 'subtasks', 'metadata'] },

	// ─── Calendar ────────────────────────────────────────────
	// Same coordination as tasks: events.title/description/location are
	// mirrored onto a TimeBlock; encrypting only the calendar copy
	// would still leak via the timeBlocks table.
	events: { enabled: true, fields: ['title', 'description', 'location'] },

	// ─── Cycles ──────────────────────────────────────────────
	// Health data — GDPR Art. 9 sensitive personal data category.
	// `symptoms` stays plaintext: it's a string-array of standardised
	// labels (cramps, headache, ...) used as a Set in the symptom
	// counter store; encrypting it would break the diff loop in
	// dayLogsStore.logDay. `mood` is a single enum but with the same
	// privacy sensitivity as `notes` — encrypt it.
	cycles: { enabled: true, fields: ['notes'] },
	cycleDayLogs: { enabled: true, fields: ['notes', 'mood'] },

	// ─── NutriPhi ────────────────────────────────────────────
	meals: { enabled: false, fields: ['description', 'notes', 'aiAnalysis'] },

	// ─── Planta ──────────────────────────────────────────────
	// `name` is NOT in the schema index for plants (only isActive +
	// healthStatus), so encrypting it is safe. LocalPlant uses
	// `careNotes` (no separate `notes`) plus the user-typed metadata.
	plants: { enabled: true, fields: ['name', 'careNotes', 'temperature', 'soilType'] },

	// ─── Cards ───────────────────────────────────────────────
	// `cards` has no `notes` column on LocalCard — only front + back are
	// user content. cardDecks uses `name` (not `title`) on the schema
	// even though the public DTO translates it to `title`.
	cards: { enabled: true, fields: ['front', 'back'] },
	cardDecks: { enabled: true, fields: ['name', 'description'] },

	// ─── Presi ───────────────────────────────────────────────
	// LocalSlide only has `content` (SlideContent object) — no separate
	// notes column on the schema. JSON-stringify in wrapValue handles
	// the nested object cleanly.
	presiDecks: { enabled: true, fields: ['title', 'description'] },
	slides: { enabled: true, fields: ['content'] },

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
	// Writes from views are not yet routed through a store — registry
	// is set so future store creation gets encryption automatically;
	// existing direct db.table().update() call sites in the views need
	// to migrate to a store before they actually flow through encryptRecord.
	questions: { enabled: false, fields: ['title', 'body', 'notes'] },
	answers: { enabled: false, fields: ['body'] },

	// ─── Events (social gatherings) ──────────────────────────
	socialEvents: { enabled: false, fields: ['title', 'description', 'notes'] },
	eventGuests: { enabled: false, fields: ['name', 'email', 'phone', 'notes'] },

	// ─── Finance ─────────────────────────────────────────────
	// Transactions are budget-grade PII — amount/date/categoryId stay
	// plaintext for indexing + aggregation, only the user-typed text
	// fields (description + note) are encrypted. The schema uses
	// `note` (singular), not `notes` or `merchant`.
	transactions: { enabled: true, fields: ['description', 'note'] },

	// ─── uLoad ───────────────────────────────────────────────
	links: { enabled: false, fields: ['title', 'description', 'targetUrl'] },
	manaLinks: { enabled: false, fields: ['label', 'url', 'notes'] },

	// ─── Inventar ────────────────────────────────────────────
	// `name` is indexed (used in where()/sortBy queries). `notes` is an
	// array of {id, content, createdAt} that addNote/deleteNote splice
	// in place — encrypting it would force every mutation to decrypt+
	// re-encrypt the whole array. Encrypt only the description field
	// for now; broader coverage is a Phase 7 concern that needs a
	// different storage layout.
	invItems: { enabled: true, fields: ['description'] },

	// ─── TimeBlocks (cross-module hub) ───────────────────────
	// Phase 7.1: encrypted alongside tasks + calendar.events + habits
	// because the consumer modules denormalize their title/description
	// into the timeBlock for cheap calendar rendering. Encrypting only
	// the source records would still leak the same fields here.
	// Indexed columns (startDate, endDate, kind, type, sourceModule,
	// sourceId, parentBlockId, recurrenceDate) all stay plaintext —
	// the calendar query layer needs them for range scans.
	timeBlocks: { enabled: true, fields: ['title', 'description'] },
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
