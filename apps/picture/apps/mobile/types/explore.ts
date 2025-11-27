import { Tag } from '~/store/tagStore';

export type Creator = {
	id: string;
	username: string | null;
	avatarUrl: string | null;
};

export type ExploreImageItem = {
	id: string;
	publicUrl: string | null;
	prompt: string;
	createdAt: string;
	isFavorite: boolean;
	userId: string;
	model?: string;
	tags?: Tag[];
	creator?: Creator;
	likesCount?: number;
	userHasLiked?: boolean;
	blurhash?: string | null;
};

export type SortMode = 'recent' | 'popular' | 'trending';
