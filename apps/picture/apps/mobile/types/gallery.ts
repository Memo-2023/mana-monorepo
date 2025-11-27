import { Tag } from '~/store/tagStore';

export type ImageItem = {
	id: string;
	publicUrl: string | null;
	prompt: string;
	createdAt: string;
	isFavorite: boolean;
	model?: string;
	tags?: Tag[];
	blurhash?: string | null;
};

export type FilterMode = 'all' | 'favorites';

export type ViewMode = 'single' | 'grid3' | 'grid5';
