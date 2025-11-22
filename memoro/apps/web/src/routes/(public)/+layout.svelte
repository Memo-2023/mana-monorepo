<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	// Redirect to dashboard if already authenticated
	onMount(() => {
		if (data.session) {
			goto('/dashboard');
		}
	});
</script>

{@render children?.()}
