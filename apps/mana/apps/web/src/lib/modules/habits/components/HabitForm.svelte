<!--
  HabitForm — inline form for creating or editing a habit.
  Used both on the main page and in detail view.
-->
<script lang="ts">
	import { habitsStore } from '../stores/habits.svelte';
	import { HABIT_COLORS, type Habit, type HabitSchedule } from '../types';
	import { DynamicIcon } from '@mana/shared-ui/atoms';
	import { IconPicker } from '@mana/shared-ui/molecules';

	let {
		habit = null,
		onDone,
		onCancel,
	}: {
		habit?: Habit | null;
		onDone: () => void;
		onCancel: () => void;
	} = $props();

	let title = $state(habit?.title ?? '');
	let icon = $state(habit?.icon ?? 'star');
	let color = $state(habit?.color ?? '#6366f1');
	let targetPerDay = $state<string>(habit?.targetPerDay?.toString() ?? '');
	let defaultDurationMin = $state<string>(
		habit?.defaultDuration ? String(Math.round(habit.defaultDuration / 60)) : ''
	);
	let showIconPicker = $state(false);

	// Schedule state
	let hasSchedule = $state(!!habit?.schedule);
	let scheduleDays = $state<number[]>(habit?.schedule?.days ?? [1, 2, 3, 4, 5]); // Mon-Fri default
	let scheduleTime = $state(habit?.schedule?.time ?? '');

	const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;

		const target = targetPerDay.trim() ? parseInt(targetPerDay) : null;
		const durationSec = defaultDurationMin.trim() ? parseInt(defaultDurationMin) * 60 : null;
		const schedule: HabitSchedule | null =
			hasSchedule && scheduleDays.length > 0
				? { days: scheduleDays, time: scheduleTime || undefined }
				: null;

		if (habit) {
			await habitsStore.updateHabit(habit.id, {
				title: title.trim(),
				icon,
				color,
				targetPerDay: target,
				defaultDuration: durationSec,
			});
			await habitsStore.setSchedule(habit.id, schedule);
		} else {
			const created = await habitsStore.createHabit({
				title: title.trim(),
				icon,
				color,
				targetPerDay: target,
				defaultDuration: durationSec,
			});
			if (schedule && created) {
				await habitsStore.setSchedule(created.id, schedule);
			}
		}

		onDone();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
		if (e.key === 'Escape') {
			onCancel();
		}
	}
</script>

<form class="habit-form" onsubmit={handleSubmit} onkeydown={handleKeydown}>
	<div class="form-row">
		<button
			type="button"
			class="icon-btn"
			style:background={color}
			onclick={() => (showIconPicker = !showIconPicker)}
		>
			<DynamicIcon name={icon} size={20} weight="bold" class="text-white" />
		</button>
		<input
			class="title-input"
			type="text"
			placeholder="Habit Name..."
			bind:value={title}
			autofocus
		/>
	</div>

	{#if showIconPicker}
		<div class="icon-picker-wrapper">
			<IconPicker
				selectedIcon={icon}
				onIconChange={(i) => {
					icon = i;
					showIconPicker = false;
				}}
				size="sm"
			/>
		</div>
	{/if}

	<div class="color-picker">
		{#each HABIT_COLORS as c}
			<button
				type="button"
				class="color-swatch"
				class:selected={color === c}
				style:background={c}
				onclick={() => (color = c)}
			></button>
		{/each}
	</div>

	<div class="form-row">
		<label class="target-label">
			<span>Tagesziel</span>
			<input
				class="target-input"
				type="number"
				min="1"
				max="100"
				placeholder="-"
				bind:value={targetPerDay}
			/>
		</label>
		<label class="target-label">
			<span>Dauer (Min)</span>
			<input
				class="target-input"
				type="number"
				min="1"
				max="480"
				placeholder="-"
				bind:value={defaultDurationMin}
			/>
		</label>
	</div>

	<!-- Schedule -->
	<div class="schedule-section">
		<label class="schedule-toggle">
			<input type="checkbox" bind:checked={hasSchedule} />
			<span>Im Kalender planen</span>
		</label>

		{#if hasSchedule}
			<div class="schedule-days">
				{#each dayLabels as label, i}
					{@const active = scheduleDays.includes(i)}
					<button
						type="button"
						class="day-btn"
						class:active
						onclick={() => {
							if (active) {
								scheduleDays = scheduleDays.filter((d) => d !== i);
							} else {
								scheduleDays = [...scheduleDays, i].sort();
							}
						}}
					>
						{label}
					</button>
				{/each}
			</div>
			<input
				class="target-input"
				type="time"
				bind:value={scheduleTime}
				placeholder="Uhrzeit (optional)"
				style="width: auto;"
			/>
		{/if}
	</div>

	<div class="form-actions">
		<button type="button" class="btn-cancel" onclick={onCancel}>Abbrechen</button>
		<button type="submit" class="btn-save" disabled={!title.trim()}>
			{habit ? 'Speichern' : 'Erstellen'}
		</button>
	</div>
</form>

<style>
	.habit-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 1rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
	}

	.form-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.icon-btn {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.icon-btn:hover {
		transform: scale(1.1);
	}

	.title-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 2px solid var(--color-border, rgba(255, 255, 255, 0.15));
		color: var(--color-foreground);
		font-size: 1rem;
		padding: 0.5rem 0;
		outline: none;
	}
	.title-input:focus {
		border-color: var(--color-primary, #6366f1);
	}
	.title-input::placeholder {
		color: var(--color-muted-foreground);
	}

	.icon-picker-wrapper {
		max-height: 16rem;
		overflow-y: auto;
		border-radius: 0.5rem;
		padding: 0.5rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
	}

	.color-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.color-swatch {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.15s;
	}
	.color-swatch:hover {
		transform: scale(1.2);
	}
	.color-swatch.selected {
		border-color: white;
		box-shadow: 0 0 0 2px var(--color-primary, #6366f1);
	}

	.target-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.target-input {
		width: 4rem;
		background: transparent;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
		border-radius: 0.5rem;
		color: var(--color-foreground);
		font-size: 0.875rem;
		padding: 0.375rem 0.5rem;
		outline: none;
		text-align: center;
	}
	.target-input:focus {
		border-color: var(--color-primary, #6366f1);
	}

	.schedule-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.schedule-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		cursor: pointer;
	}
	.schedule-days {
		display: flex;
		gap: 0.25rem;
	}
	.day-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
		background: transparent;
		color: var(--color-muted-foreground);
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.day-btn:hover {
		border-color: var(--color-primary, #6366f1);
	}
	.day-btn.active {
		background: var(--color-primary, #6366f1);
		border-color: var(--color-primary, #6366f1);
		color: white;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.btn-cancel,
	.btn-save {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.15s;
	}

	.btn-cancel {
		background: transparent;
		color: var(--color-muted-foreground);
	}
	.btn-cancel:hover {
		background: var(--color-muted, rgba(255, 255, 255, 0.08));
	}

	.btn-save {
		background: var(--color-primary, #6366f1);
		color: white;
	}
	.btn-save:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-save:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
