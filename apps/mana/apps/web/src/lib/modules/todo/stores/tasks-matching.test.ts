/**
 * Unit tests for the LLM-label-to-tag matcher used by the todo voice
 * + typed quick-add flow. The matcher is the boundary where free-text
 * topic hints from mana-llm meet the user's actual workspace tags, so
 * the rules around what counts as a hit (and what doesn't) are the
 * thing most likely to surprise users — wrong matches feel like a bug,
 * missing matches feel like the LLM is broken.
 *
 * The function is pure and takes its tag list as a parameter, so these
 * tests run in isolation with no Dexie / network mocks.
 */

import { describe, it, expect } from 'vitest';
import { matchLabelsToTagsPure, normalizeTagName } from './tasks.svelte';

describe('normalizeTagName', () => {
	it('lowercases', () => {
		expect(normalizeTagName('Steuern')).toBe('steuern');
	});

	it('strips diacritics', () => {
		expect(normalizeTagName('Stéuern')).toBe('steuern');
		expect(normalizeTagName('Übung')).toBe('ubung');
	});

	it('trims and collapses whitespace', () => {
		expect(normalizeTagName('  hello   world  ')).toBe('hello world');
	});

	it('handles empty string', () => {
		expect(normalizeTagName('')).toBe('');
	});
});

describe('matchLabelsToTagsPure', () => {
	const tags = [
		{ id: 't-steuern', name: 'Steuern' },
		{ id: 't-haushalt', name: 'Haushalt' },
		{ id: 't-arbeit', name: 'Arbeit' },
		{ id: 't-pers', name: 'Persönlich' },
	];

	it('returns empty when there are no labels', () => {
		expect(matchLabelsToTagsPure([], tags)).toEqual([]);
	});

	it('returns empty when there are no tags', () => {
		expect(matchLabelsToTagsPure(['steuern'], [])).toEqual([]);
	});

	it('matches an exact normalized hit', () => {
		expect(matchLabelsToTagsPure(['steuern'], tags)).toEqual(['t-steuern']);
	});

	it('matches case-insensitively', () => {
		expect(matchLabelsToTagsPure(['STEUERN'], tags)).toEqual(['t-steuern']);
	});

	it('matches across diacritics in either direction', () => {
		expect(matchLabelsToTagsPure(['persoenlich'], tags)).toEqual([]); // not a substring of "personlich"
		expect(matchLabelsToTagsPure(['personlich'], tags)).toEqual(['t-pers']); // strip ö → "personlich"
		expect(matchLabelsToTagsPure(['Persönlich'], tags)).toEqual(['t-pers']); // exact after normalize
	});

	it('matches via substring when both sides are ≥3 chars', () => {
		// "haushaltskasse" contains "haushalt"
		expect(matchLabelsToTagsPure(['haushaltskasse'], tags)).toEqual(['t-haushalt']);
		// "arbe" is too short to substring-match against "arbeit"
		expect(matchLabelsToTagsPure(['ar'], tags)).toEqual([]);
	});

	it('does not double-match — one label hits one tag', () => {
		const result = matchLabelsToTagsPure(['steuern', 'STEUERN', 'Steuern '], tags);
		expect(result).toEqual(['t-steuern']);
	});

	it('returns multiple ids when labels hit different tags', () => {
		const result = matchLabelsToTagsPure(['steuern', 'haushalt'], tags);
		expect(result.sort()).toEqual(['t-haushalt', 't-steuern']);
	});

	it('drops empty / whitespace-only labels', () => {
		expect(matchLabelsToTagsPure(['', '   ', 'steuern'], tags)).toEqual(['t-steuern']);
	});

	it('never invents tags — unknown topics return nothing', () => {
		expect(matchLabelsToTagsPure(['quantenphysik'], tags)).toEqual([]);
	});

	it('exact match wins over substring match', () => {
		const tagsWithBoth = [
			{ id: 't-arbeit', name: 'Arbeit' },
			{ id: 't-arbeitsweg', name: 'Arbeitsweg' },
		];
		// "arbeit" exact-matches t-arbeit; t-arbeitsweg is a substring
		// candidate but exact wins.
		expect(matchLabelsToTagsPure(['arbeit'], tagsWithBoth)).toEqual(['t-arbeit']);
	});
});
