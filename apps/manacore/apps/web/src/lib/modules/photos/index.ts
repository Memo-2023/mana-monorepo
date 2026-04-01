/**
 * Photos module — barrel exports.
 */

export { photoStore } from './stores/photos.svelte';
export { albumMutations } from './stores/albums.svelte';
export {
	useAllPhotoTags,
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
	photoTagTable,
	photoMediaTagTable,
	PHOTOS_GUEST_SEED,
} from './collections';
export type {
	LocalAlbum,
	LocalAlbumItem,
	LocalFavorite,
	LocalTag,
	LocalPhotoTag,
	Photo,
	PhotoFilters,
	PhotoStats,
	Album,
	AlbumItem,
} from './types';
