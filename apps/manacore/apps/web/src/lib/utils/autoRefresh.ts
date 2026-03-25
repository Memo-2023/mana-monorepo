import { onMount } from 'svelte';

/**
 * Sets up auto-refresh for a widget load function.
 * Calls load() on mount and then every `intervalMs` milliseconds.
 * Pauses when the tab is not visible to save resources.
 *
 * @param load - The data loading function
 * @param intervalMs - Refresh interval in ms (default: 60000 = 1 min)
 */
export function useAutoRefresh(load: () => void | Promise<void>, intervalMs = 60000) {
	onMount(() => {
		load();

		let interval = setInterval(load, intervalMs);

		function handleVisibility() {
			if (document.hidden) {
				clearInterval(interval);
			} else {
				load();
				interval = setInterval(load, intervalMs);
			}
		}

		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});
}
