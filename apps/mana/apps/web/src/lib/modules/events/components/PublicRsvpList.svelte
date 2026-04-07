<script lang="ts">
	import { eventsApi, type PublicRsvpRecord } from '../api';
	import { eventGuestsStore } from '../stores/guests.svelte';

	interface Props {
		eventId: string;
		isPublished: boolean;
	}

	let { eventId, isPublished }: Props = $props();

	let rsvps = $state<PublicRsvpRecord[]>([]);
	let loading = $state(false);
	let lastErrorMessage = $state<string | null>(null);
	let consecutiveFailures = $state(0);
	let lastFetchedAt = $state<Date | null>(null);

	// Surface the error only after two failures in a row so a single network
	// hiccup mid-poll doesn't flash a scary banner the user can't act on.
	const showError = $derived(consecutiveFailures >= 2 && lastErrorMessage !== null);

	async function fetchRsvps() {
		if (!isPublished) return;
		loading = true;
		try {
			const res = await eventsApi.getRsvps(eventId);
			rsvps = res.rsvps;
			lastErrorMessage = null;
			consecutiveFailures = 0;
			lastFetchedAt = new Date();
		} catch (e) {
			lastErrorMessage = e instanceof Error ? e.message : 'Fehler beim Laden';
			consecutiveFailures++;
		} finally {
			loading = false;
		}
	}

	// Single source of truth: poll only while published. Cleanup tears down
	// the interval automatically on unmount or when isPublished flips false.
	$effect(() => {
		if (!isPublished) {
			rsvps = [];
			return;
		}
		void fetchRsvps();
		const id = setInterval(fetchRsvps, 30_000);
		return () => clearInterval(id);
	});

	async function importToGuestList(r: PublicRsvpRecord) {
		await eventGuestsStore.addGuest({
			eventId,
			name: r.name,
			email: r.email,
			rsvpStatus: r.status,
			plusOnes: r.plusOnes,
			note: r.note,
		});
	}
</script>

{#if isPublished}
	<div class="public-rsvps">
		<div class="header-row">
			<h3>Antworten via Link</h3>
			<button class="refresh" onclick={fetchRsvps} disabled={loading}>
				{loading ? '…' : 'Neu laden'}
			</button>
		</div>

		{#if showError}
			<p class="error">{lastErrorMessage}</p>
		{:else if rsvps.length === 0 && !loading}
			<p class="empty">Noch keine Antworten via Share-Link.</p>
		{:else}
			<ul class="rsvp-list">
				{#each rsvps as r (r.id)}
					<li class="rsvp-row">
						<div class="info">
							<div class="name-row">
								<span class="name">{r.name}</span>
								<span class="status status-{r.status}">
									{r.status === 'yes' ? 'Ja' : r.status === 'no' ? 'Nein' : 'Vielleicht'}
								</span>
								{#if r.plusOnes > 0}
									<span class="plus">+{r.plusOnes}</span>
								{/if}
							</div>
							{#if r.email}
								<div class="email">{r.email}</div>
							{/if}
							{#if r.note}
								<div class="note">„{r.note}“</div>
							{/if}
						</div>
						<button class="import-btn" onclick={() => importToGuestList(r)} title="Zur Gästeliste">
							→
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if lastFetchedAt}
			<div class="meta">
				Aktualisiert um {lastFetchedAt.toLocaleTimeString('de-DE', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
				})} · Auto-Refresh alle 30s
			</div>
		{/if}
	</div>
{/if}

<style>
	.public-rsvps {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.header-row h3 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.refresh {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		cursor: pointer;
	}
	.refresh:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	.error {
		margin: 0;
		padding: 0.5rem;
		border-radius: 0.375rem;
		background: rgba(239, 68, 68, 0.1);
		color: rgb(220, 38, 38);
		font-size: 0.8125rem;
	}
	.empty {
		margin: 0;
		padding: 0.75rem;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}
	.rsvp-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.rsvp-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
	}
	.info {
		flex: 1;
		min-width: 0;
	}
	.name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.name {
		font-weight: 500;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}
	.status {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}
	.status-yes {
		background: rgba(34, 197, 94, 0.15);
		color: rgb(22, 163, 74);
	}
	.status-no {
		background: rgba(239, 68, 68, 0.15);
		color: rgb(220, 38, 38);
	}
	.status-maybe {
		background: rgba(245, 158, 11, 0.15);
		color: rgb(202, 138, 4);
	}
	.plus {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.email {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.note {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
		margin-top: 0.125rem;
	}
	.import-btn {
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 1rem;
	}
	.import-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
	.meta {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		text-align: right;
	}
</style>
