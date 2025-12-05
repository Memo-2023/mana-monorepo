export interface StorageFile {
	id: string;
	userId: string;
	name: string;
	originalName: string;
	mimeType: string;
	size: number;
	storagePath: string;
	storageKey: string;
	parentFolderId: string | null;
	currentVersion: number;
	isFavorite: boolean;
	isDeleted: boolean;
	deletedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface StorageFolder {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	parentFolderId: string | null;
	path: string;
	depth: number;
	isFavorite: boolean;
	isDeleted: boolean;
	deletedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface FileVersion {
	id: string;
	fileId: string;
	versionNumber: number;
	storagePath: string;
	storageKey: string;
	size: number;
	comment: string | null;
	createdBy: string;
	createdAt: Date;
}

export interface Share {
	id: string;
	userId: string;
	fileId: string | null;
	folderId: string | null;
	shareType: 'file' | 'folder';
	shareToken: string;
	accessLevel: 'view' | 'edit' | 'download';
	password: string | null;
	maxDownloads: number | null;
	downloadCount: number;
	expiresAt: Date | null;
	createdAt: Date;
}

export interface Tag {
	id: string;
	userId: string;
	name: string;
	color: string;
	createdAt: Date;
}

export interface FileTag {
	fileId: string;
	tagId: string;
}
