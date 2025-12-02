<script lang="ts">
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@calendar/shared';
	import { format, addHours, parseISO } from 'date-fns';

	interface Props {
		mode: 'create' | 'edit';
		event?: CalendarEvent;
		initialStartTime?: Date | null;
		onSave: (data: CreateEventInput | UpdateEventInput) => void;
		onCancel: () => void;
	}

	let { mode, event, initialStartTime, onSave, onCancel }: Props = $props();

	// Form state
	let title = $state(event?.title || '');
	let description = $state(event?.description || '');
	let location = $state(event?.location || '');
	let isAllDay = $state(event?.isAllDay || false);
	let calendarId = $state(event?.calendarId || calendarsStore.defaultCalendar?.id || '');

	// Date/time handling
	let startDate = $state('');
	let startTime = $state('');
	let endDate = $state('');
	let endTime = $state('');

	// Initialize date/time fields
	$effect(() => {
		if (event) {
			const start = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
			const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
			startDate = format(start, 'yyyy-MM-dd');
			startTime = format(start, 'HH:mm');
			endDate = format(end, 'yyyy-MM-dd');
			endTime = format(end, 'HH:mm');
		} else if (initialStartTime) {
			const end = addHours(initialStartTime, 1);
			startDate = format(initialStartTime, 'yyyy-MM-dd');
			startTime = format(initialStartTime, 'HH:mm');
			endDate = format(end, 'yyyy-MM-dd');
			endTime = format(end, 'HH:mm');
		} else {
			const now = new Date();
			now.setMinutes(0, 0, 0);
			const end = addHours(now, 1);
			startDate = format(now, 'yyyy-MM-dd');
			startTime = format(now, 'HH:mm');
			endDate = format(end, 'yyyy-MM-dd');
			endTime = format(end, 'HH:mm');
		}
	});

	let submitting = $state(false);

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!title.trim()) return;

		const startDateTime = new Date(`${startDate}T${isAllDay ? '00:00' : startTime}`);
		const endDateTime = new Date(`${endDate}T${isAllDay ? '23:59' : endTime}`);

		const data: CreateEventInput | UpdateEventInput = {
			title: title.trim(),
			description: description.trim() || undefined,
			location: location.trim() || undefined,
			isAllDay,
			startTime: startDateTime.toISOString(),
			endTime: endDateTime.toISOString(),
			calendarId,
		};

		submitting = true;
		onSave(data);
	}
</script>

<form onsubmit={handleSubmit}>
	<div class="form-group">
		<label for="title">Titel *</label>
		<input
			type="text"
			id="title"
			class="input"
			bind:value={title}
			placeholder="Terminname eingeben"
			required
		/>
	</div>

	<div class="form-group">
		<label for="calendar">Kalender</label>
		<select id="calendar" class="input" bind:value={calendarId}>
			{#each calendarsStore.calendars as cal}
				<option value={cal.id}>{cal.name}</option>
			{/each}
		</select>
	</div>

	<div class="form-group">
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={isAllDay} />
			Ganztägig
		</label>
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="startDate">Beginn</label>
			<input type="date" id="startDate" class="input" bind:value={startDate} required />
		</div>
		{#if !isAllDay}
			<div class="form-group">
				<label for="startTime">Uhrzeit</label>
				<input type="time" id="startTime" class="input" bind:value={startTime} required />
			</div>
		{/if}
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="endDate">Ende</label>
			<input type="date" id="endDate" class="input" bind:value={endDate} required />
		</div>
		{#if !isAllDay}
			<div class="form-group">
				<label for="endTime">Uhrzeit</label>
				<input type="time" id="endTime" class="input" bind:value={endTime} required />
			</div>
		{/if}
	</div>

	<div class="form-group">
		<label for="location">Ort</label>
		<input
			type="text"
			id="location"
			class="input"
			bind:value={location}
			placeholder="Ort hinzufügen"
		/>
	</div>

	<div class="form-group">
		<label for="description">Beschreibung</label>
		<textarea
			id="description"
			class="input"
			rows="3"
			bind:value={description}
			placeholder="Beschreibung hinzufügen"
		></textarea>
	</div>

	<div class="form-actions">
		<button type="button" class="btn btn-ghost" onclick={onCancel}>
			Abbrechen
		</button>
		<button type="submit" class="btn btn-primary" disabled={submitting || !title.trim()}>
			{mode === 'create' ? 'Erstellen' : 'Speichern'}
		</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.form-row {
		display: flex;
		gap: 1rem;
	}

	.form-row .form-group {
		flex: 1;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-label input {
		width: 18px;
		height: 18px;
	}

	textarea.input {
		resize: vertical;
		min-height: 80px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
	}
</style>
