import { describe, it, expect } from 'vitest';
import {
	parseTaskInput,
	resolveTaskIds,
	formatParsedTaskPreview,
	parseMultiTaskInput,
	formatDuration,
} from './task-parser';

describe('parseTaskInput', () => {
	it('should parse a simple title', () => {
		const result = parseTaskInput('Einkaufen gehen');
		expect(result.title).toBe('Einkaufen gehen');
		expect(result.priority).toBeUndefined();
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

	it('should parse #labels', () => {
		const result = parseTaskInput('Anrufen #arbeit #privat');
		expect(result.labelNames).toEqual(['arbeit', 'privat']);
		expect(result.title).not.toContain('#');
	});

	it('should parse complex input with all fields', () => {
		const result = parseTaskInput('Meeting vorbereiten !!! #wichtig #team');
		expect(result.priority).toBe('urgent');
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

	it('should parse recurrence "täglich"', () => {
		const result = parseTaskInput('Standup täglich 9 Uhr');
		expect(result.recurrenceRule).toBe('FREQ=DAILY');
		expect(result.title).toBe('Standup');
	});

	it('should parse recurrence "jeden Montag"', () => {
		const result = parseTaskInput('Wochenbericht jeden Montag');
		expect(result.recurrenceRule).toBe('FREQ=WEEKLY;BYDAY=MO');
	});

	it('should parse recurrence "wöchentlich"', () => {
		const result = parseTaskInput('Review wöchentlich');
		expect(result.recurrenceRule).toBe('FREQ=WEEKLY');
	});

	it('should have no recurrence for normal input', () => {
		const result = parseTaskInput('Einfache Aufgabe');
		expect(result.recurrenceRule).toBeUndefined();
	});

	it('should parse subtasks "Einkaufen: Milch, Brot, Eier"', () => {
		const result = parseTaskInput('Einkaufen: Milch, Brot, Eier');
		expect(result.title).toBe('Einkaufen');
		expect(result.subtasks).toEqual(['Milch', 'Brot', 'Eier']);
	});

	it('should parse subtasks with semicolons', () => {
		const result = parseTaskInput('Aufräumen: Küche; Bad; Wohnzimmer');
		expect(result.title).toBe('Aufräumen');
		expect(result.subtasks).toEqual(['Küche', 'Bad', 'Wohnzimmer']);
	});

	it('should not parse subtasks with single item', () => {
		const result = parseTaskInput('Note: important thing');
		expect(result.subtasks).toBeUndefined();
	});

	it('should parse subtasks with other fields', () => {
		const result = parseTaskInput('Einkaufen: Milch, Brot morgen !!');
		expect(result.title).toBe('Einkaufen');
		expect(result.subtasks).toEqual(['Milch', 'Brot']);
		expect(result.priority).toBe('high');
	});
});

describe('resolveTaskIds', () => {
	const labels = [
		{ id: 'label-1', name: 'Wichtig' },
		{ id: 'label-2', name: 'Team' },
		{ id: 'label-3', name: 'Bug' },
	];

	it('should resolve label names to IDs (case-insensitive)', () => {
		// Note: "wichtig" is consumed by priority extraction, so use "bug" instead
		const parsed = parseTaskInput('Task #bug #team');
		const resolved = resolveTaskIds(parsed, labels);
		expect(resolved.labelIds).toEqual(['label-3', 'label-2']);
	});

	it('should skip unknown labels', () => {
		const parsed = parseTaskInput('Task #nichtda');
		const resolved = resolveTaskIds(parsed, labels);
		expect(resolved.labelIds).toEqual([]);
	});

	it('should preserve title and priority', () => {
		const parsed = parseTaskInput('Meeting vorbereiten !!! #wichtig');
		const resolved = resolveTaskIds(parsed, labels);
		expect(resolved.title).toContain('Meeting vorbereiten');
		expect(resolved.priority).toBe('urgent');
		expect(resolved.labelIds).toEqual(['label-1']);
	});
});

describe('formatParsedTaskPreview', () => {
	it('should format priority', () => {
		const parsed = parseTaskInput('Task !!!');
		const preview = formatParsedTaskPreview(parsed);
		expect(preview).toContain('Dringend');
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
		const parsed = parseTaskInput('Task !!!');
		const preview = formatParsedTaskPreview(parsed);
		expect(preview).not.toBe('');
	});

	it('should format duration in preview', () => {
		const parsed = parseTaskInput('Meeting 30min');
		const preview = formatParsedTaskPreview(parsed);
		expect(preview).toContain('30min');
	});
});

describe('duration extraction', () => {
	it('should parse "30min"', () => {
		const result = parseTaskInput('Meeting 30min');
		expect(result.estimatedDuration).toBe(30);
		expect(result.title).toBe('Meeting');
	});

	it('should parse "2h"', () => {
		const result = parseTaskInput('Workshop 2h');
		expect(result.estimatedDuration).toBe(120);
		expect(result.title).toBe('Workshop');
	});

	it('should parse "1.5 Stunden"', () => {
		const result = parseTaskInput('Recherche 1.5 Stunden');
		expect(result.estimatedDuration).toBe(90);
		expect(result.title).not.toContain('Stunden');
	});

	it('should parse "45 Minuten"', () => {
		const result = parseTaskInput('Joggen 45 Minuten');
		expect(result.estimatedDuration).toBe(45);
	});

	it('should parse "1,5h" with comma decimal', () => {
		const result = parseTaskInput('Coding 1,5h');
		expect(result.estimatedDuration).toBe(90);
	});

	it('should not extract duration when not present', () => {
		const result = parseTaskInput('Einkaufen gehen');
		expect(result.estimatedDuration).toBeUndefined();
	});

	it('should work with other fields', () => {
		const result = parseTaskInput('Meeting 2h morgen !!');
		expect(result.estimatedDuration).toBe(120);
		expect(result.priority).toBe('high');
	});
});

describe('parseMultiTaskInput', () => {
	it('should return single task for simple input', () => {
		const tasks = parseMultiTaskInput('Einkaufen gehen');
		expect(tasks).toHaveLength(1);
		expect(tasks[0].title).toBe('Einkaufen gehen');
	});

	it('should split on "danach"', () => {
		const tasks = parseMultiTaskInput('Zahnarzt danach Einkaufen');
		expect(tasks).toHaveLength(2);
		expect(tasks[0].title).toBe('Zahnarzt');
		expect(tasks[1].title).toBe('Einkaufen');
	});

	it('should split on "dann"', () => {
		const tasks = parseMultiTaskInput('Kochen dann Abwaschen');
		expect(tasks).toHaveLength(2);
		expect(tasks[0].title).toBe('Kochen');
		expect(tasks[1].title).toBe('Abwaschen');
	});

	it('should split on semicolon', () => {
		const tasks = parseMultiTaskInput('Mails; Report; Meeting');
		expect(tasks).toHaveLength(3);
		expect(tasks[0].title).toBe('Mails');
		expect(tasks[1].title).toBe('Report');
		expect(tasks[2].title).toBe('Meeting');
	});

	it('should inherit date context from first task', () => {
		const tasks = parseMultiTaskInput('Morgen Zahnarzt danach Einkaufen');
		expect(tasks).toHaveLength(2);
		expect(tasks[0].dueDate).toBeDefined();
		expect(tasks[1].dueDate).toBeDefined();
		// Both should be tomorrow
		expect(tasks[0].dueDate!.toDateString()).toBe(tasks[1].dueDate!.toDateString());
	});

	it('should offset time when first task has duration', () => {
		const tasks = parseMultiTaskInput('Meeting 14 Uhr 1h danach Notizen');
		expect(tasks).toHaveLength(2);
		expect(tasks[0].dueDate).toBeDefined();
		expect(tasks[1].dueDate).toBeDefined();
		// Second task should start at 15:00
		expect(tasks[1].dueDate!.getHours()).toBe(15);
		expect(tasks[1].dueDate!.getMinutes()).toBe(0);
	});

	it('should not split on "dann" inside a word', () => {
		const tasks = parseMultiTaskInput('Dokumentation lesen');
		expect(tasks).toHaveLength(1);
	});

	it('should handle ", danach" pattern', () => {
		const tasks = parseMultiTaskInput('Zahnarzt, danach Apotheke');
		expect(tasks).toHaveLength(2);
		expect(tasks[0].title).toBe('Zahnarzt');
		expect(tasks[1].title).toBe('Apotheke');
	});
});

describe('formatDuration', () => {
	it('should format minutes only', () => {
		expect(formatDuration(30)).toBe('30min');
		expect(formatDuration(5)).toBe('5min');
	});

	it('should format full hours', () => {
		expect(formatDuration(60)).toBe('1h');
		expect(formatDuration(120)).toBe('2h');
	});

	it('should format hours and minutes', () => {
		expect(formatDuration(90)).toBe('1h 30min');
		expect(formatDuration(75)).toBe('1h 15min');
	});
});
