/**
 * Extract and parse JSON from LLM responses.
 *
 * LLMs often wrap JSON in markdown code fences or include extra text.
 * This utility handles all common patterns:
 * 1. Direct JSON parse
 * 2. Markdown ```json ... ``` fences
 * 3. First { ... } or [ ... ] block in text
 */
export function extractJson<T = unknown>(text: string, validate?: (data: unknown) => T): T {
	const trimmed = text.trim();

	// Step 1: Try direct parse
	const direct = tryParse<T>(trimmed, validate);
	if (direct !== undefined) return direct;

	// Step 2: Strip markdown code fences
	const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (fenceMatch) {
		const fenced = tryParse<T>(fenceMatch[1].trim(), validate);
		if (fenced !== undefined) return fenced;
	}

	// Step 3: Find first JSON object
	const objectStart = trimmed.indexOf('{');
	if (objectStart !== -1) {
		const objectStr = extractBalanced(trimmed, objectStart, '{', '}');
		if (objectStr) {
			const obj = tryParse<T>(objectStr, validate);
			if (obj !== undefined) return obj;
		}
	}

	// Step 4: Find first JSON array
	const arrayStart = trimmed.indexOf('[');
	if (arrayStart !== -1) {
		const arrayStr = extractBalanced(trimmed, arrayStart, '[', ']');
		if (arrayStr) {
			const arr = tryParse<T>(arrayStr, validate);
			if (arr !== undefined) return arr;
		}
	}

	throw new Error(`Failed to extract JSON from LLM response: ${trimmed.slice(0, 200)}...`);
}

function tryParse<T>(text: string, validate?: (data: unknown) => T): T | undefined {
	try {
		const parsed = JSON.parse(text);
		return validate ? validate(parsed) : parsed;
	} catch {
		return undefined;
	}
}

/**
 * Extract a balanced block starting from the given position.
 * Handles nested braces/brackets but not strings with escaped delimiters.
 */
function extractBalanced(text: string, start: number, open: string, close: string): string | null {
	let depth = 0;
	let inString = false;
	let escape = false;

	for (let i = start; i < text.length; i++) {
		const ch = text[i];

		if (escape) {
			escape = false;
			continue;
		}

		if (ch === '\\') {
			escape = true;
			continue;
		}

		if (ch === '"') {
			inString = !inString;
			continue;
		}

		if (inString) continue;

		if (ch === open) depth++;
		if (ch === close) depth--;

		if (depth === 0) {
			return text.slice(start, i + 1);
		}
	}

	return null;
}
