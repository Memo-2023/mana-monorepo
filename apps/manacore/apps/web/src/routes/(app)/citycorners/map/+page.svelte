<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Old route — redirect to city discovery
	onMount(() => {
		goto('/citycorners', { replaceState: true });
	});
</script>
