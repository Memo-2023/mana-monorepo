<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/times/clock', { replaceState: true });
	});
</script>

<p>Redirecting...</p>
