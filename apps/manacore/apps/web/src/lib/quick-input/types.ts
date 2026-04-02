/**
 * Unified QuickInputBar Adapter — Type Definitions
 *
 * Each module implements InputBarAdapter to provide context-aware
 * search, create-preview, and create behavior for the QuickInputBar.
 */

import type { QuickInputItem, CreatePreview, HighlightPattern } from '@manacore/shared-ui';

export interface InputBarAdapter {
	// Required
	onSearch: (query: string) => Promise<QuickInputItem[]>;
	onSelect: (item: QuickInputItem) => void;

	// Create (optional — modules without create don't set these)
	onParseCreate?: (query: string) => CreatePreview | null;
	onCreate?: (query: string) => Promise<void>;
	onSearchChange?: (query: string, results: QuickInputItem[]) => void;

	// Display
	placeholder: string;
	appIcon: string;
	emptyText?: string;
	createText?: string;
	deferSearch?: boolean;

	// Calendar-style default selector
	defaultOptions?: { id: string; label: string }[];
	selectedDefaultId?: string;
	defaultOptionLabel?: string;
	onDefaultChange?: (id: string) => void;

	// Highlight patterns
	highlightPatterns?: HighlightPattern[];
}

export type InputBarAdapterFactory = () => InputBarAdapter;
