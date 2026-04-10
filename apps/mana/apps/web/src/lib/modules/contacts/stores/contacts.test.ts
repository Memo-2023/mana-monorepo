/**
 * Integration tests for contactsStore against a real (fake) IndexedDB.
 *
 * Same harness as body/nutriphi tests: fake-indexeddb + MemoryKeyProvider.
 *
 * Focus:
 *   - create persists + encrypts PII (name, email, phone)
 *   - update round-trips through encryption
 *   - delete is soft-delete via deletedAt
 *   - toggleFavorite flips the boolean
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
import { contactsStore } from './contacts.svelte';

const contacts = () => db.table('contacts');

beforeEach(async () => {
	setCurrentUserId('test-user');
	const key = await generateMasterKey();
	const provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);

	await contacts().clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
});

describe('contactsStore.createContact', () => {
	it('persists a contact with encrypted PII fields', async () => {
		await contactsStore.createContact({
			firstName: 'Max',
			lastName: 'Mustermann',
			email: 'max@example.com',
			phone: '+49 170 1234567',
		});

		const all = await contacts().toArray();
		expect(all).toHaveLength(1);

		const raw = all[0];
		// PII fields should be encrypted
		expect(raw.firstName.startsWith(ENC_PREFIX)).toBe(true);
		expect(raw.lastName.startsWith(ENC_PREFIX)).toBe(true);
		expect(raw.email.startsWith(ENC_PREFIX)).toBe(true);
		expect(raw.phone.startsWith(ENC_PREFIX)).toBe(true);

		// Structural fields stay plaintext
		expect(raw.isFavorite).toBe(false);
		expect(raw.isArchived).toBe(false);

		// Decrypt round-trip
		const dec = await decryptRecord('contacts', { ...raw });
		expect(dec.firstName).toBe('Max');
		expect(dec.lastName).toBe('Mustermann');
		expect(dec.email).toBe('max@example.com');
	});
});

describe('contactsStore.deleteContact', () => {
	it('soft-deletes via deletedAt', async () => {
		await contactsStore.createContact({ firstName: 'Temp', lastName: 'User' });
		const all = await contacts().toArray();
		const id = all[0].id;

		await contactsStore.deleteContact(id);

		const after = await contacts().get(id);
		expect(after.deletedAt).toBeTruthy();
	});
});

describe('contactsStore.toggleFavorite', () => {
	it('flips isFavorite from false to true', async () => {
		await contactsStore.createContact({ firstName: 'Star', lastName: 'User' });
		const all = await contacts().toArray();
		const id = all[0].id;
		expect(all[0].isFavorite).toBe(false);

		await contactsStore.toggleFavorite(id);

		const after = await contacts().get(id);
		expect(after.isFavorite).toBe(true);
	});
});
