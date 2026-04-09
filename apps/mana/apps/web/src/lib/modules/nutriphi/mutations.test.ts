/**
 * Integration tests for nutriphi mutations against a real (fake) IndexedDB.
 *
 * Focus areas:
 *   - mealMutations.create persists a text-only meal AND encrypts only the
 *     description + portionSize fields (registry allowlist).
 *   - mealMutations.createFromPhoto persists a photo-mode meal with
 *     photoMediaId / photoUrl plaintext, description encrypted.
 *   - mealMutations.delete soft-deletes via deletedAt.
 *   - The decrypted read-path round-trips back to the original plaintext.
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Database hooks call into funnel-tracking + trigger registry on every write.
// They reach for browser-only globals (localStorage), so stub them the same
// way the planta tests do.
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
import { mealMutations } from './mutations';
import type { LocalMeal, NutritionData } from './types';

const meals = () => db.table<LocalMeal>('meals');

const sampleNutrition: NutritionData = {
	calories: 520,
	protein: 28,
	carbohydrates: 60,
	fat: 18,
	fiber: 6,
	sugar: 9,
};

beforeEach(async () => {
	setCurrentUserId('test-user');
	const key = await generateMasterKey();
	const provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);

	await meals().clear();
	await db.table('_pendingChanges').clear();
	await db.table('_activity').clear();
});

describe('mealMutations.create (text-mode)', () => {
	it('persists a meal row with the supplied fields', async () => {
		await mealMutations.create({
			mealType: 'lunch',
			description: 'Linseneintopf mit Brot',
			nutrition: sampleNutrition,
		});

		const all = await meals().toArray();
		expect(all).toHaveLength(1);
		expect(all[0].mealType).toBe('lunch');
		expect(all[0].inputType).toBe('text');
		expect(all[0].photoMediaId).toBeNull();
		expect(all[0].photoUrl).toBeNull();
		expect(all[0].confidence).toBe(0.8);
	});

	it('encrypts description but leaves nutrition + structural fields plaintext', async () => {
		await mealMutations.create({
			mealType: 'breakfast',
			description: 'Haferflocken mit Beeren',
			nutrition: sampleNutrition,
		});

		const raw = (await meals().toArray())[0];
		// description should be a wrapped enc: blob, NOT the original string.
		expect(typeof raw.description).toBe('string');
		expect(raw.description.startsWith(ENC_PREFIX)).toBe(true);
		expect(raw.description).not.toContain('Haferflocken');
		// Plaintext fields stay readable.
		expect(raw.mealType).toBe('breakfast');
		expect(raw.nutrition).toEqual(sampleNutrition);
		expect(raw.confidence).toBe(0.8);
	});

	it('round-trips back to plaintext via decryptRecord', async () => {
		await mealMutations.create({
			mealType: 'dinner',
			description: 'Pasta mit Tomatensoße',
			nutrition: sampleNutrition,
		});

		const raw = (await meals().toArray())[0];
		const decrypted = await decryptRecord('meals', { ...raw });
		expect(decrypted.description).toBe('Pasta mit Tomatensoße');
		expect(decrypted.nutrition).toEqual(sampleNutrition);
	});

	it('returns the plaintext snapshot, not the encrypted row', async () => {
		const result = await mealMutations.create({
			mealType: 'snack',
			description: 'Apfel',
			nutrition: null,
		});

		expect(result.description).toBe('Apfel');
		expect(result.confidence).toBe(0); // no nutrition → 0
		expect(result.nutrition).toBeNull();
	});

	it('defaults date to today when not provided', async () => {
		const today = new Date().toISOString().split('T')[0];
		await mealMutations.create({
			mealType: 'lunch',
			description: 'Salat',
		});
		const stored = (await meals().toArray())[0];
		expect(stored.date).toBe(today);
	});

	it('respects an explicit date override', async () => {
		await mealMutations.create({
			mealType: 'lunch',
			description: 'Salat',
			date: '2026-04-01',
		});
		const stored = (await meals().toArray())[0];
		expect(stored.date).toBe('2026-04-01');
	});
});

describe('mealMutations.createFromPhoto', () => {
	it('persists with inputType=photo and the supplied media pointers', async () => {
		await mealMutations.createFromPhoto({
			mealType: 'lunch',
			description: 'KI: Pizza Margherita',
			nutrition: sampleNutrition,
			photoMediaId: 'media-abc',
			photoUrl: 'https://media.example/abc.jpg',
			confidence: 0.74,
		});

		const stored = (await meals().toArray())[0];
		expect(stored.inputType).toBe('photo');
		expect(stored.photoMediaId).toBe('media-abc');
		expect(stored.photoUrl).toBe('https://media.example/abc.jpg');
		expect(stored.confidence).toBe(0.74);
	});

	it('keeps photoMediaId and photoUrl plaintext (registry allowlist)', async () => {
		await mealMutations.createFromPhoto({
			mealType: 'dinner',
			description: 'KI: Sushi',
			nutrition: sampleNutrition,
			photoMediaId: 'media-xyz',
			photoUrl: 'https://media.example/xyz.jpg',
			confidence: 0.91,
		});

		const raw = (await meals().toArray())[0];
		// description encrypted, photo metadata is not.
		expect(raw.description.startsWith(ENC_PREFIX)).toBe(true);
		expect(raw.photoMediaId).toBe('media-xyz');
		expect(raw.photoUrl).toBe('https://media.example/xyz.jpg');
		expect(typeof raw.confidence).toBe('number');
	});

	it('returns the plaintext snapshot with photo fields populated', async () => {
		const result = await mealMutations.createFromPhoto({
			mealType: 'breakfast',
			description: 'KI: Müsli mit Joghurt',
			nutrition: sampleNutrition,
			photoMediaId: 'media-1',
			photoUrl: 'https://media.example/1.jpg',
			confidence: 0.85,
		});

		expect(result.description).toBe('KI: Müsli mit Joghurt');
		expect(result.photoMediaId).toBe('media-1');
		expect(result.photoUrl).toBe('https://media.example/1.jpg');
		expect(result.inputType).toBe('photo');
	});
});

describe('mealMutations.delete', () => {
	it('soft-deletes by stamping deletedAt + updatedAt', async () => {
		const created = await mealMutations.create({
			mealType: 'lunch',
			description: 'Reis mit Gemüse',
		});

		const beforeUpdate = (await meals().get(created.id))!.updatedAt;
		// Make sure the updatedAt timestamp would actually change.
		await new Promise((r) => setTimeout(r, 5));
		await mealMutations.delete(created.id);

		const stored = await meals().get(created.id);
		expect(stored).toBeDefined();
		expect(stored?.deletedAt).toBeTruthy();
		expect(stored?.updatedAt).not.toBe(beforeUpdate);
	});

	it('does not physically remove the row (sync needs the tombstone)', async () => {
		const created = await mealMutations.create({
			mealType: 'lunch',
			description: 'Bowl',
		});
		await mealMutations.delete(created.id);

		const all = await meals().toArray();
		expect(all).toHaveLength(1);
		expect(all[0].deletedAt).toBeTruthy();
	});
});
