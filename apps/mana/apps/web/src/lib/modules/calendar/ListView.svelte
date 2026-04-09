<!--
  Calendar — Workbench ListView
  Mini week view with today's events + quick event creation.
  Clicking an event opens the detail view.
-->
<script lang="ts">
	import { db } from '$lib/data/database';
	import { eventsStore } from './stores/events.svelte';
	import { useAllCalendarItems } from './queries';
	import type { CalendarEvent } from './types';
	import { Plus, PencilSimple, Trash } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { dropTarget, dragSource } from '@mana/shared-ui/dnd';
	import type { TagDragData } from '@mana/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import { addTagId } from '$lib/data/tag-mutations';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';

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

	const todayEvents = $derived(
		allItems
			.filter((e) => e.startTime.startsWith(todayStr))
			.sort((a, b) => a.startTime.localeCompare(b.startTime))
	);

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
	}

	const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

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

		// Get default calendar or use a fallback id
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

<div class="app-view">
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

	<!-- Today's events -->
	<div class="events-section">
		<div class="section-header">
			<h3 class="section-title">Heute</h3>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				createEvent();
			}}
			class="quick-add"
		>
			<span class="add-icon"><Plus size={16} /></span>
			<input bind:value={newTitle} placeholder="Neuer Termin..." class="add-input" />
		</form>

		{#each todayEvents as event (event.id)}
			{@const eventTags = getTagsByIds(allTags, event.tagIds ?? [])}
			<button
				class="event-card"
				onclick={() =>
					navigate('detail', {
						eventId: event.id,
						_siblingIds: todayEvents.map((e) => e.id),
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
				<div class="event-header">
					<p class="event-title">{event.title}</p>
					{#if eventTags.length > 0}
						<div class="event-tags">
							{#each eventTags as tag (tag.id)}
								<span class="tag-pill" style="--tag-color: {tag.color}">
									<span class="tag-dot" style="background: {tag.color}"></span>
									{tag.name}
								</span>
							{/each}
						</div>
					{/if}
				</div>
				<p class="event-time-label">
					{#if event.isAllDay}
						Ganztägig
					{:else}
						{formatTime(event.startTime)} — {formatTime(event.endTime)}
					{/if}
				</p>
				{#if event.location}
					<p class="event-location">{event.location}</p>
				{/if}
			</button>
		{/each}

		{#if todayEvents.length === 0}
			<p class="empty">Keine Termine heute</p>
		{/if}
	</div>

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
	/>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		height: 100%;
	}
	.week-strip {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
	}
	.day-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	/* P5: theme-token migration. */
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
		border-radius: 9999px;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.day-num.today {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-weight: 600;
	}
	.day-dot {
		width: 4px;
		height: 4px;
		border-radius: 9999px;
		background: hsl(var(--color-primary));
	}
	.events-section {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.section-title {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
	}
	.add-icon {
		color: hsl(var(--color-muted-foreground));
		display: flex;
	}
	.add-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.add-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.event-card {
		display: block;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}
	.event-card:hover {
		background: hsl(var(--color-surface-hover));
	}
	.event-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.375rem;
	}
	.event-tags {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}
	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.1875rem;
		padding: 0 0.325rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--tag-color) 12%, transparent);
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.25rem;
		white-space: nowrap;
	}
	.tag-dot {
		width: 5px;
		height: 5px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	:global(.event-card.mana-drop-target-hover) {
		outline: 2px solid hsl(var(--color-primary) / 0.4);
		outline-offset: -2px;
		background: hsl(var(--color-primary) / 0.06) !important;
	}
	.event-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		margin: 0;
	}
	.event-time-label {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.event-location {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Mobile: larger touch targets, tighter spacing */
	@media (max-width: 640px) {
		.app-view {
			padding: 0.75rem;
		}

		.event-card {
			padding: 0.75rem;
			min-height: 44px;
		}

		.quick-add {
			padding: 0.625rem 0.75rem;
			min-height: 44px;
		}
	}
</style>
