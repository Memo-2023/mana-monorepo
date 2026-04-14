<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';
	import { useAllPresets, useAllSessions, useSettings } from '$lib/modules/meditate/queries';

	let { children }: { children: Snippet } = $props();

	setContext('meditatePresets', useAllPresets());
	setContext('meditateSessions', useAllSessions());
	setContext('meditateSettings', useSettings());
</script>

{@render children()}
