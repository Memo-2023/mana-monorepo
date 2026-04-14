export interface QuickInputItem {
	id: string;
	title: string;
	subtitle?: string;
	icon?: string;
	imageUrl?: string;
	isFavorite?: boolean;
}

export interface QuickAction {
	id: string;
	label: string;
	href?: string;
	icon: string;
	shortcut?: string;
	onclick?: () => void;
}

export interface CreatePreview {
	title: string;
	subtitle: string;
}

// HighlightPattern lives in ../search-core/highlight; re-exported here for
// back-compat with older imports.
export type { HighlightPattern } from '../search-core/highlight';
