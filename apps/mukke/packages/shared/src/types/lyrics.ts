export interface Lyrics {
	id: string;
	projectId: string;
	content?: string | null;
}

export interface LyricLine {
	id: string;
	lyricsId: string;
	lineNumber: number;
	text: string;
	startTime?: number | null;
	endTime?: number | null;
}

export interface CreateLyricsDto {
	projectId: string;
	content?: string;
}

export interface UpdateLyricsDto {
	content?: string;
}

export interface CreateLyricLineDto {
	lyricsId: string;
	lineNumber: number;
	text: string;
	startTime?: number;
	endTime?: number;
}

export interface UpdateLyricLineDto {
	text?: string;
	startTime?: number;
	endTime?: number;
}

export interface SyncedLyrics {
	lines: SyncedLine[];
}

export interface SyncedLine {
	lineNumber: number;
	text: string;
	startTime: number;
	endTime?: number;
	words?: SyncedWord[];
}

export interface SyncedWord {
	word: string;
	startTime: number;
	endTime: number;
}
