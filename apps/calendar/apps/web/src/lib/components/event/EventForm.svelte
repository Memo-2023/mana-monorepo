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
	let calendarId = $state(event?.calendarId || '');

	// Set default calendar when calendars are loaded
	$effect(() => {
		if (!calendarId && calendarsStore.defaultCalendar?.id) {
			calendarId = calendarsStore.defaultCalendar.id;
		}
	});

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
		if (!calendarId) return;

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

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		<label for="title" class="text-sm font-medium text-foreground">Titel *</label>
		<input
			type="text"
			id="title"
			class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
			bind:value={title}
			placeholder="Terminname eingeben"
			required
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label for="calendar" class="text-sm font-medium text-foreground">Kalender</label>
		<select id="calendar" class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors" bind:value={calendarId}>
			{#each calendarsStore.calendars as cal}
				<option value={cal.id}>{cal.name}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2">
		<label class="flex items-center gap-2 cursor-pointer">
			<input type="checkbox" bind:checked={isAllDay} class="w-4 h-4 accent-primary" />
			<span class="text-sm font-medium text-foreground">Ganztägig</span>
		</label>
	</div>

	<div class="flex gap-4">
		<div class="flex-1 flex flex-col gap-2">
			<label for="startDate" class="text-sm font-medium text-foreground">Beginn</label>
			<input type="date" id="startDate" class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors" bind:value={startDate} required />
		</div>
		{#if !isAllDay}
			<div class="flex-1 flex flex-col gap-2">
				<label for="startTime" class="text-sm font-medium text-foreground">Uhrzeit</label>
				<input type="time" id="startTime" class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors" bind:value={startTime} required />
			</div>
		{/if}
	</div>

	<div class="flex gap-4">
		<div class="flex-1 flex flex-col gap-2">
			<label for="endDate" class="text-sm font-medium text-foreground">Ende</label>
			<input type="date" id="endDate" class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors" bind:value={endDate} required />
		</div>
		{#if !isAllDay}
			<div class="flex-1 flex flex-col gap-2">
				<label for="endTime" class="text-sm font-medium text-foreground">Uhrzeit</label>
				<input type="time" id="endTime" class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors" bind:value={endTime} required />
			</div>
		{/if}
	</div>

	<div class="flex flex-col gap-2">
		<label for="location" class="text-sm font-medium text-foreground">Ort</label>
		<input
			type="text"
			id="location"
			class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
			bind:value={location}
			placeholder="Ort hinzufügen"
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label for="description" class="text-sm font-medium text-foreground">Beschreibung</label>
		<textarea
			id="description"
			class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors resize-y min-h-20"
			rows="3"
			bind:value={description}
			placeholder="Beschreibung hinzufügen"
		></textarea>
	</div>

	<div class="flex justify-end gap-3 pt-4 border-t border-border">
		<button type="button" class="px-4 py-2 rounded-lg font-medium text-foreground bg-transparent hover:bg-muted transition-colors" onclick={onCancel}>
			Abbrechen
		</button>
		<button type="submit" class="px-4 py-2 rounded-lg font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={submitting || !title.trim() || !calendarId}>
			{mode === 'create' ? 'Erstellen' : 'Speichern'}
		</button>
	</div>
</form>

