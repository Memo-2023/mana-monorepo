<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Old route — redirect to city discovery
	// Locations are now at /cities/[slug]/locations/[id]
	onMount(() => {
		goto('/', { replaceState: true });
	});
</script>
