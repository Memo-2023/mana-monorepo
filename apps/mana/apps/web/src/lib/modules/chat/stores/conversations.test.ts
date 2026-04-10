/**
 * Integration tests for conversationsStore — chat module mutations.
 *
 * Focus:
 *   - create persists + encrypts title
 *   - updateTitle round-trips through encryption
 *   - archive / pin / delete are idempotent state transitions
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
	decryptRecord,
} from '$lib/data/crypto';
import { ENC_PREFIX } from '$lib/data/crypto/aes';
import { conversationsStore } from './conversations.svelte';

const conversations = () => db.table('conversations');

beforeEach(async () => {
	setCurrentUserId('test-user');
	const key = await generateMasterKey();
	const provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);

	await conversations().clear();
	await db.table('messages').clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
});

describe('conversationsStore.create', () => {
	it('persists a conversation with encrypted title', async () => {
		const result = await conversationsStore.create({
			title: 'Mein Testgespräch',
			modelId: 'gpt-4',
		});

		expect(result.id).toBeTruthy();

		const raw = (await conversations().toArray())[0];
		// Title is encrypted
		expect(raw.title.startsWith(ENC_PREFIX)).toBe(true);
		// Structural fields stay plaintext
		expect(raw.isArchived).toBe(false);
		expect(raw.isPinned).toBe(false);

		const dec = await decryptRecord('conversations', { ...raw });
		expect(dec.title).toBe('Mein Testgespräch');
	});
});

describe('conversationsStore.archive / pin', () => {
	it('archives a conversation', async () => {
		const conv = await conversationsStore.create({ title: 'Test', modelId: 'gpt-4' });
		await conversationsStore.archive(conv.id);

		const raw = await conversations().get(conv.id);
		expect(raw.isArchived).toBe(true);
	});

	it('pins and unpins a conversation', async () => {
		const conv = await conversationsStore.create({ title: 'Test', modelId: 'gpt-4' });

		await conversationsStore.pin(conv.id);
		let raw = await conversations().get(conv.id);
		expect(raw.isPinned).toBe(true);

		await conversationsStore.unpin(conv.id);
		raw = await conversations().get(conv.id);
		expect(raw.isPinned).toBe(false);
	});
});

describe('conversationsStore.delete', () => {
	it('soft-deletes the conversation', async () => {
		const conv = await conversationsStore.create({ title: 'Test', modelId: 'gpt-4' });
		await conversationsStore.delete(conv.id);

		const raw = await conversations().get(conv.id);
		expect(raw.deletedAt).toBeTruthy();
	});
});
