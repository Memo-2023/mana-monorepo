import { createSimpleNavigationStores } from '@manacore/shared-stores';

export const { isNavCollapsed, isToolbarCollapsed } = createSimpleNavigationStores({
	withToolbar: true,
	toolbarCollapsedDefault: true,
});
