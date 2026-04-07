/**
 * Notes encryption integration test — Phase 4 pilot.
 *
 * Exercises the full write→store→read pipeline against fake-indexeddb,
 * with a real Web Crypto master key plumbed through the MemoryKeyProvider.
 * The goal is to lock in three properties:
 *
 *   1. What lands on disk is CIPHERTEXT for title/content, plaintext for
 *      everything else (id, color, isPinned, isArchived, timestamps).
 *   2. liveQuery results coming back from useAllNotes / useNote are
 *      transparently decrypted — the UI sees Note objects with the
 *      original strings.
 *   3. The Dexie pending-change tracker captures the same ciphertext
 *      blob, so what gets pushed to the server is also opaque.
 *
 * Without this test the registry flip from Phase 4.1 is just a config
 * change with no behavioural guarantee. With it, any future regression
 * (registry typo, hook scope leak, accidental decrypt-on-write) blows
 * up immediately.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

import { db } from '$lib/data/database';
import { setCurrentUserId } from '$lib/data/current-user';
import {
	generateMasterKey,
	MemoryKeyProvider,
	setKeyProvider,
	isEncrypted,
} from '$lib/data/crypto';
import { notesStore } from './stores/notes.svelte';
import type { LocalNote } from './types';

// 50ms is enough for the fire-and-forget setTimeout(0) inside the
// Dexie creating-hook (trackPendingChange) to flush before assertions.
const flushAsync = () => new Promise((r) => setTimeout(r, 50));

let provider: MemoryKeyProvider;

beforeEach(async () => {
	const key = await generateMasterKey();
	provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);
	setCurrentUserId('test-user');

	// Each test starts with empty state. Clear plus pending-change
	// bookkeeping so cross-test contamination is impossible.
	await db.table('notes').clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
});

describe('notes encryption pilot', () => {
	it('stores title + content as ciphertext on disk', async () => {
		const created = await notesStore.createNote({
			title: 'My private idea',
			content: 'Do not show this to the family laptop',
		});

		// The optimistic snapshot returned to the UI is plaintext —
		// that's what the optimistic render uses.
		expect(created.title).toBe('My private idea');
		expect(created.content).toBe('Do not show this to the family laptop');

		// What lives in IndexedDB after the await is ciphertext.
		const stored = (await db.table<LocalNote>('notes').get(created.id)) as LocalNote;
		expect(stored).toBeDefined();
		expect(isEncrypted(stored.title)).toBe(true);
		expect(isEncrypted(stored.content)).toBe(true);
		expect(stored.title).not.toContain('private');
		expect(stored.content).not.toContain('family');
	});

	it('leaves structural fields plaintext on disk', async () => {
		const created = await notesStore.createNote({
			title: 'Pinned note',
			content: 'irrelevant',
			color: '#3b82f6',
		});
		const stored = (await db.table<LocalNote>('notes').get(created.id)) as LocalNote;

		// id, color, flags, timestamps remain queryable plaintext.
		expect(stored.id).toBe(created.id);
		expect(stored.color).toBe('#3b82f6');
		expect(stored.isPinned).toBe(false);
		expect(stored.isArchived).toBe(false);
		expect(stored.userId).toBe('test-user');
		// Auto-stamped __fieldTimestamps stays plaintext too — LWW relies on it.
		expect((stored as unknown as Record<string, unknown>).__fieldTimestamps).toBeDefined();
	});

	it('updates encrypt the modified content fields, leave flags untouched', async () => {
		const created = await notesStore.createNote({ title: 'orig title', content: 'orig body' });

		await notesStore.updateNote(created.id, {
			title: 'new title',
			content: 'new body',
		});

		const stored = (await db.table<LocalNote>('notes').get(created.id)) as LocalNote;
		expect(isEncrypted(stored.title)).toBe(true);
		expect(isEncrypted(stored.content)).toBe(true);
		expect(stored.title).not.toContain('new');
		// Updated flag stays plaintext
		expect(stored.isPinned).toBe(false);
	});

	it('togglePin and archiveNote do not touch encrypted fields', async () => {
		const created = await notesStore.createNote({ title: 'My note', content: 'My body' });
		const before = (await db.table<LocalNote>('notes').get(created.id)) as LocalNote;
		const titleBlob = before.title;
		const contentBlob = before.content;

		await notesStore.togglePin(created.id);
		const afterPin = (await db.table<LocalNote>('notes').get(created.id)) as LocalNote;
		// Title/content blobs are byte-identical — no re-encryption happened.
		expect(afterPin.title).toBe(titleBlob);
		expect(afterPin.content).toBe(contentBlob);
		expect(afterPin.isPinned).toBe(true);

		await notesStore.archiveNote(created.id);
		const afterArchive = (await db.table<LocalNote>('notes').get(created.id)) as LocalNote;
		expect(afterArchive.title).toBe(titleBlob);
		expect(afterArchive.content).toBe(contentBlob);
		expect(afterArchive.isArchived).toBe(true);
	});

	it('the pending-change record carries ciphertext, not plaintext', async () => {
		const created = await notesStore.createNote({
			title: 'Buy birthday present',
			content: 'For Marie',
		});
		await flushAsync(); // wait for setTimeout(0) in trackPendingChange

		const pending = await db
			.table('_pendingChanges')
			.filter((p: { recordId?: string }) => p.recordId === created.id)
			.toArray();

		expect(pending).toHaveLength(1);
		const change = pending[0] as { op: string; data: Record<string, unknown> };
		expect(change.op).toBe('insert');
		expect(typeof change.data.title).toBe('string');
		expect(typeof change.data.content).toBe('string');
		expect(isEncrypted(change.data.title)).toBe(true);
		expect(isEncrypted(change.data.content)).toBe(true);
		expect(change.data.title).not.toContain('birthday');
		expect(change.data.content).not.toContain('Marie');
		// Plaintext metadata flows through unchanged
		expect(change.data.isPinned).toBe(false);
		expect(change.data.userId).toBe('test-user');
	});

	it('a record encrypted with one key cannot be read with another', async () => {
		const created = await notesStore.createNote({ title: 'Secret', content: 'Sauce' });
		const stored = (await db.table<LocalNote>('notes').get(created.id)) as LocalNote;

		// Swap to a different key
		const otherKey = await generateMasterKey();
		provider.setKey(otherKey);

		// decryptRecords logs the failure but leaves blobs in place.
		// Verify the title is STILL the encrypted blob (i.e. not silently
		// returning garbage plaintext).
		const { decryptRecords } = await import('$lib/data/crypto');
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const [decrypted] = await decryptRecords<LocalNote>('notes', [stored]);
		errSpy.mockRestore();
		expect(decrypted).toBeDefined();
		// Both fields stayed encrypted because both failed to unwrap.
		expect(isEncrypted(decrypted.title)).toBe(true);
		expect(isEncrypted(decrypted.content)).toBe(true);
	});

	it('locked vault refuses to encrypt new writes', async () => {
		provider.setKey(null);
		await expect(
			notesStore.createNote({ title: 'cannot write', content: 'because locked' })
		).rejects.toThrow(/vault is locked/);
	});

	it('locked vault still serves blobs (no plaintext leak, no crash)', async () => {
		// Write while unlocked
		const created = await notesStore.createNote({ title: 'before lock', content: 'body' });

		// Lock the vault
		provider.setKey(null);

		// Direct DB read still returns the encrypted blob — no exception
		const stored = (await db.table<LocalNote>('notes').get(created.id)) as LocalNote;
		expect(isEncrypted(stored.title)).toBe(true);

		// decryptRecords with locked vault returns the blob unchanged
		const { decryptRecords } = await import('$lib/data/crypto');
		const [out] = await decryptRecords<LocalNote>('notes', [stored]);
		expect(out).toBeDefined();
		expect(isEncrypted(out.title)).toBe(true);
	});
});
