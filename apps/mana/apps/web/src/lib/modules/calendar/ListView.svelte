<!--
  Calendar — Workbench ListView
  Mini week strip + today's events. Floating input at bottom.
-->
<script lang="ts">
	import { db } from '$lib/data/database';
	import { eventsStore } from './stores/events.svelte';
	import { useAllCalendarItems } from './queries';
	import type { CalendarEvent } from './types';
	import { PencilSimple, Trash } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { dropTarget, dragSource } from '@mana/shared-ui/dnd';
	import type { TagDragData } from '@mana/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import { addTagId } from '$lib/data/tag-mutations';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { transcribeAudio } from '$lib/voice/transcribe';
	import FloatingInputBar from '$lib/components/FloatingInputBar.svelte';

	let { navigate, goBack, params }: ViewProps = $props();

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	function handleTagDrop(eventId: string, tagData: TagDragData) {
		const event = allItems.find((e) => e.id === eventId);
		if (!event) return;
		void addTagId(event.tagIds ?? [], tagData.id, (next) =>
			eventsStore.updateTagIds(eventId, next)
		);
	}

	const itemsQuery = useAllCalendarItems();
	let allItems = $derived(itemsQuery.value ?? []);

	const now = new Date();
	const todayStr = now.toISOString().split('T')[0];

	const weekDays = $derived(() => {
		const days: Date[] = [];
		const start = new Date(now);
		start.setDate(start.getDate() - start.getDay() + 1);
		for (let i = 0; i < 7; i++) {
			const d = new Date(start);
			d.setDate(d.getDate() + i);
			days.push(d);
		}
		return days;
	});

	const upcomingEvents = $derived(
		allItems
			.filter((e) => e.startTime >= todayStr)
			.sort((a, b) => a.startTime.localeCompare(b.startTime))
	);

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
	}

	const WEEKDAYS = [
		'Sonntag',
		'Montag',
		'Dienstag',
		'Mittwoch',
		'Donnerstag',
		'Freitag',
		'Samstag',
	];
	const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	function formatDateLabel(iso: string): string {
		const date = new Date(iso);
		const dateStr = date.toISOString().split('T')[0];
		const todayDate = new Date(now);
		const tomorrowDate = new Date(todayDate);
		tomorrowDate.setDate(tomorrowDate.getDate() + 1);
		if (dateStr === todayStr) return 'Heute';
		if (dateStr === tomorrowDate.toISOString().split('T')[0]) return 'Morgen';
		// Within 7 days: show weekday name
		const diffMs = date.getTime() - todayDate.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays < 7) return WEEKDAYS[date.getDay()];
		return date.toLocaleDateString('de', { day: 'numeric', month: 'short' });
	}

	const ctxMenu = useItemContextMenu<CalendarEvent>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'open',
						label: 'Öffnen',
						icon: PencilSimple,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) navigate('detail', { eventId: target.id });
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) eventsStore.deleteEvent(target.id);
						},
					},
				]
			: []
	);

	async function handleVoiceComplete(blob: Blob, _durationMs: number) {
		const { text } = await transcribeAudio(blob, 'de');
		if (text) {
			newTitle = text;
			await createEvent();
		}
	}

	// Quick event creation
	let newTitle = $state('');

	async function createEvent() {
		const title = newTitle.trim();
		if (!title) return;

		const nowTime = new Date();
		const h = nowTime.getHours();
		const m = nowTime.getMinutes();
		const startTime = `${todayStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
		const endH = h + 1;
		const endTime = `${todayStr}T${String(endH > 23 ? 23 : endH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

		const calendars = await db.table('calendars').toArray();
		const defaultCal = calendars.find((c: Record<string, unknown>) => !c.deletedAt);
		const calendarId = defaultCal?.id ?? 'default';

		await eventsStore.createEvent({
			calendarId,
			title,
			startTime,
			endTime,
		});
		newTitle = '';
	}
</script>

<div class="cal-view">
	<!-- Mini week strip -->
	<div class="week-strip">
		{#each weekDays() as day, i}
			{@const isToday = day.toISOString().split('T')[0] === todayStr}
			{@const dayEvents = allItems.filter((e) =>
				e.startTime.startsWith(day.toISOString().split('T')[0])
			)}
			<div class="day-col">
				<span class="day-name">{dayNames[i]}</span>
				<span class="day-num" class:today={isToday}>
					{day.getDate()}
				</span>
				{#if dayEvents.length > 0}
					<span class="day-dot"></span>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Event list -->
	<div class="event-list">
		{#each upcomingEvents as event (event.id)}
			{@const eventTags = getTagsByIds(allTags, event.tagIds ?? [])}
			<button
				type="button"
				class="event-row"
				onclick={() =>
					navigate('detail', {
						eventId: event.id,
						_siblingIds: upcomingEvents.map((e) => e.id),
						_siblingKey: 'eventId',
					})}
				oncontextmenu={(e) => ctxMenu.open(e, event)}
				use:dragSource={{
					type: 'event',
					data: () => ({
						id: event.id,
						title: event.title,
						startDate: event.startTime,
						endDate: event.endTime,
						description: event.description,
						location: event.location,
					}),
				}}
				use:dropTarget={{
					accepts: ['tag'],
					onDrop: (p) => handleTagDrop(event.id, p.data as unknown as TagDragData),
					canDrop: (p) => !(event.tagIds ?? []).includes((p.data as unknown as TagDragData).id),
				}}
			>
				<span class="event-title">{event.title}</span>
				<div class="event-right">
					{#each eventTags as tag (tag.id)}
						<span class="tag-dot" style="background: {tag.color}" title={tag.name}></span>
					{/each}
					<span class="event-date">{formatDateLabel(event.startTime)}</span>
					<span class="event-time">
						{#if event.isAllDay}
							Ganztägig
						{:else}
							{formatTime(event.startTime)}
						{/if}
					</span>
				</div>
			</button>
		{/each}

		{#if upcomingEvents.length === 0}
			<p class="empty">Keine Termine</p>
		{/if}
	</div>

	<FloatingInputBar
		bind:value={newTitle}
		placeholder="Neuer Termin..."
		onSubmit={createEvent}
		voice
		voiceFeature="calendar-voice-capture"
		voiceReason="Termine werden verschlüsselt gespeichert. Dafür brauchst du ein Mana-Konto."
		onVoiceComplete={handleVoiceComplete}
	/>

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
	/>
</div>

<style>
	.cal-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}

	/* Week strip */
	.week-strip {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
		padding: 0.75rem 0.75rem 0.5rem;
		border-bottom: 1px solid hsl(var(--color-foreground) / 0.1);
	}
	.day-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}
	.day-name {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}
	.day-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
	}
	.day-num.today {
		background: hsl(var(--color-foreground));
		color: hsl(var(--color-background));
		font-weight: 600;
	}
	.day-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: hsl(var(--color-foreground) / 0.35);
	}

	/* Event list */
	.event-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0.75rem;
		padding-bottom: 4rem;
	}
	.event-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.25rem;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: background 0.15s;
	}
	.event-row:hover {
		background: hsl(var(--color-surface-hover));
	}
	.event-title {
		flex: 1;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
	.event-right {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}
	.event-date {
		font-size: 0.625rem;
		font-weight: 500;
		color: hsl(var(--color-foreground) / 0.6);
		white-space: nowrap;
	}
	.event-time {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	:global(.event-row.mana-drop-target-hover) {
		outline: 2px solid hsl(var(--color-primary) / 0.4);
		outline-offset: -2px;
		background: hsl(var(--color-primary) / 0.06) !important;
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	@media (max-width: 640px) {
		.event-row {
			padding: 0.625rem 0.375rem;
			min-height: 44px;
		}
	}
</style>
