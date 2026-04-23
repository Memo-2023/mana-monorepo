import { describe, expect, it } from 'vitest';
import {
	COMPACT_SYSTEM_PROMPT,
	DEFAULT_COMPACT_KEEP_RECENT,
	DEFAULT_COMPACT_MODEL,
	DEFAULT_COMPACT_THRESHOLD,
	compactHistory,
	parseCompactSummary,
	renderCompactSummary,
	shouldCompact,
} from './compact';
import { MockLlmClient } from './mock-llm';
import type { ChatMessage } from './loop';

// ─── shouldCompact ─────────────────────────────────────────────────

describe('shouldCompact', () => {
	it('returns true at the 92% threshold', () => {
		expect(shouldCompact(92_000, 100_000)).toBe(true);
	});
	it('returns false below the threshold', () => {
		expect(shouldCompact(91_000, 100_000)).toBe(false);
	});
	it('returns false when maxContextTokens is missing', () => {
		expect(shouldCompact(50_000, undefined)).toBe(false);
		expect(shouldCompact(50_000, 0)).toBe(false);
	});
	it('returns false on zero usage', () => {
		expect(shouldCompact(0, 100_000)).toBe(false);
	});
	it('respects a custom threshold', () => {
		expect(shouldCompact(50_000, 100_000, 0.5)).toBe(true);
		expect(shouldCompact(49_999, 100_000, 0.5)).toBe(false);
	});
	it('constant matches Claude Code (0.92)', () => {
		expect(DEFAULT_COMPACT_THRESHOLD).toBe(0.92);
	});
});

// ─── parseCompactSummary ───────────────────────────────────────────

describe('parseCompactSummary', () => {
	it('parses the canonical 4-section block', () => {
		const raw = `## Goal
Alle offenen Tasks bis Freitag abschliessen.

## Decisions
- Prio: Release-Blocker zuerst
- Keine neuen Features

## Tools Called
- list_tasks(open) -> 12 Tasks
- complete_task(T-42) -> ok

## Current Progress
8 von 12 Tasks erledigt; naechste Aktion: T-19 in Angriff nehmen.`;
		const s = parseCompactSummary(raw);
		expect(s.goal).toContain('Alle offenen Tasks');
		expect(s.decisions).toContain('Prio: Release-Blocker');
		expect(s.toolsCalled).toContain('list_tasks');
		expect(s.currentProgress).toContain('8 von 12');
	});

	it('tolerates missing sections', () => {
		const raw = `## Goal\nFoo bar.\n\n## Decisions\n(keine)`;
		const s = parseCompactSummary(raw);
		expect(s.goal).toBe('Foo bar.');
		expect(s.decisions).toBe('(keine)');
		expect(s.toolsCalled).toBe('');
		expect(s.currentProgress).toBe('');
	});

	it('is case-insensitive on headers', () => {
		const s = parseCompactSummary(`## GOAL\nX\n\n## decisions\nY`);
		expect(s.goal).toBe('X');
		expect(s.decisions).toBe('Y');
	});

	it('returns empty summary for unparseable input', () => {
		const s = parseCompactSummary('this is not a markdown block');
		expect(s).toEqual({ goal: '', decisions: '', toolsCalled: '', currentProgress: '' });
	});
});

// ─── renderCompactSummary ──────────────────────────────────────────

describe('renderCompactSummary', () => {
	it('wraps the summary in <compact-summary> tags', () => {
		const out = renderCompactSummary({
			goal: 'G',
			decisions: 'D',
			toolsCalled: 'T',
			currentProgress: 'P',
		});
		expect(out.startsWith('<compact-summary>')).toBe(true);
		expect(out.endsWith('</compact-summary>')).toBe(true);
		expect(out).toContain('## Goal\nG');
		expect(out).toContain('## Decisions\nD');
	});

	it('fills empty sections with placeholders', () => {
		const out = renderCompactSummary({
			goal: '',
			decisions: '',
			toolsCalled: '',
			currentProgress: '',
		});
		expect(out).toContain('unklar');
		expect(out).toContain('(keine)');
	});
});

// ─── compactHistory ────────────────────────────────────────────────

function buildHistory(middleLen: number, keepRecent: number): ChatMessage[] {
	const msgs: ChatMessage[] = [
		{ role: 'system', content: 'Original system prompt' },
		{ role: 'user', content: 'Original user task' },
	];
	for (let i = 0; i < middleLen; i++) {
		msgs.push({ role: 'assistant', content: `middle-assistant-${i}` });
		msgs.push({ role: 'tool', toolCallId: `c${i}`, content: `middle-tool-${i}` });
	}
	for (let i = 0; i < keepRecent; i++) {
		msgs.push({ role: 'assistant', content: `recent-${i}` });
	}
	return msgs;
}

describe('compactHistory', () => {
	it('returns history unchanged when there is nothing to compact', async () => {
		const llm = new MockLlmClient(); // no responses needed
		const msgs: ChatMessage[] = [
			{ role: 'system', content: 's' },
			{ role: 'user', content: 'u' },
			{ role: 'assistant', content: 'only-turn' },
		];
		const res = await compactHistory(msgs, { llm, model: 'm', keepRecent: 4 });
		expect(res.messages).toBe(msgs); // same reference — bailed fast
		expect(res.compactedTurns).toBe(0);
	});

	it('preserves system + first user + tail; replaces middle with compact-summary', async () => {
		const history = buildHistory(5, DEFAULT_COMPACT_KEEP_RECENT); // 2 + 10 + 4 = 16 msgs
		const llm = new MockLlmClient().enqueueStop(
			'## Goal\nX\n\n## Decisions\n-\n\n## Tools Called\n-\n\n## Current Progress\nhalfway'
		);

		const res = await compactHistory(history, { llm, model: 'compact-model' });

		expect(res.compactedTurns).toBe(10); // the 5 assistant+tool pairs
		expect(res.messages).toHaveLength(2 + 1 + DEFAULT_COMPACT_KEEP_RECENT); // system + user + summary + tail

		// Shape check
		expect(res.messages[0]).toEqual(history[0]); // system verbatim
		expect(res.messages[1]).toEqual(history[1]); // first user verbatim
		expect(res.messages[2].role).toBe('assistant');
		expect(res.messages[2].content).toContain('<compact-summary>');
		expect(res.messages[2].content).toContain('halfway');
		// Tail preserved in order
		for (let i = 0; i < DEFAULT_COMPACT_KEEP_RECENT; i++) {
			expect(res.messages[3 + i].content).toBe(`recent-${i}`);
		}
	});

	it('sends the compact system prompt to the LLM', async () => {
		const history = buildHistory(3, 4);
		const llm = new MockLlmClient().enqueueStop(
			'## Goal\n\n## Decisions\n\n## Tools Called\n\n## Current Progress\n'
		);
		await compactHistory(history, { llm, model: 'm' });

		const seenByLlm = llm.calls[0].messages;
		expect(seenByLlm[0].role).toBe('system');
		expect(seenByLlm[0].content).toBe(COMPACT_SYSTEM_PROMPT);
	});

	it('returns summary + usage when the provider reports it', async () => {
		const history = buildHistory(3, 4);
		const llm = new MockLlmClient();
		// Direct queue manipulation to inject usage
		(llm as unknown as { queue: unknown[] }).queue.push({
			content: '## Goal\nX\n\n## Decisions\n-\n\n## Tools Called\n-\n\n## Current Progress\nY',
			toolCalls: [],
			finishReason: 'stop',
			usage: { promptTokens: 100, completionTokens: 30, totalTokens: 130 },
		});

		const res = await compactHistory(history, { llm, model: 'm' });
		expect(res.summary.goal).toBe('X');
		expect(res.summary.currentProgress).toBe('Y');
		expect(res.usage).toEqual({ promptTokens: 100, completionTokens: 30 });
	});

	it('defaults to DEFAULT_COMPACT_MODEL when model is omitted (fast-tier routing)', async () => {
		const history = buildHistory(3, 4);
		const seenModels: string[] = [];
		const capturingLlm = {
			async complete(req: { model: string }) {
				seenModels.push(req.model);
				return {
					content: '## Goal\n\n## Decisions\n\n## Tools Called\n\n## Current Progress\n',
					toolCalls: [],
					finishReason: 'stop' as const,
				};
			},
		};

		await compactHistory(history, { llm: capturingLlm }); // no explicit model

		expect(seenModels).toHaveLength(1);
		expect(seenModels[0]).toBe(DEFAULT_COMPACT_MODEL);
		expect(DEFAULT_COMPACT_MODEL).toBe('google/gemini-2.5-flash-lite');
	});

	it('honours an explicit model override', async () => {
		const history = buildHistory(3, 4);
		const seenModels: string[] = [];
		const capturingLlm = {
			async complete(req: { model: string }) {
				seenModels.push(req.model);
				return {
					content: '## Goal\n\n## Decisions\n\n## Tools Called\n\n## Current Progress\n',
					toolCalls: [],
					finishReason: 'stop' as const,
				};
			},
		};

		await compactHistory(history, { llm: capturingLlm, model: 'custom/override-model' });

		expect(seenModels[0]).toBe('custom/override-model');
	});

	it('respects a custom keepRecent value', async () => {
		const history = buildHistory(5, 6);
		const llm = new MockLlmClient().enqueueStop('## Goal\n\n## Decisions\n');

		const res = await compactHistory(history, { llm, model: 'm', keepRecent: 2 });
		// keepRecent=2 is smaller than the 6 we built — more aggressive compaction
		expect(res.messages).toHaveLength(2 + 1 + 2); // system + user + summary + 2 tail
		expect(res.messages[3].content).toBe('recent-4');
		expect(res.messages[4].content).toBe('recent-5');
	});
});
