/**
 * Unit tests for the deterministic post-processing in parse-task's
 * coerce() helper. The hallucination guards exist because gemma3:4b
 * (and even 12b under some prompts) consistently emits dueDate /
 * priority values for tasks that don't actually mention a date or
 * urgency word — bare quick-add lines like "Mülltonnen rausstellen"
 * would otherwise come back with today's date and "low" priority.
 *
 * The integration tests against the live LLM cover the happy path
 * end-to-end. These tests cover the guard logic in isolation, with
 * synthetic LLM responses, so a regression in the coerce rules is
 * caught even when the LLM is offline.
 */

import { describe, it, expect } from 'vitest';
import {
	coerce,
	transcriptMentions,
	DATE_TRIGGER_PATTERNS,
	PRIORITY_TRIGGER_PATTERNS,
} from './coerce';

describe('transcriptMentions', () => {
	it('returns true on an exact substring hit', () => {
		expect(transcriptMentions('Anna nächsten Montag anrufen', ['montag'])).toBe(true);
	});

	it('matches case-insensitively', () => {
		expect(transcriptMentions('MORGEN um 14 Uhr', ['morgen'])).toBe(true);
	});

	it('returns false when no pattern hits', () => {
		expect(transcriptMentions('Mülltonnen rausstellen', ['heut', 'morgen', 'tomorrow'])).toBe(
			false
		);
	});

	it('returns false on empty pattern list', () => {
		expect(transcriptMentions('something', [])).toBe(false);
	});
});

describe('DATE_TRIGGER_PATTERNS sanity', () => {
	it('catches the German date words used in the few-shot examples', () => {
		expect(transcriptMentions('Steuererklärung morgen 14 Uhr', DATE_TRIGGER_PATTERNS)).toBe(true);
		expect(transcriptMentions('Anna nächsten Montag anrufen', DATE_TRIGGER_PATTERNS)).toBe(true);
		expect(transcriptMentions('Mama am Wochenende besuchen', DATE_TRIGGER_PATTERNS)).toBe(true);
	});

	it('catches the English date words used in the few-shot examples', () => {
		expect(transcriptMentions('Call dentist tomorrow at 3pm', DATE_TRIGGER_PATTERNS)).toBe(true);
	});

	it('does NOT trigger on the bare-task example', () => {
		expect(transcriptMentions('Mülltonnen rausstellen', DATE_TRIGGER_PATTERNS)).toBe(false);
		expect(transcriptMentions('Buy milk', DATE_TRIGGER_PATTERNS)).toBe(false);
	});
});

describe('PRIORITY_TRIGGER_PATTERNS sanity', () => {
	it('catches the German urgency words used in the examples', () => {
		expect(
			transcriptMentions('Steuererklärung morgen unbedingt erledigen', PRIORITY_TRIGGER_PATTERNS)
		).toBe(true);
	});

	it('does NOT trigger on neutral transcripts', () => {
		expect(transcriptMentions('Mülltonnen rausstellen', PRIORITY_TRIGGER_PATTERNS)).toBe(false);
		expect(transcriptMentions('Anna nächsten Montag anrufen', PRIORITY_TRIGGER_PATTERNS)).toBe(
			false
		);
	});
});

describe('coerce', () => {
	const fallbackResult = {
		title: 'Sprachaufgabe',
		dueDate: null,
		priority: null,
		labels: [],
	};

	it('falls back when raw is not an object', () => {
		expect(coerce(null, '')).toEqual(fallbackResult);
		expect(coerce('not json', '')).toEqual(fallbackResult);
		expect(coerce(42, '')).toEqual(fallbackResult);
	});

	it('uses the transcript as title when the model omits one', () => {
		expect(coerce({}, 'Mülltonnen rausstellen').title).toBe('Mülltonnen rausstellen');
	});

	it('passes through a clean structured response untouched', () => {
		const result = coerce(
			{
				title: 'Steuererklärung erledigen',
				dueDate: '2026-04-09',
				priority: 'high',
				labels: ['steuern'],
			},
			'Steuererklärung morgen 14 Uhr unbedingt erledigen'
		);
		expect(result).toEqual({
			title: 'Steuererklärung erledigen',
			dueDate: '2026-04-09',
			priority: 'high',
			labels: ['steuern'],
		});
	});

	it('strips a time component from dueDate', () => {
		const result = coerce(
			{ title: 'X', dueDate: '2026-04-09T14:00:00', priority: null, labels: [] },
			'X morgen 14 Uhr'
		);
		expect(result.dueDate).toBe('2026-04-09');
	});

	it('rejects a malformed dueDate string', () => {
		const result = coerce(
			{ title: 'X', dueDate: 'tomorrow', priority: null, labels: [] },
			'X morgen'
		);
		expect(result.dueDate).toBeNull();
	});

	it('drops a hallucinated dueDate when transcript has no date words', () => {
		// gemma3:4b's classic failure: stamps today on a bare task
		const result = coerce(
			{ title: 'Mülltonnen rausstellen', dueDate: '2026-04-08', priority: null, labels: ['müll'] },
			'Mülltonnen rausstellen'
		);
		expect(result.dueDate).toBeNull();
	});

	it('keeps a real dueDate when transcript actually mentions a date', () => {
		const result = coerce(
			{
				title: 'Steuererklärung erledigen',
				dueDate: '2026-04-09',
				priority: null,
				labels: [],
			},
			'Steuererklärung morgen erledigen'
		);
		expect(result.dueDate).toBe('2026-04-09');
	});

	it('drops a hallucinated priority when transcript has no urgency words', () => {
		const result = coerce(
			{ title: 'Steuererklärung', dueDate: null, priority: 'high', labels: [] },
			'Steuererklärung machen'
		);
		expect(result.priority).toBeNull();
	});

	it('keeps a real priority when transcript actually mentions urgency', () => {
		const result = coerce(
			{ title: 'X', dueDate: null, priority: 'high', labels: [] },
			'X unbedingt erledigen'
		);
		expect(result.priority).toBe('high');
	});

	it('rejects an invalid priority value', () => {
		const result = coerce(
			{ title: 'X', dueDate: null, priority: 'critical', labels: [] },
			'X unbedingt'
		);
		expect(result.priority).toBeNull();
	});

	it('caps labels at 3 entries', () => {
		const result = coerce(
			{ title: 'X', dueDate: null, priority: null, labels: ['a', 'b', 'c', 'd', 'e'] },
			'X'
		);
		expect(result.labels).toEqual(['a', 'b', 'c']);
	});

	it('drops non-string label entries', () => {
		const result = coerce(
			{ title: 'X', dueDate: null, priority: null, labels: ['a', 42, null, 'b'] },
			'X'
		);
		expect(result.labels).toEqual(['a', 'b']);
	});

	it('returns empty labels array when raw.labels is not an array', () => {
		const result = coerce({ title: 'X', dueDate: null, priority: null, labels: 'nope' }, 'X');
		expect(result.labels).toEqual([]);
	});
});
