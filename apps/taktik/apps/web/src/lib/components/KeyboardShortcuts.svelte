<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { timerStore } from '$lib/stores/timer.svelte';

	let {
		onNewEntry,
	}: {
		onNewEntry?: () => void;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		// Don't trigger when typing in inputs
		const target = e.target as HTMLElement;
		if (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT'
		) {
			// Escape still works in inputs
			if (e.key === 'Escape') {
				(target as HTMLInputElement).blur();
			}
			return;
		}

		switch (e.key) {
			case 's':
				e.preventDefault();
				if (timerStore.isRunning) {
					timerStore.stop();
				} else {
					timerStore.start();
				}
				break;
			case 'n':
				e.preventDefault();
				onNewEntry?.();
				break;
			case 'g':
				// g then t = go to timer, g then e = entries, etc.
				break;
			case '?':
				// Show keyboard shortcuts help (future)
				break;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});
</script>
