import { createSimpleNavigationStores } from '@manacore/shared-stores';

export const { isNavCollapsed } = createSimpleNavigationStores({
	storageKey: 'mana-games',
});
