<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { eventsStore } from '$lib/modules/calendar/stores/events.svelte';
	import { getEventById, getCalendarById, getCalendarColor } from '$lib/modules/calendar/queries';
	import type { Calendar, CalendarEvent } from '$lib/modules/calendar/types';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { CaretLeft, Trash, PencilSimple, MapPin, Clock } from '@manacore/shared-icons';

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');
	const eventsCtx: { readonly value: CalendarEvent[] } = getContext('calendarEvents');

	let eventId = $derived($page.params.id);
	let event = $derived(getEventById(eventsCtx.value, eventId));
	let calendar = $derived(
		event ? getCalendarById(calendarsCtx.value, event.calendarId) : undefined
	);

	// Edit state
	let isEditing = $state(false);
	let editTitle = $state('');
	let editDate = $state('');
	let editStartTime = $state('');
	let editEndTime = $state('');
	let editAllDay = $state(false);
	let editLocation = $state('');
	let editDescription = $state('');

	function startEditing() {
		if (!event) return;
		editTitle = event.title;
		editDate = format(new Date(event.startTime), 'yyyy-MM-dd');
		editStartTime = format(new Date(event.startTime), 'HH:mm');
		editEndTime = format(new Date(event.endTime), 'HH:mm');
		editAllDay = event.isAllDay;
		editLocation = event.location ?? '';
		editDescription = event.description ?? '';
		isEditing = true;
	}

	async function handleSave() {
		if (!event) return;
		const startTime = editAllDay ? `${editDate}T00:00:00` : `${editDate}T${editStartTime}:00`;
		const endTime = editAllDay ? `${editDate}T23:59:59` : `${editDate}T${editEndTime}:00`;

		await eventsStore.updateEvent(event.id, {
			title: editTitle,
			description: editDescription || null,
			startTime: new Date(startTime).toISOString(),
			endTime: new Date(endTime).toISOString(),
			isAllDay: editAllDay,
			location: editLocation || null,
		});
		isEditing = false;
	}

	async function handleDelete() {
		if (!event) return;
		await eventsStore.deleteEvent(event.id);
		goto('/calendar');
	}
</script>

<svelte:head>
	<title>{event?.title ?? 'Termin'} - Kalender - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-2xl p-4">
	<!-- Back Button -->
	<button
		onclick={() => goto('/calendar')}
		class="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
	>
		<CaretLeft size={16} />
		Zurück zum Kalender
	</button>

	{#if !event}
		<div class="py-16 text-center">
			<p class="text-lg text-muted-foreground">Termin nicht gefunden</p>
			<button onclick={() => goto('/calendar')} class="mt-4 text-sm text-primary hover:underline">
				Zurück zum Kalender
			</button>
		</div>
	{:else if isEditing}
		<!-- Edit Form -->
		<div class="rounded-xl border border-border bg-card p-6">
			<h2 class="mb-4 text-xl font-semibold text-foreground">Termin bearbeiten</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				class="space-y-4"
			>
				<div>
					<label for="edit-title" class="mb-1 block text-sm font-medium text-foreground"
						>Titel</label
					>
					<input
						id="edit-title"
						type="text"
						bind:value={editTitle}
						required
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div>
					<label for="edit-desc" class="mb-1 block text-sm font-medium text-foreground"
						>Beschreibung</label
					>
					<textarea
						id="edit-desc"
						bind:value={editDescription}
						rows="3"
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					></textarea>
				</div>

				<div>
					<label for="edit-date" class="mb-1 block text-sm font-medium text-foreground">Datum</label
					>
					<input
						id="edit-date"
						type="date"
						bind:value={editDate}
						required
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<label class="flex items-center gap-2 text-sm text-foreground">
					<input type="checkbox" bind:checked={editAllDay} class="rounded" />
					Ganztägig
				</label>

				{#if !editAllDay}
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="edit-start" class="mb-1 block text-sm font-medium text-foreground"
								>Von</label
							>
							<input
								id="edit-start"
								type="time"
								bind:value={editStartTime}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
							/>
						</div>
						<div>
							<label for="edit-end" class="mb-1 block text-sm font-medium text-foreground"
								>Bis</label
							>
							<input
								id="edit-end"
								type="time"
								bind:value={editEndTime}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
							/>
						</div>
					</div>
				{/if}

				<div>
					<label for="edit-location" class="mb-1 block text-sm font-medium text-foreground"
						>Ort</label
					>
					<input
						id="edit-location"
						type="text"
						bind:value={editLocation}
						placeholder="Ort eingeben..."
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div class="flex gap-3 pt-2">
					<button
						type="button"
						onclick={() => (isEditing = false)}
						class="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						class="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						Speichern
					</button>
				</div>
			</form>
		</div>
	{:else}
		<!-- Event Detail View -->
		<div class="rounded-xl border border-border bg-card p-6">
			<div class="mb-4 flex items-start justify-between">
				<div class="flex items-start gap-3">
					<div
						class="mt-1 h-4 w-4 flex-shrink-0 rounded-full"
						style="background-color: {getCalendarColor(calendarsCtx.value, event.calendarId)}"
					></div>
					<div>
						<h1 class="text-2xl font-bold text-foreground">{event.title}</h1>
						{#if calendar}
							<p class="text-sm text-muted-foreground">{calendar.name}</p>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2">
					<button
						onclick={startEditing}
						class="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						title={$_('common.edit')}
					>
						<PencilSimple size={18} />
					</button>
					<button
						onclick={handleDelete}
						class="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-colors"
						title={$_('common.delete')}
					>
						<Trash size={18} />
					</button>
				</div>
			</div>

			<div class="space-y-3">
				<!-- Date & Time -->
				<div class="flex items-center gap-2 text-foreground">
					<Clock size={18} class="text-muted-foreground" />
					<div>
						<div>{format(new Date(event.startTime), 'EEEE, d. MMMM yyyy', { locale: de })}</div>
						{#if event.isAllDay}
							<div class="text-sm text-muted-foreground">Ganztägig</div>
						{:else}
							<div class="text-sm text-muted-foreground">
								{format(new Date(event.startTime), 'HH:mm')} – {format(
									new Date(event.endTime),
									'HH:mm'
								)} Uhr
							</div>
						{/if}
					</div>
				</div>

				<!-- Location -->
				{#if event.location}
					<div class="flex items-center gap-2 text-foreground">
						<MapPin size={18} class="text-muted-foreground" />
						<span>{event.location}</span>
					</div>
				{/if}

				<!-- Description -->
				{#if event.description}
					<div class="mt-4 border-t border-border pt-4">
						<p class="whitespace-pre-wrap text-foreground">{event.description}</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
