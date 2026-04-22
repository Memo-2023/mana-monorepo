/**
 * Parser tests for the Gemini Deep Research `/v1beta/interactions/:id`
 * response. Shape was derived from a real smoke-test on 2026-04-22 —
 * see docs/reports/gemini-deep-research.md §1.3.
 *
 * We test the pure `parseInteractionResponse` helper, not the full
 * poll function, so there's no fetch mocking and the fixtures can
 * exercise edge cases the live API might not hand back on demand
 * (empty output items, duplicate citations, wrong annotation types).
 */

import { describe, expect, it } from 'bun:test';
import { parseInteractionResponse } from './gemini-deep-research';

// Typed as `any` because we want to feed the parser shapes that
// deliberately don't match the happy-path TS interface (e.g. missing
// fields, wrong annotation types) to verify defensive handling.
type Fixture = Parameters<typeof parseInteractionResponse>[0];

describe('parseInteractionResponse — status dispatch', () => {
	it('maps queued → queued', () => {
		const r = parseInteractionResponse({ status: 'queued' } as Fixture);
		expect(r).toEqual({ status: 'queued' });
	});

	it('maps in_progress → running', () => {
		const r = parseInteractionResponse({ status: 'in_progress' } as Fixture);
		expect(r).toEqual({ status: 'running' });
	});

	it('maps failed → failed with error message', () => {
		const r = parseInteractionResponse({
			status: 'failed',
			error: { message: 'model timeout' },
		} as Fixture);
		expect(r).toEqual({ status: 'failed', error: 'model timeout' });
	});

	it('maps cancelled → failed (uses status string as fallback error)', () => {
		const r = parseInteractionResponse({ status: 'cancelled' } as Fixture);
		expect(r).toEqual({ status: 'failed', error: 'cancelled' });
	});

	it('maps incomplete → failed', () => {
		const r = parseInteractionResponse({ status: 'incomplete' } as Fixture);
		expect(r.status).toBe('failed');
	});
});

describe('parseInteractionResponse — completed response', () => {
	const completed: Fixture = {
		id: 'test_interaction_123',
		status: 'completed',
		outputs: [
			// thought item — should be ignored entirely
			{
				type: 'thought',
				text: undefined, // thought uses `summary`, not `text` — irrelevant, we skip anyway
			} as never,
			// empty item Google occasionally emits — must not crash the loop
			{} as never,
			// primary text item with url_citations (including a duplicate and a non-url_citation)
			{
				type: 'text',
				text: '# Main Report\n\nThis is the body with [cite: 1, 2].',
				annotations: [
					{ type: 'url_citation', url: 'https://example.com/a', start_index: 0, end_index: 10 },
					{ type: 'url_citation', url: 'https://example.com/b', start_index: 15, end_index: 25 },
					// duplicate of /a — must be deduped
					{ type: 'url_citation', url: 'https://example.com/a', start_index: 30, end_index: 40 },
					// wrong type — must be skipped
					{ type: 'other_citation', url: 'https://should-not-capture.com' },
					// missing url — must be skipped
					{ type: 'url_citation' },
				],
			},
			// image — skipped (lives in providerRaw)
			{ type: 'image', mime_type: 'image/png', data: 'aGVsbG8=' } as never,
			// second text block without annotations — must be concatenated
			{ type: 'text', text: '\n\n**Sources above.**' },
		],
		usage: {
			total_tokens: 1000,
			total_input_tokens: 700,
			total_output_tokens: 300,
			total_cached_tokens: 100,
		},
	} as Fixture;

	const result = parseInteractionResponse(completed);

	it('returns completed status with an answer body', () => {
		expect(result.status).toBe('completed');
		expect(result.answer).toBeDefined();
	});

	it('concatenates all text items, skipping thoughts/images/empty', () => {
		expect(result.answer?.answer).toBe(
			'# Main Report\n\nThis is the body with [cite: 1, 2].\n\n**Sources above.**'
		);
	});

	it('leaves `query` empty — caller fills it in', () => {
		expect(result.answer?.query).toBe('');
	});

	it('extracts url_citations deduped by url, using hostname as title', () => {
		expect(result.answer?.citations).toEqual([
			{ url: 'https://example.com/a', title: 'example.com' },
			{ url: 'https://example.com/b', title: 'example.com' },
		]);
	});

	it('maps usage.total_input_tokens / total_output_tokens to tokenUsage', () => {
		expect(result.answer?.tokenUsage).toEqual({ input: 700, output: 300 });
	});

	it('preserves the raw response for downstream consumers', () => {
		expect(result.answer?.providerRaw).toBe(completed);
	});
});

describe('parseInteractionResponse — completed edge cases', () => {
	it('handles completely empty outputs', () => {
		const r = parseInteractionResponse({ status: 'completed', outputs: [] } as Fixture);
		expect(r.status).toBe('completed');
		expect(r.answer?.answer).toBe('');
		expect(r.answer?.citations).toEqual([]);
	});

	it('handles missing outputs field entirely', () => {
		const r = parseInteractionResponse({ status: 'completed' } as Fixture);
		expect(r.status).toBe('completed');
		expect(r.answer?.answer).toBe('');
	});

	it('handles missing usage', () => {
		const r = parseInteractionResponse({
			status: 'completed',
			outputs: [{ type: 'text', text: 'hi' }],
		} as Fixture);
		expect(r.answer?.tokenUsage).toBeUndefined();
	});

	it('trims leading/trailing whitespace on the concatenated answer', () => {
		const r = parseInteractionResponse({
			status: 'completed',
			outputs: [
				{ type: 'text', text: '   \n\n' },
				{ type: 'text', text: 'Report body' },
				{ type: 'text', text: '\n\n   ' },
			],
		} as Fixture);
		expect(r.answer?.answer).toBe('Report body');
	});

	it('falls back to url as title when hostname parse fails', () => {
		const r = parseInteractionResponse({
			status: 'completed',
			outputs: [
				{
					type: 'text',
					text: 'x',
					annotations: [{ type: 'url_citation', url: 'not a valid url' }],
				},
			],
		} as Fixture);
		expect(r.answer?.citations[0]).toEqual({
			url: 'not a valid url',
			title: 'not a valid url',
		});
	});

	it('handles the real vertexaisearch redirect URLs Gemini emits', () => {
		const r = parseInteractionResponse({
			status: 'completed',
			outputs: [
				{
					type: 'text',
					text: 'Hono is ...',
					annotations: [
						{
							type: 'url_citation',
							url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF...',
							start_index: 268,
							end_index: 283,
						},
					],
				},
			],
		} as Fixture);
		expect(r.answer?.citations[0]?.title).toBe('vertexaisearch.cloud.google.com');
	});
});
