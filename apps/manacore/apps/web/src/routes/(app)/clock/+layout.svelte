<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllAlarms, useAllTimers, useAllWorldClocks } from '$lib/modules/clock/queries';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allAlarms = useAllAlarms();
	const allTimers = useAllTimers();
	const allWorldClocks = useAllWorldClocks();

	// Provide data to child components via Svelte context
	setContext('alarms', allAlarms);
	setContext('timers', allTimers);
	setContext('worldClocks', allWorldClocks);
</script>

{@render children()}
