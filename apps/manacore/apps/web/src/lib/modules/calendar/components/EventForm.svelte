<script lang="ts">
	import { getContext } from 'svelte';
	import { getDefaultCalendar } from '../queries';
	import type { Calendar, CalendarEvent } from '../types';
	import { toDate } from '../utils/event-date-helpers';
	import { format, addMinutes } from 'date-fns';

	interface Props {
		mode: 'create' | 'edit';
		event?: CalendarEvent;
		initialStartTime?: Date | null;
		initialEndTime?: Date | null;
		onSave: (data: Record<string, unknown>) => void;
		onCancel: () => void;
	}

	let { mode, event, initialStartTime, initialEndTime, onSave, onCancel }: Props = $props();

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	let title = $state(event?.title || '');
	let description = $state(event?.description || '');
	let location = $state(event?.location || '');
	let isAllDay = $state(event?.isAllDay || false);
	let calendarId = $state(event?.calendarId || '');
	let recurrenceRule = $state(event?.recurrenceRule || '');

	// Date/time fields
	let startDate = $state('');
	let startTime = $state('');
	let endDate = $state('');
	let endTime = $state('');

	$effect(() => {
		const defaultCal = getDefaultCalendar(calendarsCtx.value);
		if (!calendarId && defaultCal?.id) {
			calendarId = defaultCal.id;
		}
	});

	$effect(() => {
		if (event) {
			const start = toDate(event.startTime);
			const end = toDate(event.endTime);
			startDate = format(start, 'yyyy-MM-dd');
			startTime = format(start, 'HH:mm');
			endDate = format(end, 'yyyy-MM-dd');
			endTime = format(end, 'HH:mm');
		} else if (initialStartTime) {
			const end = initialEndTime || addMinutes(initialStartTime, 60);
			startDate = format(initialStartTime, 'yyyy-MM-dd');
			startTime = format(initialStartTime, 'HH:mm');
			endDate = format(end, 'yyyy-MM-dd');
			endTime = format(end, 'HH:mm');
		} else {
			const now = new Date();
			now.setMinutes(0, 0, 0);
			const end = addMinutes(now, 60);
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

		const data: Record<string, unknown> = {
			title: title.trim(),
			description: description.trim() || null,
			location: location.trim() || null,
			isAllDay,
			startTime: startDateTime.toISOString(),
			endTime: endDateTime.toISOString(),
			recurrenceRule: recurrenceRule || null,
		};

		if (mode === 'create') {
			data.calendarId = calendarId;
		}

		submitting = true;
		onSave(data);
	}

	// Calendar options
	let calendarOptions = $derived(calendarsCtx.value.filter((c) => c.isVisible));

	// Recurrence options
	const recurrenceOptions = [
		{ value: '', label: 'Keine Wiederholung' },
		{ value: 'FREQ=DAILY', label: 'Täglich' },
		{ value: 'FREQ=WEEKLY', label: 'Wöchentlich' },
		{ value: 'FREQ=MONTHLY', label: 'Monatlich' },
		{ value: 'FREQ=YEARLY', label: 'Jährlich' },
	];
</script>

<form
	onsubmit={handleSubmit}
	class="event-form"
	aria-label={mode === 'create' ? 'Termin erstellen' : 'Termin bearbeiten'}
>
	<div class="field">
		<label for="title" class="label">Titel *</label>
		<input
			type="text"
			id="title"
			class="input"
			bind:value={title}
			placeholder="Terminname eingeben"
			required
		/>
	</div>

	{#if mode === 'create' && calendarOptions.length > 1}
		<div class="field">
			<label for="calendar" class="label">Kalender</label>
			<select id="calendar" class="input" bind:value={calendarId}>
				{#each calendarOptions as cal}
					<option value={cal.id}>{cal.name}</option>
				{/each}
			</select>
		</div>
	{/if}

	<div class="field">
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={isAllDay} class="checkbox" />
			<span>Ganztägig</span>
		</label>
	</div>

	<div class="field-row">
		<div class="field flex-1">
			<label for="startDate" class="label">Beginn</label>
			<input type="date" id="startDate" class="input" bind:value={startDate} required />
		</div>
		{#if !isAllDay}
			<div class="field flex-1">
				<label for="startTime" class="label">Uhrzeit</label>
				<input type="time" id="startTime" class="input" bind:value={startTime} required />
			</div>
		{/if}
	</div>

	<div class="field-row">
		<div class="field flex-1">
			<label for="endDate" class="label">Ende</label>
			<input type="date" id="endDate" class="input" bind:value={endDate} required />
		</div>
		{#if !isAllDay}
			<div class="field flex-1">
				<label for="endTime" class="label">Uhrzeit</label>
				<input type="time" id="endTime" class="input" bind:value={endTime} required />
			</div>
		{/if}
	</div>

	<div class="field">
		<label for="recurrence" class="label">Wiederholung</label>
		<select id="recurrence" class="input" bind:value={recurrenceRule}>
			{#each recurrenceOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	<div class="field">
		<label for="location" class="label">Ort</label>
		<input
			type="text"
			id="location"
			class="input"
			bind:value={location}
			placeholder="Ort eingeben..."
		/>
	</div>

	<div class="field">
		<label for="description" class="label">Beschreibung</label>
		<textarea
			id="description"
			class="input textarea"
			rows="3"
			bind:value={description}
			placeholder="Beschreibung hinzufügen"
		></textarea>
	</div>

	<div class="form-actions">
		<button type="button" class="btn btn-secondary" onclick={onCancel}> Abbrechen </button>
		<button type="submit" class="btn btn-primary" disabled={submitting || !title.trim()}>
			{mode === 'create' ? 'Erstellen' : 'Speichern'}
		</button>
	</div>
</form>

<style>
	.event-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field-row {
		display: flex;
		gap: 1rem;
	}

	.flex-1 {
		flex: 1;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md, 8px);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		transition: border-color 0.15s ease;
	}

	.input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 1px hsl(var(--color-primary));
	}

	.input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.textarea {
		resize: vertical;
		min-height: 5rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: hsl(var(--color-primary));
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md, 8px);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
	}

	.btn-secondary {
		background: transparent;
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
	}

	.btn-secondary:hover {
		background: hsl(var(--color-muted));
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
