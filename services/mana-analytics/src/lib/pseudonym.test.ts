import { describe, expect, it } from 'bun:test';
import { createDisplayHash, generateDisplayName, __TEST__ } from './pseudonym';

describe('pseudonym', () => {
	it('createDisplayHash is deterministic per (userId, secret)', () => {
		const a = createDisplayHash('user-123', 'secret');
		const b = createDisplayHash('user-123', 'secret');
		expect(a).toBe(b);
	});

	it('createDisplayHash varies per userId', () => {
		const a = createDisplayHash('user-1', 'secret');
		const b = createDisplayHash('user-2', 'secret');
		expect(a).not.toBe(b);
	});

	it('createDisplayHash varies per secret (rotation safety)', () => {
		const a = createDisplayHash('user-1', 'secret-old');
		const b = createDisplayHash('user-1', 'secret-new');
		expect(a).not.toBe(b);
	});

	it('generateDisplayName is deterministic per hash', () => {
		const hash = createDisplayHash('user-123', 'secret');
		expect(generateDisplayName(hash)).toBe(generateDisplayName(hash));
	});

	it('generateDisplayName format is "{Adj} {Tier} #{4-digit}"', () => {
		const hash = createDisplayHash('user-1', 'secret');
		const name = generateDisplayName(hash);
		expect(name).toMatch(/^[A-ZÄÖÜ][a-zäöüß]+ [A-ZÄÖÜ][a-zäöüß]+ #\d{4}$/);
	});

	it('uses adjectives + animals from the curated lists', () => {
		const hash = createDisplayHash('user-1', 'secret');
		const [adj, animal] = generateDisplayName(hash).split(' ');
		expect(__TEST__.ADJECTIVES).toContain(adj);
		expect(__TEST__.ANIMALS).toContain(animal);
	});

	it('produces varied names across many users (no obvious clustering)', () => {
		const names = new Set<string>();
		for (let i = 0; i < 1000; i++) {
			names.add(generateDisplayName(createDisplayHash(`user-${i}`, 'secret')));
		}
		// 1000 users → expect ~1000 unique pseudonyms (collisions allowed but rare).
		expect(names.size).toBeGreaterThan(950);
	});
});
