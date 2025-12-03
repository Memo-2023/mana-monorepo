<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { toast } from '$lib/stores/toast';
	import EventForm from '$lib/components/event/EventForm.svelte';
	import type { CalendarEvent, UpdateEventInput } from '@calendar/shared';
	import * as api from '$lib/api/events';

	let event = $state<CalendarEvent | null>(null);
	let loading = $state(true);
	let isEditing = $state(false);

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		const eventId = $page.params.id;
		const result = await api.getEvent(eventId);

		if (result.error) {
			toast.error('Termin nicht gefunden');
			goto('/');
			return;
		}

		event = result.data;
		loading = false;
	});

	async function handleSave(data: UpdateEventInput) {
		if (!event) return;

		const result = await eventsStore.updateEvent(event.id, data);

		if (result.error) {
			toast.error(`Fehler beim Speichern: ${result.error.message}`);
			return;
		}

		toast.success('Termin aktualisiert');
		isEditing = false;
		event = result.data;
	}

	async function handleDelete() {
		if (!event) return;

		if (!confirm('Möchten Sie diesen Termin wirklich löschen?')) {
			return;
		}

		const result = await eventsStore.deleteEvent(event.id);

		if (result.error) {
			toast.error(`Fehler beim Löschen: ${result.error.message}`);
			return;
		}

		toast.success('Termin gelöscht');
		goto('/');
	}

	function handleCancel() {
		if (isEditing) {
			isEditing = false;
		} else {
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>{event?.title || 'Termin'} | Kalender</title>
</svelte:head>

<div class="page-container">
	{#if loading}
		<div class="loading">Laden...</div>
	{:else if event}
		<div class="card">
			<div class="header">
				<h1 class="page-title">{isEditing ? 'Termin bearbeiten' : event.title}</h1>
				{#if !isEditing}
					<div class="actions">
						<button class="btn btn-ghost" onclick={() => (isEditing = true)}> Bearbeiten </button>
						<button class="btn btn-ghost text-destructive" onclick={handleDelete}> Löschen </button>
					</div>
				{/if}
			</div>

			{#if isEditing}
				<EventForm mode="edit" {event} onSave={handleSave} onCancel={handleCancel} />
			{:else}
				<div class="event-details">
					<div class="detail-row">
						<span class="label">Zeit</span>
						<span class="value">
							{#if event.isAllDay}
								Ganztägig
							{:else}
								{new Date(event.startTime).toLocaleString('de-DE')} -
								{new Date(event.endTime).toLocaleString('de-DE')}
							{/if}
						</span>
					</div>

					{#if event.location}
						<div class="detail-row">
							<span class="label">Ort</span>
							<span class="value">{event.location}</span>
						</div>
					{/if}

					{#if event.description}
						<div class="detail-row">
							<span class="label">Beschreibung</span>
							<span class="value">{event.description}</span>
						</div>
					{/if}

					<div class="detail-row">
						<button class="btn btn-ghost" onclick={() => goto('/')}> Zurück zum Kalender </button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: hsl(var(--color-muted-foreground));
	}

	.event-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.value {
		font-size: 1rem;
		color: hsl(var(--color-foreground));
	}

	.text-destructive {
		color: hsl(var(--color-error));
	}
</style>
