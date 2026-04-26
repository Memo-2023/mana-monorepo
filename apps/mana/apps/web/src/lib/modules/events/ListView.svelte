<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { useUpcomingEvents, usePastEvents, useGuestsByEvent, summarizeRsvps } from './queries';
	import { eventsStore } from './stores/events.svelte';
	import { drainTombstones } from './tombstones';
	import EventCard from './components/EventCard.svelte';
	import DiscoveryTab from './components/DiscoveryTab.svelte';
	import type { SocialEvent } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	const upcoming = useUpcomingEvents();
	const past = usePastEvents();
	const guestsByEvent = useGuestsByEvent();

	let activeTab = $state<'mine' | 'discover'>('mine');

	// Retry any orphaned server snapshots from previous failed deletes.
	onMount(() => {
		void drainTombstones();
	});

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
			open({ id: result.id } as SocialEvent);
		}
	}

	function open(event: SocialEvent) {
		const ids = [...(upcoming.value ?? []), ...(past.value ?? [])].map((e) => e.id);
		navigate('detail', {
			eventId: event.id,
			_siblingIds: ids,
			_siblingKey: 'eventId',
		});
	}
</script>

<svelte:head>
	<title>{$_('events.list_view.doc_title')}</title>
</svelte:head>

<div class="events-page">
	<div class="tab-bar">
		<button class="tab" class:active={activeTab === 'mine'} onclick={() => (activeTab = 'mine')}>
			{$_('events.list_view.tab_mine')}
		</button>
		<button
			class="tab"
			class:active={activeTab === 'discover'}
			onclick={() => (activeTab = 'discover')}
		>
			{$_('events.list_view.tab_discover')}
		</button>
	</div>

	{#if activeTab === 'mine'}
		<header class="events-header">
			<p class="page-subtitle">
				{$_('events.list_view.subtitle_count', {
					values: {
						upcoming: (upcoming.value ?? []).length,
						past: (past.value ?? []).length,
					},
				})}
			</p>
			<button class="new-btn" onclick={() => (showCreate = !showCreate)}>
				{showCreate ? $_('events.list_view.cancel_btn') : $_('events.list_view.new_event_btn')}
			</button>
		</header>

		{#if showCreate}
			<form class="create-form" onsubmit={handleCreate}>
				<input
					class="input"
					bind:value={newTitle}
					placeholder={$_('events.list_view.placeholder_title')}
					required
				/>
				<div class="form-row">
					<input class="input" type="date" bind:value={newDate} required />
					<input class="input" type="time" bind:value={newTime} />
					<input
						class="input"
						bind:value={newLocation}
						placeholder={$_('events.list_view.placeholder_location')}
					/>
				</div>
				<button type="submit" class="action-btn primary">
					{$_('events.list_view.submit_create')}
				</button>
			</form>
		{/if}

		<section class="event-section">
			<h2 class="section-title">{$_('events.list_view.section_upcoming')}</h2>
			{#if (upcoming.value ?? []).length === 0}
				<p class="empty">{$_('events.list_view.empty_upcoming')}</p>
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
				<h2 class="section-title">{$_('events.list_view.section_past')}</h2>
				<div class="event-list">
					{#each past.value ?? [] as event (event.id)}
						<EventCard {event} onclick={() => open(event)} />
					{/each}
				</div>
			</section>
		{/if}
	{:else}
		<DiscoveryTab />
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
	.tab-bar {
		display: flex;
		gap: 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.tab {
		padding: 0.5rem 1rem;
		border: none;
		background: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		font-family: inherit;
	}
	.tab.active {
		color: hsl(var(--color-foreground));
		border-bottom-color: hsl(var(--color-primary));
	}
	.tab:hover:not(.active) {
		color: hsl(var(--color-foreground));
	}
	.events-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
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
