<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();

	$effect(() => {
		if (data.session) {
			goto('/dashboard');
		}
	});
</script>

{@render children()}
