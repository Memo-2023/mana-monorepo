import type { Category } from './categories';

/**
 * A quote with author and category
 */
export interface Quote {
	/** Unique identifier (e.g., 'mot-1', 'weis-2') */
	id: string;
	/** The quote text in German */
	text: string;
	/** Author name */
	author: string;
	/** Category for filtering */
	category: Category;
}
