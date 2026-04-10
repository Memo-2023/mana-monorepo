<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import DetailView from '$lib/modules/events/views/DetailView.svelte';

	const eventId = $derived($page.params.id ?? '');

	function navigate(viewName: string, navParams: Record<string, unknown> = {}) {
		if (viewName === 'detail' && navParams.eventId) {
			goto(`/events/${navParams.eventId}`);
		} else if (viewName === 'list') {
			goto('/events');
		}
	}

	function goBack() {
		goto('/events');
	}
</script>

<DetailView {navigate} {goBack} params={{ eventId }} />
