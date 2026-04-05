// Local implementation of navigation stores
// Previously imported from @mana/shared-stores, now inlined to avoid dependency issues

import { browser } from '$app/environment';

// Create reactive stores using Svelte 5 runes
let _isNavCollapsed = $state(false);

export const isNavCollapsed = {
	get value() {
		return _isNavCollapsed;
	},
	toggle() {
		_isNavCollapsed = !_isNavCollapsed;
	},
	set(value: boolean) {
		_isNavCollapsed = value;
	},
};
