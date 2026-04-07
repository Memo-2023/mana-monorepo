<script lang="ts">
	import { useUpcomingEvents, usePastEvents, useGuestsByEvent, summarizeRsvps } from './queries';
	import { eventsStore } from './stores/events.svelte';
	import EventCard from './components/EventCard.svelte';
	import type { SocialEvent } from './types';

	interface Props {
		onOpenEvent?: (id: string) => void;
	}

	let { onOpenEvent }: Props = $props();

	const upcoming = useUpcomingEvents();
	const past = usePastEvents();
	const guestsByEvent = useGuestsByEvent();

	let showCreate = $state(false);
	let newTitle = $state('');
	let newDate = $state('');
	let newTime = $state('19:00');
	let newLocation = $state('');

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		const title = newTitle.trim();
		if (!title || !newDate) return;
		const startTime = new Date(`${newDate}T${newTime || '19:00'}`).toISOString();
		const endTime = new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString();
		const result = await eventsStore.createEvent({
			title,
			startTime,
			endTime,
			location: newLocation.trim() || null,
		});
		if (result.success) {
			newTitle = '';
			newDate = '';
			newLocation = '';
			showCreate = false;
			onOpenEvent?.(result.id);
		}
	}

	function open(event: SocialEvent) {
		onOpenEvent?.(event.id);
	}
</script>

<svelte:head>
	<title>Events - Mana</title>
</svelte:head>

<div class="events-page">
	<header class="events-header">
		<div>
			<h1 class="page-title">Events</h1>
			<p class="page-subtitle">
				{(upcoming.value ?? []).length} bevorstehend · {(past.value ?? []).length} vergangen
			</p>
		</div>
		<button class="new-btn" onclick={() => (showCreate = !showCreate)}>
			{showCreate ? 'Abbrechen' : '+ Neues Event'}
		</button>
	</header>

	{#if showCreate}
		<form class="create-form" onsubmit={handleCreate}>
			<input
				class="input"
				bind:value={newTitle}
				placeholder="Worum geht's? (z. B. Geburtstag Anna)"
				required
			/>
			<div class="form-row">
				<input class="input" type="date" bind:value={newDate} required />
				<input class="input" type="time" bind:value={newTime} />
				<input class="input" bind:value={newLocation} placeholder="Ort (optional)" />
			</div>
			<button type="submit" class="action-btn primary">Event anlegen</button>
		</form>
	{/if}

	<section class="event-section">
		<h2 class="section-title">Bevorstehend</h2>
		{#if (upcoming.value ?? []).length === 0}
			<p class="empty">Keine bevorstehenden Events. Zeit für eine Party?</p>
		{:else}
			<div class="event-list">
				{#each upcoming.value ?? [] as event (event.id)}
					{@const summary = summarizeRsvps(guestsByEvent.value?.get(event.id) ?? [])}
					<EventCard {event} {summary} onclick={() => open(event)} />
				{/each}
			</div>
		{/if}
	</section>

	{#if (past.value ?? []).length > 0}
		<section class="event-section">
			<h2 class="section-title">Vergangen</h2>
			<div class="event-list">
				{#each past.value ?? [] as event (event.id)}
					<EventCard {event} onclick={() => open(event)} />
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.events-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		max-width: 880px;
		margin: 0 auto;
	}
	.events-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	.page-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}
	.page-subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.new-btn {
		padding: 0.5rem 0.875rem;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
	}
	.form-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.form-row .input {
		flex: 1;
		min-width: 8rem;
	}
	.input {
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		font-family: inherit;
	}
	.action-btn {
		padding: 0.5rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		align-self: flex-start;
	}
	.action-btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: transparent;
	}

	.event-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.section-title {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.event-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.empty {
		padding: 1.5rem;
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.625rem;
	}
</style>
