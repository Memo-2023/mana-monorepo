<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllNotes } from '$lib/modules/notes/queries';

	let { children }: { children: Snippet } = $props();

	const allNotes = useAllNotes();
	setContext('notes', allNotes);
</script>

{@render children()}
