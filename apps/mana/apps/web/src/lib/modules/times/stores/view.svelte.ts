/**
 * View Store — manages view mode, sort, and filter state for Times.
 */

import { createViewStore } from '@mana/shared-stores';
import type { ViewMode, FilterCriteria } from '$lib/modules/times/types';

export const viewStore = createViewStore<ViewMode, FilterCriteria>({
	storagePrefix: 'times',
	defaultViewMode: 'week',
	defaultSort: { field: 'date', direction: 'desc' },
	hasActiveFilters: (f) =>
		!!(
			f.search ||
			f.projectId ||
			f.clientId ||
			f.tagIds?.length ||
			f.isBillable !== undefined ||
			f.dateFrom ||
			f.dateTo
		),
});
