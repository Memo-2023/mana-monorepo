<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { getDefaultCalendar } from '../queries';
	import type { Calendar, CalendarEvent } from '../types';
	import { toDate } from '../utils/event-date-helpers';
	import { format, addMinutes } from 'date-fns';
	import { TagField } from '@mana/shared-ui';
	import { useAllTags } from '@mana/shared-stores';
	import ConflictWarning from './ConflictWarning.svelte';
	import CustomRecurrenceBuilder from './CustomRecurrenceBuilder.svelte';

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

	// svelte-ignore state_referenced_locally
	let title = $state(event?.title || '');
	// svelte-ignore state_referenced_locally
	let description = $state(event?.description || '');
	// svelte-ignore state_referenced_locally
	let location = $state(event?.location || '');
	// svelte-ignore state_referenced_locally
	let isAllDay = $state(event?.isAllDay || false);
	// svelte-ignore state_referenced_locally
	let calendarId = $state(event?.calendarId || '');
	// svelte-ignore state_referenced_locally
	let recurrenceRule = $state(event?.recurrenceRule || '');
	// svelte-ignore state_referenced_locally
	let selectedTagIds = $state<string[]>(event?.tagIds ?? []);

	const allTags = useAllTags();

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

		data.tagIds = selectedTagIds;

		if (mode === 'create') {
			data.calendarId = calendarId;
		}

		submitting = true;
		onSave(data);
	}

	// Calendar options
	let calendarOptions = $derived(calendarsCtx.value.filter((c) => c.isVisible));

	// Recurrence options
	const CUSTOM_VALUE = '__custom__';
	const recurrenceOptions = [
		{ value: '', label: 'Keine Wiederholung' },
		{ value: 'FREQ=DAILY', label: 'Täglich' },
		{ value: 'FREQ=WEEKLY', label: 'Wöchentlich' },
		{ value: 'FREQ=MONTHLY', label: 'Monatlich' },
		{ value: 'FREQ=YEARLY', label: 'Jährlich' },
		{ value: CUSTOM_VALUE, label: 'Benutzerdefiniert...' },
	];

	let showCustomBuilder = $state(false);

	// If the initial rule is a custom one (not a simple preset), show it as custom
	let isCustomRule = $derived(
		!!recurrenceRule &&
			!recurrenceOptions.some((o) => o.value === recurrenceRule && o.value !== CUSTOM_VALUE)
	);

	// The value shown in the select dropdown
	let selectValue = $derived(isCustomRule ? CUSTOM_VALUE : recurrenceRule);

	function handleRecurrenceChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		if (value === CUSTOM_VALUE) {
			showCustomBuilder = true;
		} else {
			recurrenceRule = value;
			showCustomBuilder = false;
		}
	}

	function handleCustomApply(rule: string) {
		recurrenceRule = rule;
		showCustomBuilder = false;
	}

	function formatCustomPreview(rule: string): string {
		if (!rule) return '';
		const parts = Object.fromEntries(
			rule
				.replace(/^RRULE:/, '')
				.split(';')
				.map((p) => p.split('='))
		);
		const freqMap: Record<string, string> = {
			DAILY: 'Täglich',
			WEEKLY: 'Wöchentlich',
			MONTHLY: 'Monatlich',
			YEARLY: 'Jährlich',
		};
		let text = freqMap[parts.FREQ] ?? 'Wiederkehrend';
		if (parts.INTERVAL && parseInt(parts.INTERVAL) > 1) {
			const unitMap: Record<string, string> = {
				DAILY: 'Tage',
				WEEKLY: 'Wochen',
				MONTHLY: 'Monate',
				YEARLY: 'Jahre',
			};
			text = `Alle ${parts.INTERVAL} ${unitMap[parts.FREQ] ?? ''}`;
		}
		if (parts.BYDAY) {
			const dayMap: Record<string, string> = {
				MO: 'Mo',
				TU: 'Di',
				WE: 'Mi',
				TH: 'Do',
				FR: 'Fr',
				SA: 'Sa',
				SU: 'So',
			};
			text += ` (${parts.BYDAY.split(',')
				.map((d: string) => dayMap[d] || d)
				.join(', ')})`;
		}
		return text;
	}
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

	{#if !isAllDay && startDate && startTime && endDate && endTime}
		{@const fullStart = `${startDate}T${startTime}:00`}
		{@const fullEnd = `${endDate}T${endTime}:00`}
		<ConflictWarning startDate={fullStart} endDate={fullEnd} excludeBlockId={event?.timeBlockId} />
	{/if}

	<div class="field">
		<label for="recurrence" class="label">Wiederholung</label>
		<select id="recurrence" class="input" value={selectValue} onchange={handleRecurrenceChange}>
			{#each recurrenceOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if isCustomRule && !showCustomBuilder}
			<button type="button" class="custom-rule-preview" onclick={() => (showCustomBuilder = true)}>
				{formatCustomPreview(recurrenceRule)} — Bearbeiten
			</button>
		{/if}
	</div>

	{#if showCustomBuilder}
		<CustomRecurrenceBuilder
			initialRule={recurrenceRule || null}
			onApply={handleCustomApply}
			onCancel={() => (showCustomBuilder = false)}
		/>
	{/if}

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

	<div class="field">
		<span class="label">Tags</span>
		<TagField
			tags={allTags.value}
			selectedIds={selectedTagIds}
			onChange={(ids) => (selectedTagIds = ids)}
		/>
	</div>

	<div class="form-actions">
		<button type="button" class="btn btn-secondary" onclick={onCancel}>
			{$_('common.cancel')}
		</button>
		<button type="submit" class="btn btn-primary" disabled={submitting || !title.trim()}>
			{mode === 'create' ? $_('common.create') : $_('common.save')}
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

	.custom-rule-preview {
		font-size: 0.8125rem;
		color: hsl(var(--color-primary));
		background: none;
		border: none;
		padding: 0.25rem 0;
		cursor: pointer;
		text-align: left;
	}

	.custom-rule-preview:hover {
		text-decoration: underline;
	}
</style>
