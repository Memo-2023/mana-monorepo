<script lang="ts">
	import { goto } from '$app/navigation';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { toast } from '$lib/stores/toast';
	import EventForm from './EventForm.svelte';
	import { TagBadge } from '@manacore/shared-ui';
	import type { CalendarEvent, UpdateEventInput } from '@calendar/shared';
	import * as api from '$lib/api/events';
	import { format, parseISO } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { EventDetailSkeleton } from '$lib/components/skeletons';

	interface Props {
		eventId: string;
		onClose: () => void;
	}

	let { eventId, onClose }: Props = $props();

	let event = $state<CalendarEvent | null>(null);
	let loading = $state(true);
	let isEditing = $state(false);

	// Load event data
	$effect(() => {
		loadEvent();
	});

	async function loadEvent() {
		loading = true;
		const result = await api.getEvent(eventId);

		if (result.error || !result.data) {
			toast.error('Termin nicht gefunden');
			onClose();
			return;
		}

		event = result.data;
		loading = false;
	}

	async function handleSave(data: UpdateEventInput) {
		if (!event) return;

		const result = await eventsStore.updateEvent(event.id, data);

		if (result.error) {
			toast.error(`Fehler beim Speichern: ${result.error.message}`);
			return;
		}

		toast.success('Termin aktualisiert');
		isEditing = false;
		// Reload event to get updated data
		await loadEvent();
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
		onClose();
	}

	function handleCancel() {
		if (isEditing) {
			isEditing = false;
		} else {
			onClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function formatEventTime(event: CalendarEvent): string {
		if (event.isAllDay) {
			return 'Ganztägig';
		}
		const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
		const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
		return `${format(start, 'PPPp', { locale: de })} - ${format(end, 'p', { locale: de })}`;
	}

	// Get calendar info for the event
	let calendarName = $derived(
		event ? calendarsStore.calendars.find((c) => c.id === event!.calendarId)?.name : undefined
	);
	let calendarColor = $derived(event ? calendarsStore.getColor(event.calendarId) : '#3b82f6');

	// Format recurrence rule to human readable text
	function formatRecurrence(rule: string): string {
		if (!rule) return '';
		// Basic RRULE parsing
		if (rule.includes('FREQ=DAILY')) return 'Täglich';
		if (rule.includes('FREQ=WEEKLY')) {
			if (rule.includes('BYDAY=')) {
				const days = rule.match(/BYDAY=([A-Z,]+)/)?.[1];
				if (days) {
					const dayMap: Record<string, string> = {
						MO: 'Mo',
						TU: 'Di',
						WE: 'Mi',
						TH: 'Do',
						FR: 'Fr',
						SA: 'Sa',
						SU: 'So',
					};
					const translatedDays = days
						.split(',')
						.map((d) => dayMap[d] || d)
						.join(', ');
					return `Wöchentlich (${translatedDays})`;
				}
			}
			return 'Wöchentlich';
		}
		if (rule.includes('FREQ=MONTHLY')) return 'Monatlich';
		if (rule.includes('FREQ=YEARLY')) return 'Jährlich';
		return 'Wiederkehrend';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_to_interactive_role -->
<div class="modal-backdrop" onclick={handleBackdropClick} role="button" tabindex="-1">
	<div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		{#if loading}
			<EventDetailSkeleton />
		{:else if event}
			<div class="modal-header">
				<h2 id="modal-title" class="modal-title">
					{isEditing ? 'Termin bearbeiten' : event.title}
				</h2>
				<div class="modal-actions">
					{#if !isEditing}
						<button class="btn btn-ghost" onclick={() => (isEditing = true)}>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
								/>
							</svg>
							Bearbeiten
						</button>
						<button class="btn btn-ghost text-destructive" onclick={handleDelete}>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Löschen
						</button>
					{/if}
					<button class="btn btn-ghost btn-close" onclick={onClose} aria-label="Schließen">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<div class="modal-content">
				{#if isEditing}
					<EventForm mode="edit" {event} onSave={handleSave} onCancel={handleCancel} />
				{:else}
					<div class="event-details">
						<!-- Kalender -->
						{#if calendarName}
							<div class="detail-row">
								<span class="detail-icon">
									<span class="calendar-dot" style="background-color: {calendarColor}"></span>
								</span>
								<div class="detail-content">
									<span class="detail-label">Kalender</span>
									<span class="detail-value">{calendarName}</span>
								</div>
							</div>
						{/if}

						<!-- Zeit -->
						<div class="detail-row">
							<span class="detail-icon">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</span>
							<div class="detail-content">
								<span class="detail-label">Zeit</span>
								<span class="detail-value">{formatEventTime(event)}</span>
							</div>
						</div>

						<!-- Wiederholung -->
						{#if event.recurrenceRule}
							<div class="detail-row">
								<span class="detail-icon">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
								</span>
								<div class="detail-content">
									<span class="detail-label">Wiederholung</span>
									<span class="detail-value">{formatRecurrence(event.recurrenceRule)}</span>
								</div>
							</div>
						{/if}

						<!-- Ort -->
						{#if event.location || event.metadata?.locationDetails}
							<div class="detail-row">
								<span class="detail-icon">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</span>
								<div class="detail-content">
									<span class="detail-label">Ort</span>
									{#if event.location}
										<span class="detail-value">{event.location}</span>
									{/if}
									{#if event.metadata?.locationDetails}
										{@const loc = event.metadata.locationDetails}
										<div class="address-details">
											{#if loc.street}
												<span class="address-line">{loc.street}</span>
											{/if}
											{#if loc.postalCode || loc.city}
												<span class="address-line">
													{loc.postalCode ? loc.postalCode + ' ' : ''}{loc.city || ''}
												</span>
											{/if}
											{#if loc.country}
												<span class="address-line">{loc.country}</span>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Videokonferenz -->
						{#if event.metadata?.conferenceUrl}
							<div class="detail-row">
								<span class="detail-icon">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
								</span>
								<div class="detail-content">
									<span class="detail-label">Videokonferenz</span>
									<a
										href={event.metadata.conferenceUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="detail-link"
									>
										Beitreten
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
											/>
										</svg>
									</a>
								</div>
							</div>
						{/if}

						<!-- Event-URL -->
						{#if event.metadata?.url}
							<div class="detail-row">
								<span class="detail-icon">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
										/>
									</svg>
								</span>
								<div class="detail-content">
									<span class="detail-label">Link</span>
									<a
										href={event.metadata.url}
										target="_blank"
										rel="noopener noreferrer"
										class="detail-link"
									>
										{new URL(event.metadata.url).hostname}
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
											/>
										</svg>
									</a>
								</div>
							</div>
						{/if}

						<!-- Beschreibung -->
						{#if event.description}
							<div class="detail-row">
								<span class="detail-icon">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 6h16M4 12h16M4 18h7"
										/>
									</svg>
								</span>
								<div class="detail-content">
									<span class="detail-label">Beschreibung</span>
									<span class="detail-value description">{event.description}</span>
								</div>
							</div>
						{/if}

						<!-- Tags -->
						{#if event.tags && event.tags.length > 0}
							<div class="detail-row">
								<span class="detail-icon">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
										/>
									</svg>
								</span>
								<div class="detail-content">
									<span class="detail-label">Tags</span>
									<div class="tags-display">
										{#each event.tags as tag (tag.id)}
											<TagBadge tag={{ name: tag.name, color: tag.color }} />
										{/each}
									</div>
								</div>
							</div>
						{/if}

						<!-- Teilnehmer -->
						{#if event.metadata?.attendees && event.metadata.attendees.length > 0}
							<div class="detail-row">
								<span class="detail-icon">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
										/>
									</svg>
								</span>
								<div class="detail-content">
									<span class="detail-label">Teilnehmer ({event.metadata.attendees.length})</span>
									<div class="attendees-list">
										{#each event.metadata.attendees as attendee}
											<div class="attendee">
												<span class="attendee-name">{attendee.name || attendee.email}</span>
												{#if attendee.status}
													<span
														class="attendee-status"
														class:accepted={attendee.status === 'accepted'}
														class:declined={attendee.status === 'declined'}
														class:tentative={attendee.status === 'tentative'}
													>
														{attendee.status === 'accepted'
															? '✓'
															: attendee.status === 'declined'
																? '✗'
																: '?'}
													</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
		animation: fade-in 150ms ease;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-container {
		background: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		animation: slide-up 200ms ease;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		gap: 1rem;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.modal-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem;
	}

	.event-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.detail-row {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.detail-icon {
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.detail-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.detail-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
	}

	.detail-value.description {
		white-space: pre-wrap;
		line-height: 1.5;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
	}

	.btn-ghost {
		background: transparent;
		color: hsl(var(--color-foreground));
	}

	.btn-ghost:hover {
		background: hsl(var(--color-muted));
	}

	.btn-close {
		padding: 0.5rem;
	}

	.text-destructive {
		color: hsl(var(--color-error));
	}

	.text-destructive:hover {
		background: hsl(var(--color-error) / 0.1);
	}

	/* Calendar dot */
	.calendar-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: inline-block;
		margin-top: 4px;
	}

	/* Links */
	.detail-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--color-primary));
		text-decoration: none;
		font-size: 0.9375rem;
	}

	.detail-link:hover {
		text-decoration: underline;
	}

	/* Attendees */
	.attendees-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}

	.attendee {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.attendee-name {
		color: hsl(var(--color-foreground));
	}

	.attendee-status {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}

	.attendee-status.accepted {
		background: hsl(var(--color-success) / 0.15);
		color: hsl(var(--color-success));
	}

	.attendee-status.declined {
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
	}

	.attendee-status.tentative {
		background: hsl(var(--color-warning) / 0.15);
		color: hsl(var(--color-warning));
	}

	/* Address details */
	.address-details {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		margin-top: 0.25rem;
		padding-left: 0.5rem;
		border-left: 2px solid hsl(var(--color-border));
	}

	.address-line {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Tags display */
	.tags-display {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
</style>
