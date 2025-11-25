<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();

	$effect(() => {
		// Redirect to dashboard if already logged in
		if (data.user) {
			goto('/my');
		}
	});
</script>

{@render children()}
