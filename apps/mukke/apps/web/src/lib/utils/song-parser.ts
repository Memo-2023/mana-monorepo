/**
 * Song/Project Parser for Mukke App
 *
 * Parses natural language input into song metadata or project creation.
 *
 * Patterns:
 * - "Artist - Title" format for songs
 * - #genre tags
 * - BPM number (e.g., 120bpm)
 * - Year (e.g., 2024)
 *
 * Examples:
 * - "Queen - Bohemian Rhapsody #rock"
 * - "Neue Playlist Workout #electronic #techno"
 * - "Projekt Demo Song 120bpm"
 */

import { extractTags, type ParserLocale } from '@manacore/shared-utils';

export interface ParsedSong {
	title: string;
	artist?: string;
	artists?: string[];
	album?: string;
	genre?: string;
	bpm?: number;
	year?: number;
	tagNames: string[];
	isPlaylist?: boolean;
	isProject?: boolean;
}

// BPM pattern: 120bpm, 120 BPM
const BPM_PATTERN = /\b(\d{2,3})\s*bpm\b/i;

// Year pattern: standalone 4-digit year (1900-2099)
const YEAR_PATTERN = /\b((?:19|20)\d{2})\b/;

// Playlist creation keywords per locale
const PLAYLIST_PATTERNS_BY_LOCALE: Record<ParserLocale, RegExp[]> = {
	de: [/\bneue?\s*playlist\b/i, /\bplaylist\b/i],
	en: [/\bnew\s+playlist\b/i, /\bplaylist\b/i],
	fr: [/\bnouvelle\s+playlist\b/i, /\bplaylist\b/i],
	es: [/\bnueva\s+playlist\b/i, /\bplaylist\b/i],
	it: [/\bnuova\s+playlist\b/i, /\bplaylist\b/i],
};

// Project creation keywords per locale
const PROJECT_PATTERNS_BY_LOCALE: Record<ParserLocale, RegExp[]> = {
	de: [/\bneue?s?\s*projekt\b/i, /\bprojekt\b/i],
	en: [/\bnew\s+project\b/i, /\bproject\b/i],
	fr: [/\bnouveau\s+projet\b/i, /\bprojet\b/i],
	es: [/\bnuevo\s+proyecto\b/i, /\bproyecto\b/i],
	it: [/\bnuovo\s+progetto\b/i, /\bprogetto\b/i],
};

// Album pattern: trailing parenthesized text e.g. "Title (Album Name)"
const ALBUM_PATTERN = /\(([^)]+)\)\s*$/;

// Multi-artist separator patterns
const MULTI_ARTIST_PATTERN = /\s+(?:ft\.?|feat\.?|featuring|&|x|vs\.?)\s+/i;

// "Artist - Title" separator
const ARTIST_TITLE_SEPARATOR = /\s+[-–—]\s+/;

function extractBpm(text: string): { bpm?: number; remaining: string } {
	const match = text.match(BPM_PATTERN);
	if (match) {
		const bpm = parseInt(match[1]);
		if (bpm >= 20 && bpm <= 300) {
			return { bpm, remaining: text.replace(BPM_PATTERN, '').trim() };
		}
	}
	return { bpm: undefined, remaining: text };
}

function extractAlbum(text: string): { album?: string; remaining: string } {
	const match = text.match(ALBUM_PATTERN);
	if (match) {
		return { album: match[1].trim(), remaining: text.replace(ALBUM_PATTERN, '').trim() };
	}
	return { album: undefined, remaining: text };
}

function extractArtists(artist: string): string[] {
	return artist
		.split(MULTI_ARTIST_PATTERN)
		.map((a) => a.trim())
		.filter((a) => a.length > 0);
}

function extractYear(text: string): { year?: number; remaining: string } {
	const match = text.match(YEAR_PATTERN);
	if (match) {
		return {
			year: parseInt(match[1]),
			remaining: text.replace(YEAR_PATTERN, '').trim(),
		};
	}
	return { year: undefined, remaining: text };
}

// Preview labels per locale
const TYPE_LABELS_BY_LOCALE: Record<ParserLocale, { playlist: string; project: string }> = {
	de: { playlist: 'Neue Playlist', project: 'Neues Projekt' },
	en: { playlist: 'New Playlist', project: 'New Project' },
	fr: { playlist: 'Nouvelle Playlist', project: 'Nouveau Projet' },
	es: { playlist: 'Nueva Playlist', project: 'Nuevo Proyecto' },
	it: { playlist: 'Nuova Playlist', project: 'Nuovo Progetto' },
};

function extractTypeKeyword(
	text: string,
	locale: ParserLocale = 'de'
): { type?: 'playlist' | 'project'; remaining: string } {
	const playlistPatterns = PLAYLIST_PATTERNS_BY_LOCALE[locale];
	for (const pattern of playlistPatterns) {
		if (pattern.test(text)) {
			return { type: 'playlist', remaining: text.replace(pattern, '').trim() };
		}
	}
	const projectPatterns = PROJECT_PATTERNS_BY_LOCALE[locale];
	for (const pattern of projectPatterns) {
		if (pattern.test(text)) {
			return { type: 'project', remaining: text.replace(pattern, '').trim() };
		}
	}
	return { type: undefined, remaining: text };
}

/**
 * Parse natural language song/project input
 */
export function parseSongInput(input: string, locale: ParserLocale = 'de'): ParsedSong {
	let text = input.trim();

	// Extract tags first
	const tagsResult = extractTags(text);
	text = tagsResult.remaining;
	const tagNames = tagsResult.value || [];

	// Use first tag as genre hint
	const genre = tagNames.length > 0 ? tagNames[0] : undefined;

	// Extract type keyword (playlist/project)
	const typeResult = extractTypeKeyword(text, locale);
	text = typeResult.remaining;

	// Extract album from parentheses (before other extractions to avoid confusion)
	const albumResult = extractAlbum(text);
	text = albumResult.remaining;

	// Extract BPM
	const bpmResult = extractBpm(text);
	text = bpmResult.remaining;

	// Extract year
	const yearResult = extractYear(text);
	text = yearResult.remaining;

	// Try "Artist - Title" format
	let artist: string | undefined;
	let artists: string[] | undefined;
	let title: string;

	if (ARTIST_TITLE_SEPARATOR.test(text)) {
		const parts = text.split(ARTIST_TITLE_SEPARATOR, 2);
		const rawArtist = parts[0].trim();
		title = parts[1].trim();

		// Detect multi-artist patterns
		const artistList = extractArtists(rawArtist);
		if (artistList.length > 1) {
			artist = artistList[0];
			artists = artistList;
		} else {
			artist = rawArtist;
		}
	} else {
		title = text.replace(/\s+/g, ' ').trim();
	}

	return {
		title,
		artist,
		artists,
		album: albumResult.album,
		genre,
		bpm: bpmResult.bpm,
		year: yearResult.year,
		tagNames,
		isPlaylist: typeResult.type === 'playlist',
		isProject: typeResult.type === 'project',
	};
}

/**
 * Format parsed song for preview display
 */
export function formatParsedSongPreview(parsed: ParsedSong, locale: ParserLocale = 'de'): string {
	const parts: string[] = [];

	const typeLabels = TYPE_LABELS_BY_LOCALE[locale];
	if (parsed.isPlaylist) {
		parts.push(`📋 ${typeLabels.playlist}`);
	} else if (parsed.isProject) {
		parts.push(`🎛️ ${typeLabels.project}`);
	}

	if (parsed.artist) {
		parts.push(`🎤 ${parsed.artist}`);
	}

	if (parsed.album) {
		parts.push(`💿 ${parsed.album}`);
	}

	if (parsed.genre) {
		parts.push(`🎵 ${parsed.genre}`);
	}

	if (parsed.bpm) {
		parts.push(`⏱️ ${parsed.bpm} BPM`);
	}

	if (parsed.year) {
		parts.push(`📅 ${parsed.year}`);
	}

	if (parsed.tagNames.length > 1) {
		parts.push(`🏷️ ${parsed.tagNames.slice(1).join(', ')}`);
	}

	return parts.join(' · ');
}
