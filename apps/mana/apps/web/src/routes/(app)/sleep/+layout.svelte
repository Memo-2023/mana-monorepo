<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';
	import {
		useAllSleepEntries,
		useAllSleepHygieneLogs,
		useAllSleepHygieneChecks,
		useSleepSettings,
	} from '$lib/modules/sleep/queries';

	let { children }: { children: Snippet } = $props();

	setContext('sleepEntries', useAllSleepEntries());
	setContext('sleepHygieneLogs', useAllSleepHygieneLogs());
	setContext('sleepHygieneChecks', useAllSleepHygieneChecks());
	setContext('sleepSettings', useSleepSettings());
</script>

{@render children()}
