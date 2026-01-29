// Local implementation of navigation stores
// Previously imported from @manacore/shared-stores, now inlined to avoid dependency issues

import { browser } from '$app/environment';

// Check if on mobile/tablet width
function checkSidebarMode(): boolean {
	if (!browser) return false;
	return window.innerWidth < 1024;
}

// Create reactive stores using Svelte 5 runes
let _isSidebarMode = $state(checkSidebarMode());
let _isNavCollapsed = $state(false);

// Listen for resize events
if (browser) {
	window.addEventListener('resize', () => {
		_isSidebarMode = checkSidebarMode();
	});
}

export const isSidebarMode = {
	get value() {
		return _isSidebarMode;
	},
};

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
