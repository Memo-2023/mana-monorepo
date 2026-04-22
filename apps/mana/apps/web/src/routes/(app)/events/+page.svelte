<script lang="ts">
	import { goto } from '$app/navigation';
	import ListView from '$lib/modules/events/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';

	function navigate(viewName: string, params: Record<string, unknown> = {}) {
		if (viewName === 'detail' && params.eventId) {
			goto(`/events/${params.eventId}`);
		}
	}

	function goBack() {
		goto('/events');
	}
</script>

<RoutePage appId="events">
	<ListView {navigate} {goBack} params={{}} />
</RoutePage>
