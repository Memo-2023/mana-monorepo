/**
 * Recent Input History Store
 *
 * Tracks recently used tags (#) and references (@) for quick access in the InputBar context menu.
 * Persists to localStorage for cross-session retention.
 */

const STORAGE_KEY_TAGS = 'inputbar-recent-tags';
const STORAGE_KEY_REFS = 'inputbar-recent-references';
const MAX_ITEMS = 10;

/**
 * Get recent tags from localStorage
 */
export function getRecentTags(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY_TAGS);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

/**
 * Get recent references from localStorage
 */
export function getRecentReferences(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY_REFS);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

/**
 * Add a tag to recent history
 * @param tag - The tag to add (with or without #)
 */
export function addRecentTag(tag: string): void {
	if (typeof window === 'undefined') return;

	// Normalize tag (ensure it starts with #)
	const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;

	try {
		const current = getRecentTags();
		// Remove if already exists (will be re-added at front)
		const filtered = current.filter((t) => t.toLowerCase() !== normalizedTag.toLowerCase());
		// Add to front, limit to MAX_ITEMS
		const updated = [normalizedTag, ...filtered].slice(0, MAX_ITEMS);
		localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(updated));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Add a reference to recent history
 * @param reference - The reference to add (with or without @)
 */
export function addRecentReference(reference: string): void {
	if (typeof window === 'undefined') return;

	// Normalize reference (ensure it starts with @)
	const normalizedRef = reference.startsWith('@') ? reference : `@${reference}`;

	try {
		const current = getRecentReferences();
		// Remove if already exists (will be re-added at front)
		const filtered = current.filter((r) => r.toLowerCase() !== normalizedRef.toLowerCase());
		// Add to front, limit to MAX_ITEMS
		const updated = [normalizedRef, ...filtered].slice(0, MAX_ITEMS);
		localStorage.setItem(STORAGE_KEY_REFS, JSON.stringify(updated));
	} catch {
		// Ignore storage errors
	}
}

/**
 * Extract and save tags and references from input text
 * Call this when user creates an item to track their usage patterns
 * @param text - The input text to parse
 */
export function extractAndSaveFromInput(text: string): void {
	if (!text) return;

	// Extract tags (#word)
	const tagMatches = text.match(/#\w+/g);
	if (tagMatches) {
		tagMatches.forEach((tag) => addRecentTag(tag));
	}

	// Extract references (@word)
	const refMatches = text.match(/@\w+/g);
	if (refMatches) {
		refMatches.forEach((ref) => addRecentReference(ref));
	}
}

/**
 * Clear all recent history
 */
export function clearRecentHistory(): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(STORAGE_KEY_TAGS);
		localStorage.removeItem(STORAGE_KEY_REFS);
	} catch {
		// Ignore storage errors
	}
}

/**
 * Create a reactive store for use in Svelte 5 components
 * Returns reactive state that updates when history changes
 */
export function createRecentInputHistoryStore() {
	let tags = $state<string[]>(getRecentTags());
	let references = $state<string[]>(getRecentReferences());

	// Refresh from localStorage
	function refresh() {
		tags = getRecentTags();
		references = getRecentReferences();
	}

	// Add tag and refresh
	function addTag(tag: string) {
		addRecentTag(tag);
		refresh();
	}

	// Add reference and refresh
	function addReference(ref: string) {
		addRecentReference(ref);
		refresh();
	}

	// Extract from text and refresh
	function extractAndSave(text: string) {
		extractAndSaveFromInput(text);
		refresh();
	}

	// Clear and refresh
	function clear() {
		clearRecentHistory();
		refresh();
	}

	return {
		get tags() {
			return tags;
		},
		get references() {
			return references;
		},
		addTag,
		addReference,
		extractAndSave,
		clear,
		refresh,
	};
}
