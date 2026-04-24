<script lang="ts">
	import { getDateFnsLocale } from '$lib/i18n/format';
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
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
		Tag,
		ShareNetwork,
		Copy,
		Check,
	} from '@mana/shared-icons';
	import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
	interface Props {
		event: CalendarEvent;
		onClose: () => void;
	}

	let { event, onClose }: Props = $props();

	async function handleVisibilityChange(next: VisibilityLevel) {
		await eventsStore.setVisibility(event.id, next);
	}

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	let isEditing = $state(false);
	let showDeleteOptions = $state(false);
	let showEditOptions = $state(false);
	let editMode = $state<'single' | 'all' | null>(null);
	let copied = $state(false);

	let calendarName = $derived(
		event.calendarId === '__external__'
			? event.sourceModule
			: getCalendarById(calendarsCtx.value, event.calendarId)?.name
	);
	let calendarColor = $derived(
		event.calendarId === '__external__'
			? event.color || '#6b7280'
			: getCalendarColor(calendarsCtx.value, event.calendarId)
	);
	let isRecurring = $derived(!!event.recurrenceRule);
	let hasParent = $derived(!!event.parentEventId || !!event.parentBlockId);

	// Format time display
	function formatEventTime(ev: CalendarEvent): string {
		if (ev.isAllDay) return 'Ganztägig';
		const start = toDate(ev.startTime);
		const end = toDate(ev.endTime);
		const dateStr = format(start, 'EEEE, d. MMMM yyyy', { locale: getDateFnsLocale() });
		const timeStr = `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`;
		return `${dateStr}\n${timeStr}`;
	}

	// Format duration
	function formatDuration(ev: CalendarEvent): string {
		if (ev.isAllDay) return '';
		const start = toDate(ev.startTime);
		const end = toDate(ev.endTime);
		const mins = differenceInMinutes(end, start);
		if (mins < 60) return `${mins} Min.`;
		const hours = differenceInHours(end, start);
		const remainMins = mins % 60;
		if (remainMins === 0) return `${hours} Std.`;
		return `${hours} Std. ${remainMins} Min.`;
	}

	function formatRecurrence(rule: string): string {
		if (!rule) return '';
		if (rule.includes('FREQ=DAILY')) return 'Täglich';
		if (rule.includes('FREQ=WEEKLY')) {
			if (rule.includes('INTERVAL=2')) return 'Alle 2 Wochen';
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
					return `Wöchentlich (${days
						.split(',')
						.map((d) => dayMap[d] || d)
						.join(', ')})`;
				}
			}
			return 'Wöchentlich';
		}
		if (rule.includes('FREQ=MONTHLY')) return 'Monatlich';
		if (rule.includes('FREQ=YEARLY')) return 'Jährlich';
		return 'Wiederkehrend';
	}

	async function handleSave(data: Parameters<typeof eventsStore.updateEvent>[1]) {
		if (editMode === 'single') {
			await eventsStore.updateSingleInstance(event.id, data);
		} else if (editMode === 'all') {
			await eventsStore.updateAllFuture(event.id, data);
		} else {
			await eventsStore.updateEvent(event.id, data);
		}
		isEditing = false;
		editMode = null;
	}

	function handleEditClick() {
		if (isRecurring || hasParent) {
			showEditOptions = true;
		} else {
			isEditing = true;
		}
	}

	function startEdit(mode: 'single' | 'all') {
		editMode = mode;
		showEditOptions = false;
		isEditing = true;
	}

	async function handleDelete(mode: 'this' | 'all') {
		if (mode === 'this') {
			await eventsStore.deleteSingleInstance(event.id);
		} else {
			await eventsStore.deleteAllInSeries(event.id);
		}
		showDeleteOptions = false;
		onClose();
	}

	function handleDeleteClick() {
		if (isRecurring || hasParent) {
			showDeleteOptions = true;
		} else {
			if (confirm('Diesen Termin löschen?')) {
				eventsStore.deleteEvent(event.id);
				onClose();
			}
		}
	}

	async function copyToClipboard() {
		const start = toDate(event.startTime);
		const text = [
			event.title,
			event.isAllDay ? 'Ganztägig' : `${format(start, 'dd.MM.yyyy HH:mm')}`,
			event.location ? `Ort: ${event.location}` : '',
			event.description || '',
		]
			.filter(Boolean)
			.join('\n');
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (showDeleteOptions) showDeleteOptions = false;
			else if (showEditOptions) showEditOptions = false;
			else onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="modal-backdrop"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	tabindex="-1"
	role="presentation"
>
	<div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<!-- Color accent bar -->
		<div class="accent-bar" style="background-color: {calendarColor};"></div>

		<!-- Header -->
		<div class="modal-header">
			<div class="header-left">
				<h2 id="modal-title" class="modal-title">
					{isEditing ? 'Termin bearbeiten' : event.title}
				</h2>
				{#if !isEditing && calendarName}
					<span class="calendar-badge">
						<span class="calendar-dot" style="background-color: {calendarColor}"></span>
						{calendarName}
					</span>
				{/if}
			</div>
			<div class="modal-actions">
				{#if !isEditing}
					<button class="btn btn-ghost" onclick={copyToClipboard} title="Kopieren">
						{#if copied}<Check size={16} />{:else}<Copy size={16} />{/if}
					</button>
					<button class="btn btn-ghost" onclick={handleEditClick} title={$_('common.edit')}>
						<PencilSimple size={16} />
					</button>
					<button
						class="btn btn-ghost text-destructive"
						onclick={handleDeleteClick}
						title={$_('common.delete')}
					>
						<Trash size={16} />
					</button>
				{/if}
				<button class="btn btn-ghost btn-close" onclick={onClose} aria-label={$_('common.close')}>
					<X size={20} />
				</button>
			</div>
		</div>

		<!-- Content -->
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
					<!-- Visibility -->
					<div class="detail-row">
						<span class="detail-label">Sichtbarkeit</span>
						<div class="detail-content">
							<VisibilityPicker level={event.visibility} onChange={handleVisibilityChange} />
						</div>
					</div>

					<!-- Time -->
					<div class="detail-row">
						<span class="detail-icon"><Clock size={18} /></span>
						<div class="detail-content">
							<span class="detail-value time-value">{formatEventTime(event)}</span>
							{#if !event.isAllDay}
								<span class="detail-meta">{formatDuration(event)}</span>
							{/if}
						</div>
					</div>

					<!-- Recurrence -->
					{#if event.recurrenceRule}
						<div class="detail-row">
							<span class="detail-icon"><ArrowsClockwise size={18} /></span>
							<div class="detail-content">
								<span class="detail-value">{formatRecurrence(event.recurrenceRule)}</span>
							</div>
						</div>
					{/if}

					<!-- Location -->
					{#if event.location}
						<div class="detail-row">
							<span class="detail-icon"><MapPin size={18} /></span>
							<div class="detail-content">
								<span class="detail-value">{event.location}</span>
							</div>
						</div>
					{/if}

					<!-- Description -->
					{#if event.description}
						<div class="detail-row">
							<span class="detail-icon"><TextAlignLeft size={18} /></span>
							<div class="detail-content">
								<span class="detail-value description">{event.description}</span>
							</div>
						</div>
					{/if}

					<!-- Tags -->
					{#if event.tagIds && event.tagIds.length > 0}
						<div class="detail-row">
							<span class="detail-icon"><Tag size={18} /></span>
							<div class="detail-content">
								<div class="tag-list">
									{#each event.tagIds as tagId}
										<span class="tag-badge">{tagId}</span>
									{/each}
								</div>
							</div>
						</div>
					{/if}

					<!-- Metadata -->
					<div class="detail-meta-row">
						<span
							>Erstellt: {format(new Date(event.createdAt), 'dd. MMM yyyy', {
								locale: getDateFnsLocale(),
							})}</span
						>
						{#if event.updatedAt !== event.createdAt}
							<span
								>· Bearbeitet: {format(new Date(event.updatedAt), 'dd. MMM yyyy', {
									locale: getDateFnsLocale(),
								})}</span
							>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Recurrence Delete Dialog -->
{#if showEditOptions}
	<div
		class="delete-overlay"
		onclick={() => (showEditOptions = false)}
		onkeydown={(e) => e.key === 'Escape' && (showEditOptions = false)}
		tabindex="-1"
		role="presentation"
	>
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="delete-dialog" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
			<h3 class="delete-title">Wiederkehrenden Termin bearbeiten</h3>
			<p class="delete-text">Möchtest du nur diesen Termin oder alle zukünftigen bearbeiten?</p>
			<div class="delete-actions">
				<button class="btn btn-outline" onclick={() => startEdit('single')}>
					Nur diesen Termin
				</button>
				<button class="btn btn-primary-full" onclick={() => startEdit('all')}>
					Alle zukünftigen Termine
				</button>
				<button class="btn btn-ghost" onclick={() => (showEditOptions = false)}>
					{$_('common.cancel')}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showDeleteOptions}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="delete-overlay"
		onclick={() => (showDeleteOptions = false)}
		onkeydown={(e) => e.key === 'Escape' && (showDeleteOptions = false)}
		tabindex="-1"
		role="presentation"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="delete-dialog" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
			<h3 class="delete-title">Wiederkehrenden Termin löschen</h3>
			<p class="delete-text">Möchtest du nur diesen Termin oder die gesamte Serie löschen?</p>
			<div class="delete-actions">
				<button class="btn btn-outline" onclick={() => handleDelete('this')}>
					Nur diesen Termin
				</button>
				<button class="btn btn-destructive" onclick={() => handleDelete('all')}>
					Alle Termine der Serie
				</button>
				<button class="btn btn-ghost" onclick={() => (showDeleteOptions = false)}>
					{$_('common.cancel')}
				</button>
			</div>
		</div>
	</div>
{/if}

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
		border-radius: 0.75rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		width: 100%;
		max-width: 480px;
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

	.accent-bar {
		height: 4px;
		width: 100%;
		flex-shrink: 0;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1rem 1.25rem 0.75rem;
		gap: 0.75rem;
	}

	.header-left {
		flex: 1;
		min-width: 0;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin: 0;
		line-height: 1.3;
	}

	.calendar-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.calendar-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		flex-shrink: 0;
	}

	.modal-actions {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		flex-shrink: 0;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 0 1.25rem 1.25rem;
	}

	.event-details {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
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

	.detail-label {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		min-width: 5rem;
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.detail-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.detail-value {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		line-height: 1.4;
	}

	.detail-value.time-value {
		white-space: pre-line;
	}

	.detail-value.description {
		white-space: pre-wrap;
	}

	.detail-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.detail-meta-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		padding-top: 0.5rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.tag-badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-weight: 500;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
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
		padding: 0.375rem;
	}

	.text-destructive {
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.text-destructive:hover {
		background: hsl(var(--color-error, 0 84% 60%) / 0.1);
	}

	.btn-outline {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		padding: 0.5rem 1rem;
	}

	.btn-outline:hover {
		background: hsl(var(--color-muted));
	}

	.btn-primary-full {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		padding: 0.5rem 1rem;
	}

	.btn-primary-full:hover {
		opacity: 0.9;
	}

	.btn-destructive {
		background: hsl(var(--color-error, 0 84% 60%));
		color: white;
		padding: 0.5rem 1rem;
	}

	.btn-destructive:hover {
		opacity: 0.9;
	}

	/* Delete dialog */
	.delete-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 110;
		padding: 1rem;
	}

	.delete-dialog {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		padding: 1.5rem;
		max-width: 380px;
		width: 100%;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
	}

	.delete-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.5rem;
	}

	.delete-text {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0 1.25rem;
		line-height: 1.4;
	}

	.delete-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.delete-actions .btn {
		width: 100%;
		justify-content: center;
	}
</style>
