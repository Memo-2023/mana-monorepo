<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { timerStore } from '$lib/modules/times/stores/timer.svelte';

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
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});
</script>
