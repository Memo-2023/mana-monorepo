/**
 * Library module — barrel exports.
 */

export { libraryEntriesStore } from './stores/entries.svelte';

export {
	useAllEntries,
	toLibraryEntry,
	filterByKind,
	filterByStatus,
	searchEntries,
	groupByKind,
	computeStats,
} from './queries';

export { libraryEntryTable, LIBRARY_GUEST_SEED } from './collections';

export {
	KIND_LABELS,
	STATUS_LABELS,
	STATUS_COLORS,
	BOOK_FORMAT_LABELS,
	DEFAULT_GENRES,
} from './constants';

export type {
	LocalLibraryEntry,
	LibraryEntry,
	LibraryKind,
	LibraryStatus,
	LibraryDetails,
	BookDetails,
	MovieDetails,
	SeriesDetails,
	ComicDetails,
	BookFormat,
	WatchedEpisode,
	LibraryExternalIds,
} from './types';

export type { LibraryStats } from './queries';
