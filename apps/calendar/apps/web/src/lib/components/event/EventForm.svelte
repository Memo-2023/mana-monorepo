<script lang="ts">
	import { onMount } from 'svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { eventTagsStore } from '$lib/stores/event-tags.svelte';
	import { TagSelector, type Tag } from '@manacore/shared-ui';
	import AttendeeSelector from './AttendeeSelector.svelte';
	import type {
		CalendarEvent,
		CreateEventInput,
		UpdateEventInput,
		LocationDetails,
		EventTag,
		EventAttendee,
	} from '@calendar/shared';
	import { format, addMinutes, parseISO } from 'date-fns';

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
	let allDayDisplayMode = $state<'default' | 'header' | 'block'>(
		event?.metadata?.allDayDisplayMode || 'default'
	);

	// Location details state
	let showLocationDetails = $state(false);
	let locationStreet = $state(event?.metadata?.locationDetails?.street || '');
	let locationPostalCode = $state(event?.metadata?.locationDetails?.postalCode || '');
	let locationCity = $state(event?.metadata?.locationDetails?.city || '');
	let locationCountry = $state(event?.metadata?.locationDetails?.country || '');

	// Tags state - store as Tag[] for compatibility with TagSelector
	let selectedTags = $state<Tag[]>(
		event?.tags?.map((t) => ({
			id: t.id,
			name: t.name,
			color: t.color,
		})) || []
	);

	// Attendees state
	let attendees = $state<EventAttendee[]>(event?.metadata?.attendees || []);

	// Convert EventTag to Tag type for shared-ui components
	function eventTagToTag(tag: EventTag): Tag {
		return {
			id: tag.id,
			name: tag.name,
			color: tag.color,
		};
	}

	// Handle tag selection changes
	function handleTagsChange(newTags: Tag[]) {
		selectedTags = newTags;
	}

	// Derived available tags for TagSelector
	let availableTags = $derived(eventTagsStore.tags.map(eventTagToTag));

	// Auto-expand location details if any field is filled
	$effect(() => {
		if (event?.metadata?.locationDetails) {
			const details = event.metadata.locationDetails;
			if (details.street || details.postalCode || details.city || details.country) {
				showLocationDetails = true;
			}
		}
	});

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

	// Initialize date/time fields using settings for default duration
	$effect(() => {
		if (event) {
			const start =
				typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
			const end = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
			startDate = format(start, 'yyyy-MM-dd');
			startTime = format(start, 'HH:mm');
			endDate = format(end, 'yyyy-MM-dd');
			endTime = format(end, 'HH:mm');
		} else if (initialStartTime) {
			// Use default event duration from settings
			const end = addMinutes(initialStartTime, settingsStore.defaultEventDuration);
			startDate = format(initialStartTime, 'yyyy-MM-dd');
			startTime = format(initialStartTime, 'HH:mm');
			endDate = format(end, 'yyyy-MM-dd');
			endTime = format(end, 'HH:mm');
		} else {
			const now = new Date();
			now.setMinutes(0, 0, 0);
			// Use default event duration from settings
			const end = addMinutes(now, settingsStore.defaultEventDuration);
			startDate = format(now, 'yyyy-MM-dd');
			startTime = format(now, 'HH:mm');
			endDate = format(end, 'yyyy-MM-dd');
			endTime = format(end, 'HH:mm');
		}
	});

	let submitting = $state(false);

	// Load tags on mount
	onMount(() => {
		if (eventTagsStore.tags.length === 0) {
			eventTagsStore.fetchTags();
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!title.trim()) return;
		if (!calendarId) return;

		const startDateTime = new Date(`${startDate}T${isAllDay ? '00:00' : startTime}`);
		const endDateTime = new Date(`${endDate}T${isAllDay ? '23:59' : endTime}`);

		// Build location details if any field is filled
		const locationDetails: LocationDetails | undefined =
			locationStreet.trim() ||
			locationPostalCode.trim() ||
			locationCity.trim() ||
			locationCountry.trim()
				? {
						street: locationStreet.trim() || undefined,
						postalCode: locationPostalCode.trim() || undefined,
						city: locationCity.trim() || undefined,
						country: locationCountry.trim() || undefined,
					}
				: undefined;

		// Build metadata
		let metadata = { ...(event?.metadata || {}) };

		// Add display mode if not default
		if (isAllDay && allDayDisplayMode !== 'default') {
			metadata.allDayDisplayMode = allDayDisplayMode as 'header' | 'block';
		} else {
			delete metadata.allDayDisplayMode;
		}

		// Add location details
		if (locationDetails) {
			metadata.locationDetails = locationDetails;
		} else {
			delete metadata.locationDetails;
		}

		// Add attendees
		if (attendees.length > 0) {
			metadata.attendees = attendees;
		} else {
			delete metadata.attendees;
		}

		// Only include metadata if it has properties
		const finalMetadata = Object.keys(metadata).length > 0 ? metadata : undefined;

		const data: CreateEventInput | UpdateEventInput = {
			title: title.trim(),
			description: description.trim() || undefined,
			location: location.trim() || undefined,
			isAllDay,
			startTime: startDateTime.toISOString(),
			endTime: endDateTime.toISOString(),
			calendarId,
			metadata: finalMetadata,
			tagIds: selectedTags.length > 0 ? selectedTags.map((t) => t.id) : undefined,
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
		<select
			id="calendar"
			class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
			bind:value={calendarId}
		>
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

	{#if isAllDay}
		<div class="flex flex-col gap-2">
			<label for="displayMode" class="text-sm font-medium text-foreground">Anzeigeart</label>
			<select
				id="displayMode"
				class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
				bind:value={allDayDisplayMode}
			>
				<option value="default">Standard (aus Einstellungen)</option>
				<option value="header">In Kopfzeile</option>
				<option value="block">Als Tagesblock</option>
			</select>
		</div>
	{/if}

	<div class="flex gap-4">
		<div class="flex-1 flex flex-col gap-2">
			<label for="startDate" class="text-sm font-medium text-foreground">Beginn</label>
			<input
				type="date"
				id="startDate"
				class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
				bind:value={startDate}
				required
			/>
		</div>
		{#if !isAllDay}
			<div class="flex-1 flex flex-col gap-2">
				<label for="startTime" class="text-sm font-medium text-foreground">Uhrzeit</label>
				<input
					type="time"
					id="startTime"
					class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
					bind:value={startTime}
					required
				/>
			</div>
		{/if}
	</div>

	<div class="flex gap-4">
		<div class="flex-1 flex flex-col gap-2">
			<label for="endDate" class="text-sm font-medium text-foreground">Ende</label>
			<input
				type="date"
				id="endDate"
				class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
				bind:value={endDate}
				required
			/>
		</div>
		{#if !isAllDay}
			<div class="flex-1 flex flex-col gap-2">
				<label for="endTime" class="text-sm font-medium text-foreground">Uhrzeit</label>
				<input
					type="time"
					id="endTime"
					class="w-full px-3 py-2 border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
					bind:value={endTime}
					required
				/>
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
			placeholder="Ortsname oder Beschreibung"
		/>

		<!-- Toggle for address details -->
		<button
			type="button"
			class="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors self-start"
			onclick={() => (showLocationDetails = !showLocationDetails)}
		>
			<svg
				class="w-4 h-4 transition-transform"
				class:rotate-90={showLocationDetails}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			{showLocationDetails ? 'Adressdetails ausblenden' : 'Adressdetails hinzufügen'}
		</button>

		<!-- Address detail fields -->
		{#if showLocationDetails}
			<div class="flex flex-col gap-3 p-3 bg-muted/50 rounded-lg border border-border mt-1">
				<div class="flex flex-col gap-1">
					<label for="street" class="text-xs font-medium text-muted-foreground">Straße</label>
					<input
						type="text"
						id="street"
						class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
						bind:value={locationStreet}
						placeholder="Musterstraße 123"
					/>
				</div>

				<div class="flex gap-3">
					<div class="flex flex-col gap-1 w-1/3">
						<label for="postalCode" class="text-xs font-medium text-muted-foreground">PLZ</label>
						<input
							type="text"
							id="postalCode"
							class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
							bind:value={locationPostalCode}
							placeholder="12345"
						/>
					</div>
					<div class="flex flex-col gap-1 flex-1">
						<label for="city" class="text-xs font-medium text-muted-foreground">Stadt</label>
						<input
							type="text"
							id="city"
							class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
							bind:value={locationCity}
							placeholder="Musterstadt"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label for="country" class="text-xs font-medium text-muted-foreground">Land</label>
					<input
						type="text"
						id="country"
						class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
						bind:value={locationCountry}
						placeholder="Deutschland"
					/>
				</div>
			</div>
		{/if}
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

	<!-- Tags -->
	{#if availableTags.length > 0 || eventTagsStore.loading}
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium text-foreground">Tags</label>
			<TagSelector
				tags={availableTags}
				{selectedTags}
				onTagsChange={handleTagsChange}
				placeholder="Tags auswählen..."
				addTagLabel="Tag hinzufügen"
			/>
		</div>
	{/if}

	<!-- Teilnehmer -->
	<div class="flex flex-col gap-2">
		<span class="text-sm font-medium text-foreground">Teilnehmer</span>
		<AttendeeSelector
			{attendees}
			onAttendeesChange={(newAttendees) => (attendees = newAttendees)}
		/>
	</div>

	<div class="flex justify-end gap-3 pt-4 border-t border-border">
		<button
			type="button"
			class="px-4 py-2 rounded-lg font-medium text-foreground bg-transparent hover:bg-muted transition-colors"
			onclick={onCancel}
		>
			Abbrechen
		</button>
		<button
			type="submit"
			class="px-4 py-2 rounded-lg font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			disabled={submitting || !title.trim() || !calendarId}
		>
			{mode === 'create' ? 'Erstellen' : 'Speichern'}
		</button>
	</div>
</form>
