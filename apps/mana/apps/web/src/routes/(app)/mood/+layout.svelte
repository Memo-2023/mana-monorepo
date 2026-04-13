<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';
	import { useAllMoodEntries, useMoodSettings } from '$lib/modules/mood/queries';

	let { children }: { children: Snippet } = $props();

	setContext('moodEntries', useAllMoodEntries());
	setContext('moodSettings', useMoodSettings());
</script>

{@render children()}
