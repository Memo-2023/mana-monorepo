<script lang="ts">
	import { getContext } from 'svelte';
	import { eventsStore } from '../stores/events.svelte';
	import { getCalendarById, getCalendarColor } from '../queries';
	import type { Calendar, CalendarEvent } from '../types';
	import EventForm from './EventForm.svelte';
	import { toDate } from '../utils/event-date-helpers';
	import {
		PencilSimple,
		Trash,
		X,
		Clock,
		ArrowsClockwise,
		MapPin,
		TextAlignLeft,
	} from '@manacore/shared-icons';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		event: CalendarEvent;
		onClose: () => void;
	}

	let { event, onClose }: Props = $props();

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	let isEditing = $state(false);

	let calendarName = $derived(getCalendarById(calendarsCtx.value, event.calendarId)?.name);
	let calendarColor = $derived(getCalendarColor(calendarsCtx.value, event.calendarId));

	function formatEventTime(ev: CalendarEvent): string {
		if (ev.isAllDay) return 'Ganztägig';
		const start = toDate(ev.startTime);
		const end = toDate(ev.endTime);
		return `${format(start, 'PPPp', { locale: de })} - ${format(end, 'p', { locale: de })}`;
	}

	function formatRecurrence(rule: string): string {
		if (!rule) return '';
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

	async function handleSave(data: Parameters<typeof eventsStore.updateEvent>[1]) {
		await eventsStore.updateEvent(event.id, data);
		isEditing = false;
	}

	async function handleDelete() {
		if (!confirm('Möchten Sie diesen Termin wirklich löschen?')) return;
		await eventsStore.deleteEvent(event.id);
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
	<div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
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
				<EventForm
					mode="edit"
					{event}
					onSave={(data) => handleSave(data)}
					onCancel={() => (isEditing = false)}
				/>
			{:else}
				<div class="event-details">
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

					<div class="detail-row">
						<span class="detail-icon"><Clock size={20} /></span>
						<div class="detail-content">
							<span class="detail-label">Zeit</span>
							<span class="detail-value">{formatEventTime(event)}</span>
						</div>
					</div>

					{#if event.recurrenceRule}
						<div class="detail-row">
							<span class="detail-icon"><ArrowsClockwise size={20} /></span>
							<div class="detail-content">
								<span class="detail-label">Wiederholung</span>
								<span class="detail-value">{formatRecurrence(event.recurrenceRule)}</span>
							</div>
						</div>
					{/if}

					{#if event.location}
						<div class="detail-row">
							<span class="detail-icon"><MapPin size={20} /></span>
							<div class="detail-content">
								<span class="detail-label">Ort</span>
								<span class="detail-value">{event.location}</span>
							</div>
						</div>
					{/if}

					{#if event.description}
						<div class="detail-row">
							<span class="detail-icon"><TextAlignLeft size={20} /></span>
							<div class="detail-content">
								<span class="detail-label">Beschreibung</span>
								<span class="detail-value description">{event.description}</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
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
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg, 12px);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
		border-radius: var(--radius-md, 8px);
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
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.text-destructive:hover {
		background: hsl(var(--color-error, 0 84% 60%) / 0.1);
	}

	.calendar-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: inline-block;
		margin-top: 4px;
	}
</style>
