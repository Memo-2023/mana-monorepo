<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { getCalendarById, getCalendarColorWithBirthdays } from '$lib/data/queries';
	import type { Calendar } from '@calendar/shared';
	import EventForm from './EventForm.svelte';
	import RecurrenceEditDialog from './RecurrenceEditDialog.svelte';
	import ReminderSelector from './ReminderSelector.svelte';
	import { TagBadge, toastStore as toast, focusTrap } from '@manacore/shared-ui';
	import {
		PencilSimple,
		Trash,
		X,
		Clock,
		ArrowsClockwise,
		Bell,
		MapPin,
		VideoCamera,
		ArrowSquareOut,
		Link,
		TextAlignLeft,
		Tag,
		UsersThree,
	} from '@manacore/shared-icons';
	import type { CalendarEvent, UpdateEventInput, Reminder } from '@calendar/shared';
	import { describeRecurrence, parseRRule } from '@calendar/shared';
	import * as api from '$lib/api/events';
	import * as reminderApi from '$lib/api/reminders';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { toDate } from '$lib/utils/eventDateHelpers';
	import { EventDetailSkeleton } from '$lib/components/skeletons';

	interface Props {
		eventId: string;
		onClose: () => void;
	}

	let { eventId, onClose }: Props = $props();

	// Get calendars from layout context (live query)
	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	let event = $state<CalendarEvent | null>(null);
	let loading = $state(true);
	let isEditing = $state(false);
	let showRecurrenceDialog = $state(false);
	let recurrenceDialogMode = $state<'edit' | 'delete'>('delete');
	let reminders = $state<Reminder[]>([]);

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

		// Load reminders for this event
		const reminderResult = await reminderApi.getReminders(eventId);
		if (reminderResult.data) {
			reminders = Array.isArray(reminderResult.data) ? reminderResult.data : [];
		}
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

		// For recurring events, show the recurrence dialog
		if (event.recurrenceRule || eventsStore.isRecurrenceOccurrence(event.id)) {
			recurrenceDialogMode = 'delete';
			showRecurrenceDialog = true;
			return;
		}

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

	async function handleRecurrenceAction(action: 'this' | 'all' | 'this_and_future') {
		if (!event) return;
		showRecurrenceDialog = false;

		if (recurrenceDialogMode === 'delete') {
			let result;
			if (action === 'this') {
				result = await eventsStore.deleteRecurrenceOccurrence(event.id);
			} else {
				result = await eventsStore.deleteRecurrenceSeries(event.id);
			}
			if (!result.error) onClose();
		}
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
		const start = toDate(event.startTime);
		const end = toDate(event.endTime);
		return `${format(start, 'PPPp', { locale: de })} - ${format(end, 'p', { locale: de })}`;
	}

	// Get calendar info for the event
	let calendarName = $derived(
		event ? getCalendarById(calendarsCtx.value, event!.calendarId)?.name : undefined
	);
	let calendarColor = $derived(
		event ? getCalendarColorWithBirthdays(calendarsCtx.value, event.calendarId) : '#3b82f6'
	);

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

<RecurrenceEditDialog
	visible={showRecurrenceDialog}
	mode={recurrenceDialogMode}
	onSelect={handleRecurrenceAction}
	onCancel={() => (showRecurrenceDialog = false)}
/>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
	<div
		class="modal-container"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		use:focusTrap
	>
		{#if loading}
			<div aria-live="polite" aria-label="Laden...">
				<EventDetailSkeleton />
			</div>
		{:else if event}
			<div class="modal-header">
				<h2 id="modal-title" class="modal-title">
					{isEditing ? 'Termin bearbeiten' : event.title}
				</h2>
				<div class="modal-actions">
					{#if !isEditing}
						<button class="btn btn-ghost" onclick={() => (isEditing = true)}>
							<PencilSimple size={16} />
							Bearbeiten
						</button>
						<button class="btn btn-ghost text-destructive" onclick={handleDelete}>
							<Trash size={16} />
							Löschen
						</button>
					{/if}
					<button class="btn btn-ghost btn-close" onclick={onClose} aria-label="Schließen">
						<X size={20} />
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
								<Clock size={20} />
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
									<ArrowsClockwise size={20} />
								</span>
								<div class="detail-content">
									<span class="detail-label">Wiederholung</span>
									<span class="detail-value">{formatRecurrence(event.recurrenceRule)}</span>
								</div>
							</div>
						{/if}

						<!-- Erinnerungen -->
						<div class="detail-row">
							<span class="detail-icon">
								<Bell size={20} />
							</span>
							<div class="detail-content" style="flex: 1;">
								<ReminderSelector
									eventId={event.id}
									{reminders}
									onRemindersChange={async () => {
										const result = await reminderApi.getReminders(eventId);
										if (result.data) {
											reminders = Array.isArray(result.data) ? result.data : [];
										}
									}}
								/>
							</div>
						</div>

						<!-- Ort -->
						{#if event.location || event.metadata?.locationDetails}
							<div class="detail-row">
								<span class="detail-icon">
									<MapPin size={20} />
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
									<VideoCamera size={20} />
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
										<ArrowSquareOut size={14} />
									</a>
								</div>
							</div>
						{/if}

						<!-- Event-URL -->
						{#if event.metadata?.url}
							<div class="detail-row">
								<span class="detail-icon">
									<Link size={20} />
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
										<ArrowSquareOut size={14} />
									</a>
								</div>
							</div>
						{/if}

						<!-- Beschreibung -->
						{#if event.description}
							<div class="detail-row">
								<span class="detail-icon">
									<TextAlignLeft size={20} />
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
									<Tag size={20} />
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
									<UsersThree size={20} />
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
