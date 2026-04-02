const DEBUG_KEY = 'manacore:debug-mode';

function createDebugStore() {
	let enabled = $state(
		typeof localStorage !== 'undefined' ? localStorage.getItem(DEBUG_KEY) === 'true' : false
	);

	return {
		get enabled() {
			return enabled;
		},
		toggle() {
			enabled = !enabled;
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(DEBUG_KEY, String(enabled));
			}
		},
	};
}

export const debugStore = createDebugStore();
