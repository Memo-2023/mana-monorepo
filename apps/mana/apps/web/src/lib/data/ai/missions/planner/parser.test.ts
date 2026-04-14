import { describe, it, expect } from 'vitest';
import { parsePlannerResponse } from './parser';

const TOOLS = new Set(['create_task', 'log_drink']);

describe('parsePlannerResponse', () => {
	it('parses a valid fenced json block', () => {
		const text = `\`\`\`json
{
  "summary": "Plan für heute",
  "steps": [
    { "summary": "Task anlegen", "toolName": "create_task", "params": { "title": "Foo" }, "rationale": "weil wichtig" }
  ]
}
\`\`\``;
		const r = parsePlannerResponse(text, TOOLS);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.summary).toBe('Plan für heute');
		expect(r.value.steps).toHaveLength(1);
		expect(r.value.steps[0].toolName).toBe('create_task');
		expect(r.value.steps[0].params).toEqual({ title: 'Foo' });
	});

	it('accepts a bare JSON object without fence', () => {
		const text = `{ "summary": "x", "steps": [
			{ "summary": "log", "toolName": "log_drink", "params": {}, "rationale": "Routine" }
		]}`;
		const r = parsePlannerResponse(text, TOOLS);
		expect(r.ok).toBe(true);
	});

	it('rejects when no JSON block found', () => {
		const r = parsePlannerResponse('just prose no JSON here', TOOLS);
		expect(r.ok).toBe(false);
	});

	it('rejects invalid JSON inside the fence', () => {
		const r = parsePlannerResponse('```json\n{not: valid}\n```', TOOLS);
		expect(r.ok).toBe(false);
	});

	it('rejects when steps is missing or not an array', () => {
		const r = parsePlannerResponse('```json\n{"summary":"x"}\n```', TOOLS);
		expect(r.ok).toBe(false);
	});

	it('rejects steps referencing unknown tools', () => {
		const text = `\`\`\`json
{ "summary": "", "steps": [{ "toolName": "nuke_database", "params": {}, "rationale": "why not" }] }
\`\`\``;
		const r = parsePlannerResponse(text, TOOLS);
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.reason).toContain('nuke_database');
	});

	it('rejects steps missing rationale', () => {
		const text = `\`\`\`json
{ "summary": "", "steps": [{ "toolName": "create_task", "params": { "title": "x" } }] }
\`\`\``;
		const r = parsePlannerResponse(text, TOOLS);
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.reason).toContain('rationale');
	});

	it('tolerates missing summary / step summary by defaulting to empty', () => {
		const text = `\`\`\`json
{
  "steps": [
    { "toolName": "create_task", "params": {}, "rationale": "need one" }
  ]
}
\`\`\``;
		const r = parsePlannerResponse(text, TOOLS);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.summary).toBe('');
		expect(r.value.steps[0].summary).toBe('');
	});

	it('accepts an empty steps array (no-op iteration)', () => {
		const text = `\`\`\`json
{ "summary": "nothing to do today", "steps": [] }
\`\`\``;
		const r = parsePlannerResponse(text, TOOLS);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.value.steps).toHaveLength(0);
	});
});
