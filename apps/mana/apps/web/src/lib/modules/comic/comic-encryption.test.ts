/**
 * Comic encryption roundtrip test.
 *
 * `comicStories` ships with `panelMeta: Record<panelImageId, {caption,
 * dialogue, promptUsed, sourceInput}>` as an encrypted JSON blob via the
 * registry entry `entry<LocalComicStory>(['title', 'description',
 * 'storyContext', 'tags', 'panelMeta'])`. This test locks in the
 * roundtrip contract: every encrypted field recovers its exact value
 * after an encrypt→decrypt cycle, the structural fields (id, style,
 * characterMediaIds, panelImageIds, booleans, timestamps) stay
 * plaintext, and the nested panelMeta object (including its
 * sourceInput.module enum and sourceInput.entryId FK) survives
 * untouched.
 *
 * Modeled after notes-encryption.test.ts but uses encryptRecord /
 * decryptRecord directly — no Dexie round-trip needed to prove the
 * registry contract, and skipping fake-indexeddb keeps the test fast.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
	encryptRecord,
	decryptRecord,
	generateMasterKey,
	MemoryKeyProvider,
	setKeyProvider,
	isEncrypted,
} from '$lib/data/crypto';
import { setCurrentUserId } from '$lib/data/current-user';
import type { ComicPanelMeta, LocalComicCharacter, LocalComicStory } from './types';

const TABLE = 'comicStories';

let provider: MemoryKeyProvider;

beforeEach(async () => {
	const key = await generateMasterKey();
	provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);
	setCurrentUserId('test-user');
});

afterEach(() => {
	provider.setKey(null);
	setCurrentUserId(null);
});

function makeStory(overrides: Partial<LocalComicStory> = {}): LocalComicStory {
	return {
		id: 'story-1',
		title: 'Bug-Hunt-Frust',
		description: 'Ein 4-Panel-Comic zum Sync-Bug vom Dienstag',
		style: 'comic',
		characterMediaIds: ['me-face-123', 'wardrobe-tee-456'],
		storyContext: 'Ich ärgere mich über einen Off-by-one in der LWW-Logik.',
		panelImageIds: ['img-a', 'img-b'],
		panelMeta: {
			'img-a': {
				caption: 'Montag, 9 Uhr.',
				dialogue: 'Der Test ist grün.',
				promptUsed: 'developer sitting at desk, confident expression',
				sourceInput: { module: 'journal', entryId: 'journal-42' },
			},
			'img-b': {
				caption: 'Eine Stunde später...',
				dialogue: 'Der Test ist rot. WARUM.',
				promptUsed: 'same developer, panicked expression, dark lighting',
			},
		},
		tags: ['frust', 'devlog', '2026'],
		isFavorite: true,
		isArchived: false,
		visibility: 'private',
		...overrides,
	};
}

describe('comicStories encryption registry', () => {
	it('encrypts title, description, storyContext, tags, panelMeta; leaves structural fields plaintext', async () => {
		const row = makeStory();
		await encryptRecord(TABLE, row as unknown as Record<string, unknown>);

		// Encrypted fields are ciphertext
		expect(isEncrypted(row.title)).toBe(true);
		expect(isEncrypted(row.description)).toBe(true);
		expect(isEncrypted(row.storyContext)).toBe(true);
		// tags is a string[] — aes.ts JSON-stringifies before wrap, the
		// resulting value is still detected as encrypted via isEncrypted.
		expect(isEncrypted(row.tags)).toBe(true);
		// panelMeta is a nested object — same array-path pattern.
		expect(isEncrypted(row.panelMeta)).toBe(true);

		// Nothing user-typed slipped through
		expect(String(row.title)).not.toContain('Bug-Hunt');
		expect(String(row.description)).not.toContain('4-Panel');
		expect(String(row.storyContext)).not.toContain('Off-by-one');
		expect(JSON.stringify(row.panelMeta)).not.toContain('grün');
		expect(JSON.stringify(row.panelMeta)).not.toContain('WARUM');
		expect(JSON.stringify(row.tags)).not.toContain('devlog');

		// Structural fields untouched
		expect(row.id).toBe('story-1');
		expect(row.style).toBe('comic');
		expect(row.characterMediaIds).toEqual(['me-face-123', 'wardrobe-tee-456']);
		expect(row.panelImageIds).toEqual(['img-a', 'img-b']);
		expect(row.isFavorite).toBe(true);
		expect(row.isArchived).toBe(false);
		expect(row.visibility).toBe('private');
	});

	it('roundtrips the full panelMeta nested object', async () => {
		const row = makeStory();
		const originalMeta: Record<string, ComicPanelMeta> = JSON.parse(JSON.stringify(row.panelMeta));

		await encryptRecord(TABLE, row as unknown as Record<string, unknown>);
		await decryptRecord(TABLE, row as unknown as Record<string, unknown>);

		expect(row.title).toBe('Bug-Hunt-Frust');
		expect(row.description).toBe('Ein 4-Panel-Comic zum Sync-Bug vom Dienstag');
		expect(row.storyContext).toBe('Ich ärgere mich über einen Off-by-one in der LWW-Logik.');
		expect(row.tags).toEqual(['frust', 'devlog', '2026']);
		// Nested shape survives intact — caption / dialogue / promptUsed /
		// sourceInput (module + entryId) all present and equal.
		expect(row.panelMeta).toEqual(originalMeta);
	});

	it('handles an empty panelMeta record (freshly created story with no panels yet)', async () => {
		const row = makeStory({
			panelImageIds: [],
			panelMeta: {},
		});
		await encryptRecord(TABLE, row as unknown as Record<string, unknown>);
		// Even the empty object ships encrypted — registry doesn't skip
		// empty non-null values.
		expect(isEncrypted(row.panelMeta)).toBe(true);

		await decryptRecord(TABLE, row as unknown as Record<string, unknown>);
		expect(row.panelMeta).toEqual({});
		expect(row.panelImageIds).toEqual([]);
	});

	it('handles a panelMeta entry without sourceInput (manual panel, not AI-Storyboard)', async () => {
		const row = makeStory({
			panelMeta: {
				'img-a': {
					caption: 'Manuell geschrieben',
					promptUsed: 'character looking at sunset',
					// no dialogue, no sourceInput
				},
			},
		});
		await encryptRecord(TABLE, row as unknown as Record<string, unknown>);
		await decryptRecord(TABLE, row as unknown as Record<string, unknown>);
		expect(row.panelMeta['img-a']).toEqual({
			caption: 'Manuell geschrieben',
			promptUsed: 'character looking at sunset',
		});
	});

	it('leaves null-valued description unchanged (no crash, no wrap)', async () => {
		const row = makeStory({ description: null });
		await encryptRecord(TABLE, row as unknown as Record<string, unknown>);
		expect(row.description).toBe(null);
		await decryptRecord(TABLE, row as unknown as Record<string, unknown>);
		expect(row.description).toBe(null);
	});
});

// ─── Comic-Characters ─────────────────────────────────────────────

const CHAR_TABLE = 'comicCharacters';

function makeCharacter(overrides: Partial<LocalComicCharacter> = {}): LocalComicCharacter {
	return {
		id: 'char-1',
		name: 'Manga-Me',
		description: 'Mein Manga-Stil mit freundlichem Ausdruck',
		style: 'manga',
		addPrompt: 'Casual Outfit, freundliches Lächeln',
		sourceFaceMediaId: 'me-face-99',
		sourceBodyMediaId: 'me-body-77',
		variantMediaIds: ['variant-a', 'variant-b', 'variant-c'],
		pinnedVariantId: 'variant-b',
		tags: ['casual', 'manga', 'standard'],
		isFavorite: true,
		isArchived: false,
		...overrides,
	};
}

describe('comicCharacters encryption registry', () => {
	it('encrypts name + description + addPrompt + tags; leaves structural fields plaintext', async () => {
		const row = makeCharacter();
		await encryptRecord(CHAR_TABLE, row as unknown as Record<string, unknown>);

		expect(isEncrypted(row.name)).toBe(true);
		expect(isEncrypted(row.description)).toBe(true);
		expect(isEncrypted(row.addPrompt)).toBe(true);
		expect(isEncrypted(row.tags)).toBe(true);

		// User-typed prose nicht im Klartext durchgerutscht
		expect(String(row.name)).not.toContain('Manga-Me');
		expect(String(row.description)).not.toContain('freundlichem');
		expect(String(row.addPrompt)).not.toContain('Lächeln');
		expect(JSON.stringify(row.tags)).not.toContain('manga');

		// Strukturelle Felder unangetastet — Style-Filter, Source-FKs,
		// Variant-Liste und Pin müssen im Index lesbar bleiben.
		expect(row.id).toBe('char-1');
		expect(row.style).toBe('manga');
		expect(row.sourceFaceMediaId).toBe('me-face-99');
		expect(row.sourceBodyMediaId).toBe('me-body-77');
		expect(row.variantMediaIds).toEqual(['variant-a', 'variant-b', 'variant-c']);
		expect(row.pinnedVariantId).toBe('variant-b');
		expect(row.isFavorite).toBe(true);
		expect(row.isArchived).toBe(false);
	});

	it('roundtrips name / description / addPrompt / tags', async () => {
		const row = makeCharacter();
		await encryptRecord(CHAR_TABLE, row as unknown as Record<string, unknown>);
		await decryptRecord(CHAR_TABLE, row as unknown as Record<string, unknown>);

		expect(row.name).toBe('Manga-Me');
		expect(row.description).toBe('Mein Manga-Stil mit freundlichem Ausdruck');
		expect(row.addPrompt).toBe('Casual Outfit, freundliches Lächeln');
		expect(row.tags).toEqual(['casual', 'manga', 'standard']);
	});

	it('handles a build-in-progress character with no variants yet', async () => {
		const row = makeCharacter({
			variantMediaIds: [],
			pinnedVariantId: null,
			addPrompt: null,
			description: null,
		});
		await encryptRecord(CHAR_TABLE, row as unknown as Record<string, unknown>);
		// addPrompt and description are null — no-wrap path
		expect(row.addPrompt).toBe(null);
		expect(row.description).toBe(null);
		await decryptRecord(CHAR_TABLE, row as unknown as Record<string, unknown>);
		expect(row.variantMediaIds).toEqual([]);
		expect(row.pinnedVariantId).toBe(null);
	});
});
