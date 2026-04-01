<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllCalendars, useAllEvents } from '$lib/modules/calendar/queries';
	import { calendarViewStore } from '$lib/modules/calendar/stores/view.svelte';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allCalendars = useAllCalendars();
	const allEvents = useAllEvents();

	// Provide data to child components via Svelte context
	setContext('calendars', allCalendars);
	setContext('calendarEvents', allEvents);

	// Initialize view preferences
	calendarViewStore.initialize();
</script>

{@render children()}
