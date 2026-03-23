import { describe, it, expect } from 'vitest';
import { extractJson } from '../utils/json-extractor';

describe('extractJson', () => {
	it('parses direct JSON object', () => {
		const result = extractJson('{"name": "test", "value": 42}');
		expect(result).toEqual({ name: 'test', value: 42 });
	});

	it('parses direct JSON array', () => {
		const result = extractJson('[1, 2, 3]');
		expect(result).toEqual([1, 2, 3]);
	});

	it('strips markdown json code fence', () => {
		const input = '```json\n{"category": "bug", "title": "Fix login"}\n```';
		const result = extractJson(input);
		expect(result).toEqual({ category: 'bug', title: 'Fix login' });
	});

	it('strips markdown code fence without json label', () => {
		const input = '```\n{"key": "value"}\n```';
		const result = extractJson(input);
		expect(result).toEqual({ key: 'value' });
	});

	it('extracts JSON from surrounding text', () => {
		const input =
			'Here is the analysis:\n{"confidence": 0.95, "species": "Rose"}\nHope this helps!';
		const result = extractJson(input);
		expect(result).toEqual({ confidence: 0.95, species: 'Rose' });
	});

	it('extracts JSON array from surrounding text', () => {
		const input = 'The items are: [1, 2, 3] as requested.';
		const result = extractJson(input);
		expect(result).toEqual([1, 2, 3]);
	});

	it('handles nested JSON objects', () => {
		const input = '{"outer": {"inner": {"deep": true}}, "list": [1, 2]}';
		const result = extractJson(input);
		expect(result).toEqual({ outer: { inner: { deep: true } }, list: [1, 2] });
	});

	it('handles JSON with escaped quotes in strings', () => {
		const input = '{"text": "He said \\"hello\\""}';
		const result = extractJson(input);
		expect(result).toEqual({ text: 'He said "hello"' });
	});

	it('handles JSON with braces inside strings', () => {
		const input = 'Result: {"code": "if (x) { return }"}';
		const result = extractJson(input);
		expect(result).toEqual({ code: 'if (x) { return }' });
	});

	it('trims whitespace before parsing', () => {
		const input = '  \n  {"key": "value"}  \n  ';
		const result = extractJson(input);
		expect(result).toEqual({ key: 'value' });
	});

	it('applies validation function on success', () => {
		const validate = (data: unknown) => {
			const obj = data as { name: string };
			if (!obj.name) throw new Error('missing name');
			return obj;
		};
		const result = extractJson('{"name": "test"}', validate);
		expect(result).toEqual({ name: 'test' });
	});

	it('throws when validation fails', () => {
		const validate = (data: unknown) => {
			const obj = data as { name?: string };
			if (!obj.name) throw new Error('missing name');
			return obj;
		};
		expect(() => extractJson('{"value": 123}', validate)).toThrow();
	});

	it('throws on completely invalid input', () => {
		expect(() => extractJson('This is just plain text with no JSON')).toThrow(
			'Failed to extract JSON'
		);
	});

	it('throws on empty input', () => {
		expect(() => extractJson('')).toThrow('Failed to extract JSON');
	});

	it('handles real-world LLM response with preamble', () => {
		const input = `Based on my analysis, here is the result:

\`\`\`json
{
  "foods": [
    {"name": "Apple", "calories": 95, "protein": 0.5}
  ],
  "totalCalories": 95,
  "confidence": 0.9
}
\`\`\`

This analysis is based on the image provided.`;

		const result = extractJson<{ foods: unknown[]; totalCalories: number }>(input);
		expect(result.totalCalories).toBe(95);
		expect(result.foods).toHaveLength(1);
	});

	it('prefers object over array when both exist', () => {
		// Direct parse fails, fence fails, tries object first
		const input = 'Some text {"key": "val"} and [1, 2, 3]';
		const result = extractJson(input);
		expect(result).toEqual({ key: 'val' });
	});
});
