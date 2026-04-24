<!--
  HabitDetail — full detail view for a single habit.
  Shows stats, log timeline, edit form, and archive/delete actions.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import type { Habit, HabitLog } from '../types';
	import { habitsStore } from '../stores/habits.svelte';
	import { getCountForDate, getStreak, groupLogsByDate, todayStr, formatTime } from '../queries';
	import HabitForm from './HabitForm.svelte';
	import { DynamicIcon } from '@mana/shared-ui/atoms';
	import { CaretLeft, PencilSimple, X } from '@mana/shared-icons';

	let {
		habit,
		logs,
		onBack,
	}: {
		habit: Habit;
		logs: HabitLog[];
		onBack: () => void;
	} = $props();

	let showEdit = $state(false);
	let confirmDelete = $state(false);

	let todayCount = $derived(getCountForDate(logs, habit.id, todayStr()));
	let streak = $derived(getStreak(logs, habit.id));
	let totalLogs = $derived(logs.filter((l) => l.habitId === habit.id).length);
	let habitLogs = $derived(
		logs
			.filter((l) => l.habitId === habit.id)
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
	);
	let groupedLogs = $derived(groupLogsByDate(habitLogs));

	// Last 7 days for mini chart
	let last7Days = $derived(() => {
		const days: { date: string; count: number }[] = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const dateStr = d.toISOString().split('T')[0];
			days.push({
				date: dateStr,
				count: getCountForDate(logs, habit.id, dateStr),
			});
		}
		return days;
	});

	let maxCount = $derived(Math.max(1, ...last7Days().map((d) => d.count)));

	function formatDateLabel(d: string): string {
		const today = todayStr();
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
		if (d === today) return 'Heute';
		if (d === yesterday) return 'Gestern';
		return formatDate(new Date(d), {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
		});
	}

	function formatDayLabel(d: string): string {
		return formatDate(new Date(d), { weekday: 'narrow' });
	}

	async function handleDelete() {
		await habitsStore.deleteHabit(habit.id);
		onBack();
	}

	async function handleArchive() {
		await habitsStore.updateHabit(habit.id, { isArchived: !habit.isArchived });
		onBack();
	}

	async function handleDeleteLog(logId: string) {
		await habitsStore.deleteLog(logId);
	}
</script>

<div class="habit-detail">
	<!-- Header -->
	<header class="detail-header">
		<button class="back-btn" onclick={onBack}>
			<CaretLeft size={20} />
		</button>
		<div class="header-info" style:--habit-color={habit.color}>
			<span class="header-icon">
				<DynamicIcon name={habit.icon} size={24} weight="bold" />
			</span>
			<h2 class="header-title">{habit.title}</h2>
		</div>
		<button class="edit-btn" onclick={() => (showEdit = !showEdit)}>
			<PencilSimple size={16} />
		</button>
	</header>

	<!-- Edit Form (inline) -->
	{#if showEdit}
		<HabitForm {habit} onDone={() => (showEdit = false)} onCancel={() => (showEdit = false)} />
	{/if}

	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<span class="stat-value">{todayCount}</span>
			<span class="stat-label">Heute</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{streak}</span>
			<span class="stat-label">Streak</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{totalLogs}</span>
			<span class="stat-label">Gesamt</span>
		</div>
	</div>

	<!-- 7-day chart -->
	<div class="week-chart">
		<div class="chart-title">Letzte 7 Tage</div>
		<div class="chart-bars">
			{#each last7Days() as day}
				<div class="bar-column">
					<div class="bar-wrapper">
						<div
							class="bar"
							style:height="{(day.count / maxCount) * 100}%"
							style:background={habit.color}
						></div>
					</div>
					<span class="bar-count">{day.count}</span>
					<span class="bar-day">{formatDayLabel(day.date)}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Log button -->
	<button
		class="log-btn"
		style:background={habit.color}
		onclick={() => habitsStore.logHabit(habit.id)}
	>
		<DynamicIcon name={habit.icon} size={18} weight="bold" class="text-white" />
		Jetzt loggen
	</button>

	<!-- Timeline -->
	<div class="log-timeline">
		<h3 class="section-title">Verlauf</h3>
		{#each [...groupedLogs.entries()] as [date, dayLogs] (date)}
			<div class="day-group">
				<div class="day-header">{formatDateLabel(date)}</div>
				{#each dayLogs as log (log.id)}
					<div class="log-entry">
						<span class="log-time">{formatTime(log.timestamp)}</span>
						{#if log.note}
							<span class="log-note">{log.note}</span>
						{/if}
						<button class="log-delete" onclick={() => handleDeleteLog(log.id)} title="Entfernen">
							<X size={12} />
						</button>
					</div>
				{/each}
			</div>
		{/each}
		{#if habitLogs.length === 0}
			<p class="empty-text">Noch keine Einträge. Tippe oben zum Loggen.</p>
		{/if}
	</div>

	<!-- Actions -->
	<div class="detail-actions">
		<button class="action-btn" onclick={handleArchive}>
			{habit.isArchived ? 'Wiederherstellen' : 'Archivieren'}
		</button>
		{#if !confirmDelete}
			<button class="action-btn danger" onclick={() => (confirmDelete = true)}> Löschen </button>
		{:else}
			<button class="action-btn danger" onclick={handleDelete}> Wirklich löschen? </button>
		{/if}
	</div>
</div>

<style>
	.habit-detail {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 480px;
	}

	.detail-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.back-btn,
	.edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: none;
		cursor: pointer;
		transition: background 0.15s;
	}
	.back-btn:hover,
	.edit-btn:hover {
		background: hsl(var(--color-muted));
	}

	.header-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.header-icon {
		display: flex;
		align-items: center;
	}

	.header-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}

	.week-chart {
		padding: 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.chart-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.75rem;
	}

	.chart-bars {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 0.5rem;
		height: 80px;
	}

	.bar-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.bar-wrapper {
		width: 100%;
		height: 60px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.bar {
		width: 100%;
		max-width: 28px;
		min-height: 2px;
		border-radius: 0.25rem 0.25rem 0 0;
		transition: height 0.3s ease-out;
	}

	.bar-count {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}

	.bar-day {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.log-btn {
		width: 100%;
		padding: 0.75rem;
		border-radius: 0.75rem;
		border: none;
		color: white;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition:
			filter 0.15s,
			transform 0.15s;
	}
	.log-btn:hover {
		filter: brightness(1.1);
	}
	.log-btn:active {
		transform: scale(0.98);
	}

	.log-timeline {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.day-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.day-header {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem 0;
	}

	.log-entry {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted));
	}

	.log-time {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}

	.log-note {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
		flex: 1;
	}

	.log-delete {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 0.25rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: none;
		cursor: pointer;
		opacity: 0;
		margin-left: auto;
		transition: all 0.15s;
	}
	.log-entry:hover .log-delete {
		opacity: 1;
	}
	.log-delete:hover {
		color: hsl(var(--color-error));
		background: rgba(239, 68, 68, 0.1);
	}

	.detail-actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.action-btn {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: hsl(var(--color-muted));
	}

	.action-btn.danger {
		color: hsl(var(--color-error));
		border-color: rgba(239, 68, 68, 0.2);
	}
	.action-btn.danger:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.empty-text {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		text-align: center;
		padding: 1.5rem 0;
	}
</style>
