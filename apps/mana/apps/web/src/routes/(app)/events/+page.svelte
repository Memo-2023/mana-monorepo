<script lang="ts">
	import { goto } from '$app/navigation';
	import ListView from '$lib/modules/events/ListView.svelte';

	function handleOpen(id: string) {
		goto(`/events/${id}`);
	}
</script>

<ListView onOpenEvent={handleOpen} />
