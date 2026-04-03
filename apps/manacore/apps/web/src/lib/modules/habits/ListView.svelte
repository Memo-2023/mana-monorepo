<!--
  Habits — Workbench ListView
  Compact tally view with tap-to-log and today's counts.
-->
<script lang="ts">
	import {
		useAllHabits,
		useAllHabitLogs,
		getActiveHabits,
		getTodayCounts,
		todayStr,
		formatTime,
	} from './queries';
	import { habitsStore } from './stores/habits.svelte';
	import type { Habit, HabitLog } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	let habits$ = useAllHabits();
	let logs$ = useAllHabitLogs();
	let habits = $state<Habit[]>([]);
	let logs = $state<HabitLog[]>([]);

	$effect(() => {
		const sub = habits$.subscribe((val) => {
			habits = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = logs$.subscribe((val) => {
			logs = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	let activeHabits = $derived(getActiveHabits(habits));
	let todayCounts = $derived(getTodayCounts(habits, logs));

	let todayLogs = $derived(
		logs
			.filter((l) => l.timestamp.startsWith(todayStr()))
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
			.slice(0, 10)
	);

	let habitMap = $derived(new Map(habits.map((h) => [h.id, h])));

	let animatingId = $state<string | null>(null);
	let showCreate = $state(false);
	let newTitle = $state('');
	let newEmoji = $state('\u2b50');
	let newColor = $state('#8b5cf6');
	let showEmojiPicker = $state(false);

	const QUICK_EMOJIS = [
		'\u2615',
		'\ud83d\udca7',
		'\ud83d\udcaa',
		'\ud83e\uddd8',
		'\ud83c\udfc3',
		'\ud83d\udcda',
		'\ud83c\udf4e',
		'\ud83d\udc8a',
		'\ud83c\udf7a',
		'\ud83d\udecc',
		'\ud83c\udfb5',
		'\ud83d\udeb4',
		'\ud83d\udcdd',
		'\ud83d\ude2e\u200d\ud83d\udca8',
		'\ud83e\uddfc',
		'\u2b50',
	];
	const QUICK_COLORS = [
		'#ef4444',
		'#f97316',
		'#f59e0b',
		'#22c55e',
		'#06b6d4',
		'#3b82f6',
		'#6366f1',
		'#8b5cf6',
		'#d946ef',
		'#ec4899',
	];

	async function handleTap(habitId: string) {
		await habitsStore.logHabit(habitId);
		animatingId = habitId;
		setTimeout(() => (animatingId = null), 300);
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newTitle.trim()) return;
		await habitsStore.createHabit({
			title: newTitle.trim(),
			emoji: newEmoji,
			color: newColor,
		});
		newTitle = '';
		newEmoji = '\u2b50';
		showCreate = false;
		showEmojiPicker = false;
	}

	function handleCreateKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleCreate(e);
		}
		if (e.key === 'Escape') {
			showCreate = false;
			showEmojiPicker = false;
		}
	}
</script>

<div class="habits-list-view">
	<!-- Tally Grid -->
	<div class="tally-grid">
		{#each activeHabits as habit (habit.id)}
			{@const count = todayCounts.get(habit.id) ?? 0}
			{@const overTarget = habit.targetPerDay !== null && count >= habit.targetPerDay}
			<button
				class="tally-item"
				class:over-target={overTarget}
				class:pulse={animatingId === habit.id}
				onclick={() => handleTap(habit.id)}
			>
				<span class="tally-emoji">{habit.emoji}</span>
				<span class="tally-count" style:color={habit.color}>
					{count}{#if habit.targetPerDay}<span class="tally-target">/{habit.targetPerDay}</span
						>{/if}
				</span>
				<span class="tally-name">{habit.title}</span>
			</button>
		{/each}

		<!-- Add button in grid -->
		{#if !showCreate}
			<button class="tally-item add-btn" onclick={() => (showCreate = true)}>
				<span class="add-icon">+</span>
				<span class="tally-name">Neu</span>
			</button>
		{/if}
	</div>

	<!-- Inline Create Form -->
	{#if showCreate}
		<form class="create-form" onsubmit={handleCreate} onkeydown={handleCreateKeydown}>
			<div class="create-row">
				<button
					type="button"
					class="emoji-btn"
					style:background={newColor}
					onclick={() => (showEmojiPicker = !showEmojiPicker)}
				>
					{newEmoji}
				</button>
				<input
					class="create-input"
					type="text"
					placeholder="Habit Name..."
					bind:value={newTitle}
					autofocus
				/>
			</div>
			{#if showEmojiPicker}
				<div class="emoji-row">
					{#each QUICK_EMOJIS as e}
						<button
							type="button"
							class="emoji-opt"
							class:selected={newEmoji === e}
							onclick={() => {
								newEmoji = e;
								showEmojiPicker = false;
							}}>{e}</button
						>
					{/each}
				</div>
			{/if}
			<div class="color-row">
				{#each QUICK_COLORS as c}
					<button
						type="button"
						class="color-dot"
						class:selected={newColor === c}
						style:background={c}
						onclick={() => (newColor = c)}
					></button>
				{/each}
			</div>
			<div class="create-actions">
				<button
					type="button"
					class="btn-cancel"
					onclick={() => {
						showCreate = false;
						showEmojiPicker = false;
					}}>Abbrechen</button
				>
				<button type="submit" class="btn-create" disabled={!newTitle.trim()}>Erstellen</button>
			</div>
		</form>
	{/if}

	<!-- Recent Logs -->
	{#if todayLogs.length > 0}
		<div class="recent-logs">
			<div class="recent-label">Heute</div>
			{#each todayLogs as log (log.id)}
				{@const habit = habitMap.get(log.habitId)}
				{#if habit}
					<div class="log-row">
						<span class="log-emoji">{habit.emoji}</span>
						<span class="log-name">{habit.title}</span>
						<span class="log-time">{formatTime(log.timestamp)}</span>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	{#if activeHabits.length === 0 && !showCreate}
		<div class="empty">
			<p>Noch keine Habits angelegt.</p>
			<button class="empty-add-btn" onclick={() => (showCreate = true)}
				>Erstes Habit erstellen</button
			>
		</div>
	{/if}
</div>

<style>
	.habits-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.tally-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 0.5rem;
	}

	.tally-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.5rem 0.25rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		cursor: pointer;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
		user-select: none;
		touch-action: manipulation;
	}

	.tally-item:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.tally-item:active {
		transform: scale(0.95);
	}

	.tally-item.pulse {
		animation: tap-pulse 300ms ease-out;
	}

	.tally-item.over-target {
		border-color: rgba(34, 197, 94, 0.3);
		background: rgba(34, 197, 94, 0.06);
	}

	.tally-emoji {
		font-size: 1.25rem;
		line-height: 1;
	}

	.tally-count {
		font-size: 1.125rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.tally-target {
		font-size: 0.6875rem;
		font-weight: 400;
		opacity: 0.6;
	}

	.tally-name {
		font-size: 0.625rem;
		color: var(--color-muted-foreground);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		max-width: 100%;
	}

	.recent-logs {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.recent-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted-foreground);
		padding: 0.25rem 0;
	}

	.log-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.log-emoji {
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.log-name {
		color: var(--color-foreground);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.log-time {
		color: var(--color-muted-foreground);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.add-btn {
		border: 2px dashed var(--color-border, rgba(255, 255, 255, 0.15));
		background: transparent;
	}
	.add-btn:hover {
		border-color: var(--color-primary, #6366f1);
		color: var(--color-primary, #6366f1);
	}

	.add-icon {
		font-size: 1.25rem;
		font-weight: 300;
		line-height: 1;
		color: var(--color-muted-foreground);
	}
	.add-btn:hover .add-icon {
		color: var(--color-primary, #6366f1);
	}

	/* ── Create Form ──────────────────────────────── */
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
	}

	.create-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.emoji-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.emoji-btn:hover {
		transform: scale(1.1);
	}

	.create-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 2px solid var(--color-border, rgba(255, 255, 255, 0.15));
		color: var(--color-foreground);
		font-size: 0.875rem;
		padding: 0.375rem 0;
		outline: none;
	}
	.create-input:focus {
		border-color: var(--color-primary, #6366f1);
	}
	.create-input::placeholder {
		color: var(--color-muted-foreground);
	}

	.emoji-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.125rem;
	}

	.emoji-opt {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		background: transparent;
		border: 2px solid transparent;
		cursor: pointer;
	}
	.emoji-opt:hover {
		background: rgba(255, 255, 255, 0.08);
	}
	.emoji-opt.selected {
		border-color: var(--color-primary, #6366f1);
	}

	.color-row {
		display: flex;
		gap: 0.25rem;
	}

	.color-dot {
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.15s;
	}
	.color-dot:hover {
		transform: scale(1.25);
	}
	.color-dot.selected {
		border-color: white;
		box-shadow: 0 0 0 1px var(--color-primary, #6366f1);
	}

	.create-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}

	.btn-cancel,
	.btn-create {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}

	.btn-cancel {
		background: transparent;
		color: var(--color-muted-foreground);
	}
	.btn-cancel:hover {
		background: var(--color-muted, rgba(255, 255, 255, 0.08));
	}

	.btn-create {
		background: var(--color-primary, #6366f1);
		color: white;
	}
	.btn-create:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-create:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ── Empty / Misc ─────────────────────────────── */
	.empty {
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		padding: 2rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.empty-add-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: var(--color-primary, #6366f1);
		color: white;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: filter 0.15s;
	}
	.empty-add-btn:hover {
		filter: brightness(1.1);
	}

	@keyframes tap-pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
		}
		100% {
			box-shadow: 0 0 0 12px rgba(139, 92, 246, 0);
		}
	}
</style>
