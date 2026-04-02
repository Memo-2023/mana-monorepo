<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RedirectSkeleton } from '$lib/components/skeletons';

	// Redirect to main calendar page with event modal
	onMount(() => {
		const eventId = $page.params.id;
		goto(`/?event=${eventId}`, { replaceState: true });
	});
</script>

<RedirectSkeleton />
