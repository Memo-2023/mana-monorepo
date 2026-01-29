import { createSimpleNavigationStores } from '@manacore/shared-stores';

export const { isSidebarMode, isNavCollapsed, isToolbarCollapsed } = createSimpleNavigationStores({
	withToolbar: true,
	toolbarCollapsedDefault: false,
});
