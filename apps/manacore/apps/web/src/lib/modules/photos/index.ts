/**
 * Photos module — barrel exports.
 */

export { photoStore } from './stores/photos.svelte';
export { albumMutations } from './stores/albums.svelte';
export {
	useAllTags,
	getTagById,
	getTagsByIds,
	tagMutations,
	photoTagOps,
} from './stores/tags.svelte';
export {
	useAllAlbums,
	useAllAlbumItems,
	useAllFavorites,
	toAlbum,
	toAlbumItem,
	getAlbumById,
	getAlbumItemsForAlbum,
	getAlbumItemCount,
	enrichAlbumsWithCounts,
	isFavorited,
	getFavoritedMediaIds,
} from './queries';
export {
	albumTable,
	albumItemTable,
	photoFavoriteTable,
	photoMediaTagTable,
	PHOTOS_GUEST_SEED,
} from './collections';
export type {
	LocalAlbum,
	LocalAlbumItem,
	LocalFavorite,
	LocalPhotoTag,
	Photo,
	PhotoFilters,
	PhotoStats,
	Album,
	AlbumItem,
} from './types';
