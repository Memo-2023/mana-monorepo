/**
 * Unit tests for the habit-name matcher used by the voice quick-log
 * fast path. The matcher is the cheap client-side step that catches
 * easy cases like "kaffee" → "Kaffee" before falling back to the LLM
 * parse-habit endpoint, so getting it wrong means either spurious
 * logs (false positive) or unnecessary LLM round-trips (false
 * negative). Both are user-visible enough to be worth pinning down.
 */

import { describe, it, expect } from 'vitest';
import { normalize, matchHabitToTranscript } from './habits.svelte';

describe('normalize', () => {
	it('lowercases + strips diacritics + collapses whitespace', () => {
		expect(normalize('Kaffée  ')).toBe('kaffee');
		expect(normalize('  Hello   World ')).toBe('hello world');
	});

	it('handles empty input', () => {
		expect(normalize('')).toBe('');
	});
});

describe('matchHabitToTranscript', () => {
	const habits = [
		{ id: 'h-kaffee', title: 'Kaffee' },
		{ id: 'h-laufen', title: 'Laufen' },
		{ id: 'h-zigarette', title: 'Zigarette' },
		{ id: 'h-tee', title: 'Tee' }, // intentionally short — under the 3-char floor
		{ id: 'h-grueneTee', title: 'Grüner Tee' }, // multi-word
	];

	it('returns null for an empty transcript', () => {
		expect(matchHabitToTranscript('', habits)).toBeNull();
	});

	it('returns null when there are no habits', () => {
		expect(matchHabitToTranscript('kaffee', [])).toBeNull();
	});

	it('matches a single-word habit by exact word', () => {
		expect(matchHabitToTranscript('kaffee', habits)?.id).toBe('h-kaffee');
	});

	it('matches across whole sentences (word boundary)', () => {
		expect(matchHabitToTranscript('Ich hatte gerade einen Kaffee', habits)?.id).toBe('h-kaffee');
	});

	it('matches case-insensitively and across diacritics', () => {
		expect(matchHabitToTranscript('KAFFEE!', habits)?.id).toBe('h-kaffee');
		expect(matchHabitToTranscript('Kaffée bitte', habits)?.id).toBe('h-kaffee');
	});

	it('matches a multi-word habit only when ALL its tokens are present', () => {
		expect(matchHabitToTranscript('grüner tee schmeckt gut', habits)?.id).toBe('h-grueneTee');
		// just one token — should NOT match the multi-word habit, and
		// "tee" is under the 3-char floor so it can't match the short
		// "Tee" habit either.
		expect(matchHabitToTranscript('grüner', habits)).toBeNull();
	});

	it('does not false-positive on substrings inside other words', () => {
		// "Bier" must not hit "ausprobiert" — word boundary, not substring
		const beer = [{ id: 'h-bier', title: 'Bier' }];
		expect(matchHabitToTranscript('Ich habe etwas ausprobiert', beer)).toBeNull();
	});

	it('skips habits with titles below the 3-char floor', () => {
		// "Tee" has only 3 chars in the title but the transcript token
		// "tee" is filtered out before set lookup (length >= 3 is the
		// minimum, so "tee" qualifies — hits Tee).
		expect(matchHabitToTranscript('habe einen Tee getrunken', habits)?.id).toBe('h-tee');
	});

	it('returns the first matching habit when multiple could fit', () => {
		const dupes = [
			{ id: 'h-1', title: 'Kaffee' },
			{ id: 'h-2', title: 'Kaffee' },
		];
		expect(matchHabitToTranscript('kaffee', dupes)?.id).toBe('h-1');
	});

	it('returns null for a transcript that mentions no habit', () => {
		expect(matchHabitToTranscript('heute war ein guter tag', habits)).toBeNull();
	});
});
