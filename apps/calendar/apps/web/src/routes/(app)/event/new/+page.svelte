<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { toast } from '$lib/stores/toast';
	import EventForm from '$lib/components/event/EventForm.svelte';
	import type { CreateEventInput, UpdateEventInput } from '@calendar/shared';
	import { addHours, parseISO } from 'date-fns';

	let initialStart = $state<Date | null>(null);

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Check for start time in URL params
		const startParam = $page.url.searchParams.get('start');
		if (startParam) {
			initialStart = parseISO(startParam);
		}
	});

	async function handleSave(data: CreateEventInput | UpdateEventInput) {
		// In create mode, data is always CreateEventInput
		const result = await eventsStore.createEvent(data as CreateEventInput);

		if (result.error) {
			toast.error(`Fehler beim Erstellen: ${result.error.message}`);
			return;
		}

		toast.success('Termin erstellt');
		goto('/');
	}

	function handleCancel() {
		goto('/');
	}
</script>

<svelte:head>
	<title>Neuer Termin | Kalender</title>
</svelte:head>

<div class="page-container">
	<div class="card">
		<h1 class="page-title">Neuer Termin</h1>
		<EventForm
			mode="create"
			initialStartTime={initialStart}
			onSave={handleSave}
			onCancel={handleCancel}
		/>
	</div>
</div>

<style>
	.page-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: hsl(var(--color-foreground));
	}
</style>
