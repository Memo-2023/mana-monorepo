/**
 * Minimized Pages Store — Multi-page system with minimized tabs.
 *
 * Allows users to "minimize" views to a tab bar and restore them later.
 */

export interface MinimizedPage {
	id: string;
	title: string;
	icon?: string;
	route?: string;
}

let pages = $state<MinimizedPage[]>([]);
let activePageId = $state<string | null>(null);
let showPicker = $state(false);

export const minimizedPagesStore = {
	get pages() {
		return pages;
	},
	get activePageId() {
		return activePageId;
	},
	get showPicker() {
		return showPicker;
	},

	minimize(page: MinimizedPage) {
		if (!pages.find((p) => p.id === page.id)) {
			pages = [...pages, page];
		}
	},

	restore(id: string) {
		activePageId = id;
	},

	remove(id: string) {
		pages = pages.filter((p) => p.id !== id);
		if (activePageId === id) {
			activePageId = null;
		}
	},

	maximize(id: string) {
		activePageId = id;
	},

	togglePicker() {
		showPicker = !showPicker;
	},

	closePicker() {
		showPicker = false;
	},

	clear() {
		pages = [];
		activePageId = null;
		showPicker = false;
	},
};
