<script lang="ts">
	import { formatDateTime } from '$lib/i18n/format';
	import { useEvent, useEventGuests, summarizeRsvps } from '../queries';
	import { eventsStore } from '../stores/events.svelte';
	import GuestListEditor from '../components/GuestListEditor.svelte';
	import RsvpSummaryView from '../components/RsvpSummary.svelte';
	import PublicRsvpList from '../components/PublicRsvpList.svelte';
	import BringListEditor from '../components/BringListEditor.svelte';
	import type { ViewProps } from '$lib/app-registry';
	import { searchAddress, formatAddress, type GeocodingResult } from '$lib/geocoding';
	import { MapPin } from '@mana/shared-icons';

	let { navigate, goBack, params }: ViewProps = $props();

	let eventId = $derived((params.eventId as string) ?? '');

	const eventQuery = useEvent(() => eventId);
	const guests = useEventGuests(() => eventId);
	const summary = $derived(summarizeRsvps(guests.value ?? []));
	const event = $derived(eventQuery.value);

	// Self-heal: if a previous edit failed to push its snapshot to the
	// server (fire-and-forget can lose writes), opening the detail view
	// re-pushes the current state. Idempotent and cheap.
	let lastHealedId: string | null = null;
	$effect(() => {
		if (event?.isPublished && event.id !== lastHealedId) {
			lastHealedId = event.id;
			void eventsStore.syncSnapshotIfPublished(event.id);
		}
	});

	let editing = $state(false);
	let titleDraft = $state('');
	let descDraft = $state('');
	let locationDraft = $state('');
	let locationLatDraft = $state<number | null>(null);
	let locationLonDraft = $state<number | null>(null);
	let startDraft = $state('');
	let endDraft = $state('');
	let allDayDraft = $state(false);

	// Address autocomplete state
	let addressSuggestions = $state<GeocodingResult[]>([]);
	let showAddressSuggestions = $state(false);
	let addressDebounce: ReturnType<typeof setTimeout> | undefined;

	function startEdit() {
		if (!event) return;
		titleDraft = event.title;
		descDraft = event.description ?? '';
		locationDraft = event.location ?? '';
		locationLatDraft = event.locationLat;
		locationLonDraft = event.locationLon;
		startDraft = toLocalDatetime(event.startTime);
		endDraft = toLocalDatetime(event.endTime);
		allDayDraft = event.isAllDay;
		editing = true;
	}

	function onLocationInput() {
		clearTimeout(addressDebounce);
		// User is typing a custom location — clear coordinates until they pick a suggestion
		if (locationDraft !== event?.location) {
			locationLatDraft = null;
			locationLonDraft = null;
		}
		if (locationDraft.trim().length < 2) {
			addressSuggestions = [];
			showAddressSuggestions = false;
			return;
		}
		addressDebounce = setTimeout(async () => {
			addressSuggestions = await searchAddress(locationDraft, { limit: 5 });
			showAddressSuggestions = addressSuggestions.length > 0;
		}, 300);
	}

	function selectAddressSuggestion(result: GeocodingResult) {
		showAddressSuggestions = false;
		const addr = formatAddress(result.address);
		locationDraft = result.name ? `${result.name}${addr ? ', ' + addr : ''}` : addr || result.label;
		locationLatDraft = result.latitude;
		locationLonDraft = result.longitude;
	}

	function onLocationBlur() {
		// Delay so suggestion clicks register first
		setTimeout(() => {
			showAddressSuggestions = false;
		}, 200);
	}

	async function saveEdit() {
		if (!event) return;
		await eventsStore.updateEvent(event.id, {
			title: titleDraft,
			description: descDraft || null,
			location: locationDraft || null,
			locationLat: locationLatDraft,
			locationLon: locationLonDraft,
			startTime: fromLocalDatetime(startDraft),
			endTime: fromLocalDatetime(endDraft),
			isAllDay: allDayDraft,
		});
		editing = false;
	}

	let mapUrl = $derived.by(() => {
		if (!event?.locationLat || !event?.locationLon) return '';
		const lat = event.locationLat;
		const lng = event.locationLon;
		const bbox = `${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}`;
		return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
	});

	function toLocalDatetime(iso: string): string {
		const d = new Date(iso);
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function fromLocalDatetime(local: string): string {
		return new Date(local).toISOString();
	}

	async function handlePublish() {
		if (!event) return;
		if (event.isPublished) {
			await eventsStore.unpublishEvent(event.id);
		} else {
			await eventsStore.publishEvent(event.id);
		}
	}

	async function handleDelete() {
		if (!event) return;
		if (!confirm(`Event "${event.title}" wirklich löschen?`)) return;
		await eventsStore.deleteEvent(event.id);
		goBack();
	}

	function copyShareLink() {
		if (!event?.publicToken) return;
		const url = `${window.location.origin}/rsvp/${event.publicToken}`;
		navigator.clipboard.writeText(url);
	}
</script>

{#if !event}
	<div class="loading">Lade Event...</div>
{:else}
	<div class="detail">
		<header class="detail-header">
			<button class="back-btn" onclick={goBack}>← Zurück</button>
			<div class="header-actions">
				<button class="action-btn" onclick={startEdit}>Bearbeiten</button>
				<button class="action-btn danger" onclick={handleDelete}>Löschen</button>
			</div>
		</header>

		{#if editing}
			<div class="edit-form">
				<input class="title-input" bind:value={titleDraft} placeholder="Event-Titel" />
				<textarea class="desc-input" bind:value={descDraft} rows="3" placeholder="Beschreibung"
				></textarea>
				<div class="loc-wrapper">
					<input
						class="loc-input"
						bind:value={locationDraft}
						oninput={onLocationInput}
						onblur={onLocationBlur}
						onfocus={() => {
							if (addressSuggestions.length > 0) showAddressSuggestions = true;
						}}
						placeholder="Ort — tippe eine Adresse..."
					/>
					{#if locationLatDraft && locationLonDraft}
						<span class="loc-pinned" title="Koordinaten gesetzt">
							<MapPin size={12} weight="fill" />
						</span>
					{/if}
					{#if showAddressSuggestions}
						<div class="loc-suggestions">
							{#each addressSuggestions as result}
								<button
									type="button"
									class="loc-suggestion"
									onclick={() => selectAddressSuggestion(result)}
								>
									<MapPin size={12} />
									<div class="loc-suggestion-text">
										<span class="loc-suggestion-name">{result.name || result.label}</span>
										<span class="loc-suggestion-addr">{formatAddress(result.address)}</span>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<div class="time-row">
					<label>
						<span>Start</span>
						<input type="datetime-local" bind:value={startDraft} />
					</label>
					<label>
						<span>Ende</span>
						<input type="datetime-local" bind:value={endDraft} />
					</label>
					<label class="all-day">
						<input type="checkbox" bind:checked={allDayDraft} />
						<span>Ganztägig</span>
					</label>
				</div>
				<div class="form-actions">
					<button class="action-btn" onclick={() => (editing = false)}>Abbrechen</button>
					<button class="action-btn primary" onclick={saveEdit}>Speichern</button>
				</div>
			</div>
		{:else}
			<div class="event-meta">
				<h1 class="title">{event.title}</h1>
				<div class="meta-row">
					<span class="when">
						{formatDateTime(new Date(event.startTime), {
							weekday: 'long',
							day: '2-digit',
							month: 'long',
							year: 'numeric',
							hour: event.isAllDay ? undefined : '2-digit',
							minute: event.isAllDay ? undefined : '2-digit',
						})}
					</span>
					{#if event.location}
						<span class="where">📍 {event.location}</span>
					{/if}
				</div>
				{#if event.description}
					<p class="description">{event.description}</p>
				{/if}
				{#if mapUrl}
					<div class="event-map">
						<iframe
							title="Event-Ort auf Karte"
							src={mapUrl}
							width="100%"
							height="180"
							frameborder="0"
							loading="lazy"
						></iframe>
						<a
							class="map-open-link"
							href={`https://www.openstreetmap.org/?mlat=${event.locationLat}&mlon=${event.locationLon}#map=17/${event.locationLat}/${event.locationLon}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							In OpenStreetMap öffnen →
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<section class="section">
			<h2>RSVPs</h2>
			<RsvpSummaryView {summary} capacity={event.capacity} />
		</section>

		<section class="section">
			<h2>Gäste</h2>
			<GuestListEditor eventId={event.id} />
		</section>

		<section class="section">
			<h2>Bring-Liste</h2>
			<BringListEditor eventId={event.id} />
		</section>

		{#if event.isPublished}
			<section class="section">
				<PublicRsvpList eventId={event.id} isPublished={event.isPublished} />
			</section>
		{/if}

		<section class="section">
			<h2>Teilen</h2>
			{#if event.isPublished && event.publicToken}
				<div class="share-row">
					<code class="share-link">{window.location.origin}/rsvp/{event.publicToken}</code>
					<button class="action-btn" onclick={copyShareLink}>Kopieren</button>
					<button class="action-btn" onclick={handlePublish}>Privat machen</button>
				</div>
				<p class="share-hint">
					Antworten erscheinen automatisch unten in „Antworten via Link“ (Polling alle 30s).
				</p>
			{:else}
				<button class="action-btn primary" onclick={handlePublish}>
					Event veröffentlichen & Link generieren
				</button>
			{/if}
		</section>
	</div>
{/if}

<style>
	.detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		max-width: 720px;
		margin: 0 auto;
	}
	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.back-btn {
		background: none;
		border: none;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		padding: 0.25rem 0;
	}
	.header-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.action-btn:hover {
		background: hsl(var(--color-muted));
	}
	.action-btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: transparent;
	}
	.action-btn.danger {
		color: rgb(220, 38, 38);
	}

	.event-meta {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.title {
		margin: 0;
		font-size: 1.875rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}
	.meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.description {
		margin: 0;
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		white-space: pre-wrap;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.section h2 {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.title-input,
	.desc-input,
	.loc-wrapper {
		position: relative;
	}
	.loc-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		font-family: inherit;
	}
	.loc-pinned {
		position: absolute;
		right: 0.625rem;
		top: 50%;
		transform: translateY(-50%);
		color: #0ea5e9;
		pointer-events: none;
	}
	.loc-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.25rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 50;
		overflow: hidden;
	}
	.loc-suggestion {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		width: 100%;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		text-align: left;
	}
	.loc-suggestion:hover {
		background: hsl(var(--color-muted));
	}
	.loc-suggestion + .loc-suggestion {
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}
	.loc-suggestion-text {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 0;
	}
	.loc-suggestion-name {
		font-size: 0.8125rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.loc-suggestion-addr {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.event-map {
		margin-top: 0.75rem;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid hsl(var(--color-border));
	}
	.event-map iframe {
		display: block;
	}
	.map-open-link {
		display: block;
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
		text-align: right;
		background: hsl(var(--color-muted));
	}
	.map-open-link:hover {
		color: #0ea5e9;
	}
	.title-input {
		font-size: 1.25rem;
		font-weight: 600;
	}
	.time-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: end;
	}
	.time-row label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.time-row input[type='datetime-local'] {
		padding: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
	}
	.all-day {
		flex-direction: row !important;
		align-items: center;
		gap: 0.375rem !important;
		padding-bottom: 0.5rem;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.share-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}
	.share-link {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		font-size: 0.8125rem;
		font-family: ui-monospace, monospace;
		color: hsl(var(--color-foreground));
		overflow-x: auto;
		white-space: nowrap;
	}
	.share-hint {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	.loading {
		padding: 2rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
	}
</style>
