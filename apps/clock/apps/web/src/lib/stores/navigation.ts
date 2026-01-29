import { createSimpleNavigationStores } from '@manacore/shared-stores';

export const { isSidebarMode, isNavCollapsed } = createSimpleNavigationStores({
	storageKey: 'clock',
});
