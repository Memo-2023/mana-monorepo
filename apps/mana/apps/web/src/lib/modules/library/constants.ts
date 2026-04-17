import type { LibraryKind, LibraryStatus, BookFormat } from './types';

export const KIND_LABELS: Record<LibraryKind, { de: string; en: string; emoji: string }> = {
	book: { de: 'Bücher', en: 'Books', emoji: '📚' },
	movie: { de: 'Filme', en: 'Movies', emoji: '🎬' },
	series: { de: 'Serien', en: 'Series', emoji: '📺' },
	comic: { de: 'Comics', en: 'Comics', emoji: '💥' },
};

export const STATUS_LABELS: Record<LibraryStatus, { de: string; en: string }> = {
	planned: { de: 'Geplant', en: 'Planned' },
	active: { de: 'Läuft', en: 'In progress' },
	completed: { de: 'Fertig', en: 'Completed' },
	paused: { de: 'Pausiert', en: 'Paused' },
	dropped: { de: 'Abgebrochen', en: 'Dropped' },
};

export const STATUS_COLORS: Record<LibraryStatus, string> = {
	planned: '#64748b',
	active: '#3b82f6',
	completed: '#22c55e',
	paused: '#f59e0b',
	dropped: '#ef4444',
};

export const BOOK_FORMAT_LABELS: Record<BookFormat, { de: string; en: string }> = {
	hardcover: { de: 'Hardcover', en: 'Hardcover' },
	paperback: { de: 'Taschenbuch', en: 'Paperback' },
	ebook: { de: 'E-Book', en: 'E-Book' },
	audio: { de: 'Hörbuch', en: 'Audiobook' },
};

export const DEFAULT_GENRES = [
	'Sci-Fi',
	'Fantasy',
	'Thriller',
	'Krimi',
	'Romanze',
	'Drama',
	'Komödie',
	'Horror',
	'Biografie',
	'Sachbuch',
	'Action',
	'Animation',
	'Dokumentation',
	'Historisch',
];
