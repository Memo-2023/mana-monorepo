/**
 * ByokVault tests — encrypted key CRUD in IndexedDB.
 *
 * Uses fake-indexeddb and a real AES-GCM key from SubtleCrypto.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

// Placeholder key, replaced in beforeAll
let testKey: CryptoKey | null = null;

vi.mock('$lib/data/crypto/key-provider', () => ({
	getActiveKey: () => testKey,
	isVaultUnlocked: () => testKey !== null,
}));

import { db } from '$lib/data/database';
import { byokVault } from './vault';

beforeAll(async () => {
	testKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
		'encrypt',
		'decrypt',
	]);
});

beforeEach(async () => {
	await db.table('_byokKeys').clear();
});

describe('ByokVault CRUD', () => {
	it('creates a key encrypted at rest', async () => {
		const key = await byokVault.create({
			provider: 'openai',
			label: 'Test Key',
			apiKey: 'sk-verysecret123',
		});

		expect(key.id).toBeTruthy();
		expect(key.apiKey).toBe('sk-verysecret123');

		const raw = await db.table('_byokKeys').get(key.id);
		expect(raw.apiKeyEncrypted).not.toBe('sk-verysecret123');
		expect(JSON.stringify(raw.apiKeyEncrypted)).not.toContain('sk-verysecret123');
	});

	it('decrypts correctly on read', async () => {
		await byokVault.create({
			provider: 'openai',
			label: 'Test',
			apiKey: 'sk-abc123',
		});

		const all = await byokVault.listAll();
		expect(all).toHaveLength(1);
		expect(all[0].apiKey).toBe('sk-abc123');
	});

	it('first key for a provider becomes default automatically', async () => {
		const k1 = await byokVault.create({
			provider: 'openai',
			label: 'First',
			apiKey: 'sk-1',
		});
		expect(k1.isDefault).toBe(true);
	});

	it('promoting a key to default demotes the previous default', async () => {
		const k1 = await byokVault.create({
			provider: 'openai',
			label: 'First',
			apiKey: 'sk-1',
		});
		const k2 = await byokVault.create({
			provider: 'openai',
			label: 'Second',
			apiKey: 'sk-2',
			isDefault: false,
		});
		expect(k1.isDefault).toBe(true);

		await byokVault.update(k2.id, { isDefault: true });

		const meta = await byokVault.listMeta();
		const first = meta.find((k) => k.id === k1.id)!;
		const second = meta.find((k) => k.id === k2.id)!;
		expect(first.isDefault).toBe(false);
		expect(second.isDefault).toBe(true);
	});

	it('getForProvider returns default if set', async () => {
		await byokVault.create({ provider: 'anthropic', label: 'A', apiKey: 'k1' });
		await byokVault.create({
			provider: 'anthropic',
			label: 'B',
			apiKey: 'k2',
			isDefault: false,
		});

		const found = await byokVault.getForProvider('anthropic');
		expect(found?.label).toBe('A');
		expect(found?.apiKey).toBe('k1');
	});

	it('getForProvider returns null when no keys for provider', async () => {
		await byokVault.create({ provider: 'openai', label: 'A', apiKey: 'k' });
		const found = await byokVault.getForProvider('anthropic');
		expect(found).toBeNull();
	});

	it('listMeta does NOT decrypt the api key', async () => {
		await byokVault.create({ provider: 'openai', label: 'Test', apiKey: 'sk-secret' });
		const meta = await byokVault.listMeta();
		expect(meta[0]).not.toHaveProperty('apiKey');
	});

	it('delete is soft', async () => {
		const k = await byokVault.create({
			provider: 'openai',
			label: 'Test',
			apiKey: 'sk',
		});
		await byokVault.delete(k.id);

		const meta = await byokVault.listMeta();
		expect(meta).toHaveLength(0);

		const raw = await db.table('_byokKeys').get(k.id);
		expect(raw).toBeDefined();
		expect(raw.deletedAt).toBeTruthy();
	});

	it('update changes label and model', async () => {
		const k = await byokVault.create({
			provider: 'openai',
			label: 'Old',
			apiKey: 'sk',
			model: 'gpt-4o',
		});
		await byokVault.update(k.id, { label: 'New', model: 'gpt-5' });

		const meta = await byokVault.listMeta();
		expect(meta[0].label).toBe('New');
		expect(meta[0].model).toBe('gpt-5');
	});

	it('recordUsage increments counters', async () => {
		const k = await byokVault.create({
			provider: 'openai',
			label: 'Test',
			apiKey: 'sk',
		});

		await byokVault.recordUsage(k.id, 100, 0.015);
		await byokVault.recordUsage(k.id, 50, 0.008);

		const meta = await byokVault.listMeta();
		expect(meta[0].usageCount).toBe(2);
		expect(meta[0].totalTokens).toBe(150);
		expect(meta[0].totalCostUsd).toBeCloseTo(0.023, 6);
		expect(meta[0].lastUsedAt).toBeTruthy();
	});

	it('handles multiple providers independently', async () => {
		await byokVault.create({ provider: 'openai', label: 'OpenAI', apiKey: 'sk-oai' });
		await byokVault.create({
			provider: 'anthropic',
			label: 'Anthropic',
			apiKey: 'sk-ant',
		});
		await byokVault.create({ provider: 'gemini', label: 'Gemini', apiKey: 'g-key' });

		const openai = await byokVault.getForProvider('openai');
		const anthropic = await byokVault.getForProvider('anthropic');
		const gemini = await byokVault.getForProvider('gemini');
		const mistral = await byokVault.getForProvider('mistral');

		expect(openai?.apiKey).toBe('sk-oai');
		expect(anthropic?.apiKey).toBe('sk-ant');
		expect(gemini?.apiKey).toBe('g-key');
		expect(mistral).toBeNull();
	});
});
