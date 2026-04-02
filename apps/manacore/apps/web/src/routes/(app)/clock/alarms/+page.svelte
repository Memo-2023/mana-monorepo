<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/times/clock/alarms', { replaceState: true });
	});
</script>

<p>Redirecting...</p>
