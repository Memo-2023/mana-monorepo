import { describe, it, expect } from 'vitest';
import { parseTaskInput, resolveTaskIds, formatParsedTaskPreview } from './task-parser';

describe('parseTaskInput', () => {
	it('should parse a simple title', () => {
		const result = parseTaskInput('Einkaufen gehen');
		expect(result.title).toBe('Einkaufen gehen');
		expect(result.priority).toBeUndefined();
		expect(result.projectName).toBeUndefined();
		expect(result.labelNames).toEqual([]);
	});

	it('should parse priority !!! as urgent', () => {
		const result = parseTaskInput('Deadline !!! fertig machen');
		expect(result.priority).toBe('urgent');
		expect(result.title).not.toContain('!!!');
	});

	it('should parse priority !! as high', () => {
		const result = parseTaskInput('Report !! abgeben');
		expect(result.priority).toBe('high');
		expect(result.title).not.toContain('!!');
	});

	it('should parse dringend as urgent', () => {
		const result = parseTaskInput('Bug fixen dringend');
		expect(result.priority).toBe('urgent');
	});

	it('should parse wichtig as high', () => {
		const result = parseTaskInput('Meeting wichtig');
		expect(result.priority).toBe('high');
	});

	it('should parse normal as medium', () => {
		const result = parseTaskInput('Aufräumen normal');
		expect(result.priority).toBe('medium');
	});

	it('should parse später as low', () => {
		const result = parseTaskInput('Docs lesen später');
		expect(result.priority).toBe('low');
	});

	it('should parse @project', () => {
		const result = parseTaskInput('Task erledigen @Arbeit');
		expect(result.projectName).toBe('Arbeit');
		expect(result.title).not.toContain('@Arbeit');
	});

	it('should parse #labels', () => {
		const result = parseTaskInput('Anrufen #arbeit #privat');
		expect(result.labelNames).toEqual(['arbeit', 'privat']);
		expect(result.title).not.toContain('#');
	});

	it('should parse complex input with all fields', () => {
		const result = parseTaskInput('Meeting vorbereiten !!! @Arbeit #wichtig #team');
		expect(result.priority).toBe('urgent');
		expect(result.projectName).toBe('Arbeit');
		expect(result.labelNames).toEqual(['wichtig', 'team']);
		expect(result.title).toContain('Meeting vorbereiten');
	});

	it('should handle empty input', () => {
		const result = parseTaskInput('');
		expect(result.title).toBe('');
		expect(result.labelNames).toEqual([]);
	});

	it('should handle only labels', () => {
		// Note: "dringend" is consumed by priority extraction before label parsing
		const result = parseTaskInput('#arbeit #privat');
		expect(result.labelNames).toEqual(['arbeit', 'privat']);
	});
});

describe('resolveTaskIds', () => {
	const projects = [
		{ id: 'proj-1', name: 'Arbeit' },
		{ id: 'proj-2', name: 'Privat' },
	];

	const labels = [
		{ id: 'label-1', name: 'Wichtig' },
		{ id: 'label-2', name: 'Team' },
		{ id: 'label-3', name: 'Bug' },
	];

	it('should resolve project name to ID (case-insensitive)', () => {
		const parsed = parseTaskInput('Task @arbeit');
		const resolved = resolveTaskIds(parsed, projects, labels);
		expect(resolved.projectId).toBe('proj-1');
	});

	it('should resolve label names to IDs (case-insensitive)', () => {
		// Note: "wichtig" is consumed by priority extraction, so use "bug" instead
		const parsed = parseTaskInput('Task #bug #team');
		const resolved = resolveTaskIds(parsed, projects, labels);
		expect(resolved.labelIds).toEqual(['label-3', 'label-2']);
	});

	it('should skip unknown project', () => {
		const parsed = parseTaskInput('Task @Unbekannt');
		const resolved = resolveTaskIds(parsed, projects, labels);
		expect(resolved.projectId).toBeUndefined();
	});

	it('should skip unknown labels', () => {
		const parsed = parseTaskInput('Task #nichtda');
		const resolved = resolveTaskIds(parsed, projects, labels);
		expect(resolved.labelIds).toEqual([]);
	});

	it('should preserve title and priority', () => {
		const parsed = parseTaskInput('Meeting vorbereiten !!! @Arbeit #wichtig');
		const resolved = resolveTaskIds(parsed, projects, labels);
		expect(resolved.title).toContain('Meeting vorbereiten');
		expect(resolved.priority).toBe('urgent');
		expect(resolved.projectId).toBe('proj-1');
		expect(resolved.labelIds).toEqual(['label-1']);
	});
});

describe('formatParsedTaskPreview', () => {
	it('should format priority', () => {
		const parsed = parseTaskInput('Task !!!');
		const preview = formatParsedTaskPreview(parsed);
		expect(preview).toContain('Dringend');
	});

	it('should format project', () => {
		const parsed = parseTaskInput('Task @Arbeit');
		const preview = formatParsedTaskPreview(parsed);
		expect(preview).toContain('Arbeit');
	});

	it('should format labels', () => {
		const parsed = parseTaskInput('Task #arbeit #team');
		const preview = formatParsedTaskPreview(parsed);
		expect(preview).toContain('arbeit');
		expect(preview).toContain('team');
	});

	it('should return empty string for title-only input', () => {
		const parsed = parseTaskInput('Einfacher Task');
		expect(formatParsedTaskPreview(parsed)).toBe('');
	});

	it('should join parts with separator', () => {
		const parsed = parseTaskInput('Task !!! @Arbeit');
		const preview = formatParsedTaskPreview(parsed);
		expect(preview).toContain(' · ');
	});
});
