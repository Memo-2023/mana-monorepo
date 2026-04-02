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

	it('should extract album from parentheses', () => {
		const result = parseSongInput('Queen - Bohemian Rhapsody (A Night at the Opera)');
		expect(result.artist).toBe('Queen');
		expect(result.title).toBe('Bohemian Rhapsody');
		expect(result.album).toBe('A Night at the Opera');
	});

	it('should extract album from title without artist', () => {
		const result = parseSongInput('Song (Album)');
		expect(result.title).toBe('Song');
		expect(result.album).toBe('Album');
	});

	it('should detect multi-artist with ft.', () => {
		const result = parseSongInput('Daft Punk ft. Pharrell - Get Lucky');
		expect(result.artist).toBe('Daft Punk');
		expect(result.artists).toEqual(['Daft Punk', 'Pharrell']);
		expect(result.title).toBe('Get Lucky');
	});

	it('should detect multi-artist with &', () => {
		const result = parseSongInput('ACDC & Brian Johnson - Thunderstruck');
		expect(result.artist).toBe('ACDC');
		expect(result.artists).toEqual(['ACDC', 'Brian Johnson']);
		expect(result.title).toBe('Thunderstruck');
	});

	it('should detect multi-artist with feat.', () => {
		const result = parseSongInput('Jay-Z feat. Kanye West - Niggas in Paris');
		expect(result.artist).toBe('Jay-Z');
		expect(result.artists).toEqual(['Jay-Z', 'Kanye West']);
	});

	it('should detect multi-artist with featuring', () => {
		const result = parseSongInput('Eminem featuring Rihanna - Love the Way You Lie');
		expect(result.artist).toBe('Eminem');
		expect(result.artists).toEqual(['Eminem', 'Rihanna']);
	});

	it('should not set artists for single artist', () => {
		const result = parseSongInput('Queen - Bohemian Rhapsody');
		expect(result.artist).toBe('Queen');
		expect(result.artists).toBeUndefined();
	});

	it('should combine album and multi-artist', () => {
		const result = parseSongInput('Daft Punk ft. Pharrell - Get Lucky (Random Access Memories)');
		expect(result.artist).toBe('Daft Punk');
		expect(result.artists).toEqual(['Daft Punk', 'Pharrell']);
		expect(result.title).toBe('Get Lucky');
		expect(result.album).toBe('Random Access Memories');
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

	it('should format album', () => {
		const parsed = parseSongInput('Queen - Bohemian Rhapsody (A Night at the Opera)');
		const preview = formatParsedSongPreview(parsed);
		expect(preview).toContain('💿 A Night at the Opera');
	});

	it('should return empty for simple title', () => {
		const parsed = parseSongInput('Simple Song');
		expect(formatParsedSongPreview(parsed)).toBe('');
	});
});
