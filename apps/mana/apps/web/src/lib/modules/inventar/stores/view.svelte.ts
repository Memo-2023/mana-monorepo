/**
 * View Store — Client-side view preferences persisted to localStorage.
 */

import { createViewStore } from '@mana/shared-stores';
import type { ViewMode, FilterCriteria } from '../queries';

export const viewStore = createViewStore<ViewMode, FilterCriteria>({
	storagePrefix: 'inventar',
	defaultViewMode: 'list',
	defaultSort: { field: 'name', direction: 'asc' },
	hasActiveFilters: (f) =>
		!!(
			f.search ||
			f.status?.length ||
			f.locationId ||
			f.categoryId ||
			f.tagIds?.length ||
			f.collectionId
		),
});
