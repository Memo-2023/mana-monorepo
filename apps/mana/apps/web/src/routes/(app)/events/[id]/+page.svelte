<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import DetailView from '$lib/modules/events/views/DetailView.svelte';

	const eventId = $derived($page.params.id ?? '');

	function handleBack() {
		goto('/events');
	}
</script>

<DetailView {eventId} onBack={handleBack} />
