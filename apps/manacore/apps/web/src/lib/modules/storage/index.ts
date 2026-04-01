/**
 * Storage module — barrel exports.
 */

export { filesStore } from './stores/files.svelte';
export { storageTagStore } from './stores/tags.svelte';
export {
	useAllFiles,
	useAllFolders,
	useAllStorageTags,
	toFile,
	toFolder,
	toTag,
	getFilesInFolder,
	getFoldersInFolder,
	getFavoriteFiles,
	getFavoriteFolders,
	findFolderById,
	getDeletedFiles,
	getDeletedFolders,
	searchItems,
	formatFileSize,
} from './queries';
export type { StorageFile, StorageFolder, StorageTag } from './queries';
export {
	fileTable,
	storageFolderTable,
	storageTagTable,
	fileTagTable,
	STORAGE_GUEST_SEED,
} from './collections';
export type { LocalFile, LocalFolder, LocalTag, LocalFileTag } from './types';
