import { describe, it, expect } from 'vitest';
import { parseSongInput, formatParsedSongPreview } from './song-parser';

describe('parseSongInput', () => {
	it('should parse a simple title', () => {
		const result = parseSongInput('My Song');
		expect(result.title).toBe('My Song');
		expect(result.artist).toBeUndefined();
		expect(result.tagNames).toEqual([]);
	});

	it('should parse "Artist - Title" format', () => {
		const result = parseSongInput('Queen - Bohemian Rhapsody');
		expect(result.artist).toBe('Queen');
		expect(result.title).toBe('Bohemian Rhapsody');
	});

	it('should parse with en-dash separator', () => {
		const result = parseSongInput('Beatles – Hey Jude');
		expect(result.artist).toBe('Beatles');
		expect(result.title).toBe('Hey Jude');
	});

	it('should parse genre tags', () => {
		const result = parseSongInput('Song #rock #classic');
		expect(result.genre).toBe('rock');
		expect(result.tagNames).toEqual(['rock', 'classic']);
	});

	it('should parse BPM', () => {
		const result = parseSongInput('Beat 120bpm');
		expect(result.bpm).toBe(120);
		expect(result.title).toBe('Beat');
	});

	it('should parse year', () => {
		const result = parseSongInput('Song 1975');
		expect(result.year).toBe(1975);
	});

	it('should detect playlist creation', () => {
		const result = parseSongInput('Neue Playlist Workout #electronic');
		expect(result.isPlaylist).toBe(true);
		expect(result.title).toBe('Workout');
		expect(result.genre).toBe('electronic');
	});

	it('should detect project creation', () => {
		const result = parseSongInput('Neues Projekt Demo 90bpm');
		expect(result.isProject).toBe(true);
		expect(result.title).toBe('Demo');
		expect(result.bpm).toBe(90);
	});

	it('should parse complex input', () => {
		const result = parseSongInput('Daft Punk - Get Lucky 2013 #electronic #disco');
		expect(result.artist).toBe('Daft Punk');
		expect(result.title).toBe('Get Lucky');
		expect(result.year).toBe(2013);
		expect(result.genre).toBe('electronic');
	});

	it('should handle empty input', () => {
		const result = parseSongInput('');
		expect(result.title).toBe('');
		expect(result.tagNames).toEqual([]);
	});

	it('should ignore invalid BPM', () => {
		const result = parseSongInput('Track 5bpm'); // too low
		expect(result.bpm).toBeUndefined();
	});
});

describe('formatParsedSongPreview', () => {
	it('should format artist', () => {
		const parsed = parseSongInput('Queen - Song');
		const preview = formatParsedSongPreview(parsed);
		expect(preview).toContain('Queen');
	});

	it('should format genre', () => {
		const parsed = parseSongInput('Song #rock');
		const preview = formatParsedSongPreview(parsed);
		expect(preview).toContain('rock');
	});

	it('should format BPM', () => {
		const parsed = parseSongInput('Beat 120bpm');
		const preview = formatParsedSongPreview(parsed);
		expect(preview).toContain('120 BPM');
	});

	it('should format playlist type', () => {
		const parsed = parseSongInput('Neue Playlist Workout');
		const preview = formatParsedSongPreview(parsed);
		expect(preview).toContain('Neue Playlist');
	});

	it('should return empty for simple title', () => {
		const parsed = parseSongInput('Simple Song');
		expect(formatParsedSongPreview(parsed)).toBe('');
	});
});
