<!--
  Calendar — Workbench AppView
  Mini week view with today's events + quick event creation.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalEvent } from './types';
	import { eventsStore } from './stores/events.svelte';
	import { Plus } from '@manacore/shared-icons';

	let events = $state<LocalEvent[]>([]);

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
		events
			.filter((e) => e.startDate.startsWith(todayStr))
			.sort((a, b) => a.startDate.localeCompare(b.startDate))
	);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalEvent>('events')
				.toArray()
				.then((all) => all.filter((e) => !e.deletedAt));
		}).subscribe((val) => {
			events = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
	}

	const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	// Quick event creation
	let showNewEvent = $state(false);
	let newTitle = $state('');
	let newTime = $state('09:00');

	async function createEvent() {
		const title = newTitle.trim();
		if (!title) return;
		const startTime = `${todayStr}T${newTime}:00`;
		const [h, m] = newTime.split(':').map(Number);
		const endH = h + 1;
		const endTime = `${todayStr}T${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

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
		showNewEvent = false;
	}
</script>

<div class="app-view">
	<!-- Mini week strip -->
	<div class="week-strip">
		{#each weekDays() as day, i}
			{@const isToday = day.toISOString().split('T')[0] === todayStr}
			{@const dayEvents = events.filter((e) =>
				e.startDate.startsWith(day.toISOString().split('T')[0])
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
			<button class="add-btn" onclick={() => (showNewEvent = !showNewEvent)} title="Neuer Termin">
				<Plus size={14} />
			</button>
		</div>

		{#if showNewEvent}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createEvent();
				}}
				class="new-event-form"
			>
				<input bind:value={newTitle} placeholder="Termin-Titel..." class="event-input" autofocus />
				<input bind:value={newTime} type="time" class="event-time" />
				<button type="submit" class="event-submit">OK</button>
			</form>
		{/if}

		{#each todayEvents as event (event.id)}
			<div class="event-card">
				<p class="event-title">{event.title}</p>
				<p class="event-time-label">
					{#if event.allDay}
						Ganztägig
					{:else}
						{formatTime(event.startDate)} — {formatTime(event.endDate)}
					{/if}
				</p>
				{#if event.location}
					<p class="event-location">{event.location}</p>
				{/if}
			</div>
		{/each}

		{#if todayEvents.length === 0 && !showNewEvent}
			<p class="empty">Keine Termine heute</p>
		{/if}
	</div>
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
	.day-name {
		font-size: 0.625rem;
		color: #9ca3af;
	}
	:global(.dark) .day-name {
		color: #6b7280;
	}
	.day-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 9999px;
		font-size: 0.75rem;
		color: #6b7280;
	}
	.day-num.today {
		background: #3b82f6;
		color: white;
		font-weight: 600;
	}
	:global(.dark) .day-num {
		color: #9ca3af;
	}
	.day-dot {
		width: 4px;
		height: 4px;
		border-radius: 9999px;
		background: #3b82f6;
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
		color: #9ca3af;
		margin: 0;
	}
	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #3b82f6;
	}
	:global(.dark) .add-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #60a5fa;
	}
	.new-event-form {
		display: flex;
		gap: 0.375rem;
		padding: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		animation: slideDown 0.15s ease-out;
	}
	:global(.dark) .new-event-form {
		border-color: rgba(255, 255, 255, 0.08);
	}
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.event-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: #374151;
		min-width: 0;
	}
	.event-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .event-input {
		color: #f3f4f6;
	}
	:global(.dark) .event-input::placeholder {
		color: #4b5563;
	}
	.event-time {
		width: 5rem;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.75rem;
		color: #6b7280;
		text-align: center;
	}
	:global(.dark) .event-time {
		color: #9ca3af;
		color-scheme: dark;
	}
	.event-submit {
		padding: 0.25rem 0.5rem;
		border: none;
		border-radius: 0.25rem;
		background: #3b82f6;
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
	}
	.event-card {
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.06);
		background: rgba(0, 0, 0, 0.02);
	}
	:global(.dark) .event-card {
		border-color: rgba(255, 255, 255, 0.06);
		background: rgba(255, 255, 255, 0.03);
	}
	.event-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
		margin: 0;
	}
	:global(.dark) .event-title {
		color: #e5e7eb;
	}
	.event-time-label {
		font-size: 0.6875rem;
		color: #9ca3af;
		margin: 0;
	}
	.event-location {
		font-size: 0.6875rem;
		color: #b0afa8;
		margin: 0;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
