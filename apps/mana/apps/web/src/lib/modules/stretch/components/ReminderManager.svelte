<!--
  ReminderManager — Configure stretch reminders (time, days, linked routine).
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { untrack } from 'svelte';
	import type { StretchReminder, StretchRoutine } from '../types';
	import { stretchStore } from '../stores/stretch.svelte';

	interface Props {
		reminders: StretchReminder[];
		routines: StretchRoutine[];
		onClose: () => void;
	}

	let { reminders, routines, onClose }: Props = $props();

	let showCreate = $state(false);
	let newName = $state(untrack(() => $_('stretch.reminders.default_name')));
	let newTime = $state('09:00');
	let newDays = $state<number[]>([1, 2, 3, 4, 5]); // Mon–Fri
	let newRoutineId = $state<string | null>(null);

	const DAY_LABELS = $derived([
		$_('stretch.reminders.day_short_0'),
		$_('stretch.reminders.day_short_1'),
		$_('stretch.reminders.day_short_2'),
		$_('stretch.reminders.day_short_3'),
		$_('stretch.reminders.day_short_4'),
		$_('stretch.reminders.day_short_5'),
		$_('stretch.reminders.day_short_6'),
	]);

	function toggleDay(day: number) {
		if (newDays.includes(day)) {
			newDays = newDays.filter((d) => d !== day);
		} else {
			newDays = [...newDays, day].sort();
		}
	}

	async function handleCreate() {
		if (!newName.trim() || newDays.length === 0) return;
		await stretchStore.createReminder({
			name: newName.trim(),
			routineId: newRoutineId,
			time: newTime,
			days: newDays,
		});
		showCreate = false;
		newName = $_('stretch.reminders.default_name');
		newTime = '09:00';
		newDays = [1, 2, 3, 4, 5];
		newRoutineId = null;
	}

	async function toggleActive(id: string) {
		await stretchStore.toggleReminder(id);
	}

	async function deleteReminder(id: string) {
		await stretchStore.deleteReminder(id);
	}
</script>

<div class="reminder-overlay">
	<div class="reminder-header">
		<button class="back-btn" onclick={onClose}>←</button>
		<span class="header-title">{$_('stretch.reminders.header_title')}</span>
	</div>

	<div class="reminder-body">
		{#each reminders as reminder (reminder.id)}
			<div class="reminder-card" class:inactive={!reminder.isActive}>
				<div class="rem-top">
					<span class="rem-name">{reminder.name}</span>
					<label class="toggle-label">
						<input
							type="checkbox"
							checked={reminder.isActive}
							onchange={() => toggleActive(reminder.id)}
						/>
						<span class="toggle-track"><span class="toggle-thumb"></span></span>
					</label>
				</div>
				<div class="rem-details">
					<span class="rem-time">{reminder.time}</span>
					<span class="rem-days">
						{reminder.days.map((d) => DAY_LABELS[d]).join(', ')}
					</span>
				</div>
				{#if reminder.routineId}
					{@const linked = routines.find((r) => r.id === reminder.routineId)}
					{#if linked}
						<span class="rem-routine">{linked.name}</span>
					{/if}
				{/if}
				<button class="rem-delete" onclick={() => deleteReminder(reminder.id)}
					>{$_('stretch.reminders.action_delete')}</button
				>
			</div>
		{/each}

		{#if showCreate}
			<div class="create-form">
				<input
					class="form-input"
					type="text"
					placeholder={$_('stretch.reminders.placeholder_name')}
					bind:value={newName}
				/>
				<input class="form-input time-input" type="time" bind:value={newTime} />
				<div class="days-row">
					{#each [0, 1, 2, 3, 4, 5, 6] as day}
						<button
							class="day-btn"
							class:active={newDays.includes(day)}
							onclick={() => toggleDay(day)}>{DAY_LABELS[day]}</button
						>
					{/each}
				</div>
				<select class="form-select" bind:value={newRoutineId}>
					<option value={null}>{$_('stretch.reminders.select_no_routine')}</option>
					{#each routines as routine}
						<option value={routine.id}>{routine.name}</option>
					{/each}
				</select>
				<div class="form-actions">
					<button class="btn-cancel" onclick={() => (showCreate = false)}
						>{$_('stretch.reminders.action_cancel')}</button
					>
					<button class="btn-save" onclick={handleCreate} disabled={newDays.length === 0}>
						{$_('stretch.reminders.action_create')}
					</button>
				</div>
			</div>
		{:else}
			<button class="add-btn" onclick={() => (showCreate = true)}>
				{$_('stretch.reminders.action_new')}
			</button>
		{/if}

		{#if reminders.length === 0 && !showCreate}
			<p class="empty-text">{$_('stretch.reminders.empty')}</p>
		{/if}
	</div>
</div>

<style>
	.reminder-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.reminder-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.back-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: none;
		font-size: 1.125rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.reminder-body {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.reminder-card {
		padding: 0.625rem 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.reminder-card.inactive {
		opacity: 0.5;
	}

	.rem-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.rem-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.toggle-label {
		position: relative;
		cursor: pointer;
	}

	.toggle-label input {
		opacity: 0;
		width: 0;
		height: 0;
		position: absolute;
	}

	.toggle-track {
		display: block;
		width: 2rem;
		height: 1.125rem;
		border-radius: 0.5625rem;
		background: hsl(var(--color-border));
		transition: background 0.2s;
		position: relative;
	}

	.toggle-label input:checked + .toggle-track {
		background: #10b981;
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 0.875rem;
		height: 0.875rem;
		border-radius: 50%;
		background: white;
		transition: transform 0.2s;
	}

	.toggle-label input:checked + .toggle-track .toggle-thumb {
		transform: translateX(0.875rem);
	}

	.rem-details {
		display: flex;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.rem-time {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.rem-routine {
		font-size: 0.6875rem;
		color: #10b981;
	}

	.rem-delete {
		align-self: flex-start;
		font-size: 0.6875rem;
		color: #ef4444;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		margin-top: 0.125rem;
	}

	/* ── Create Form ──────────────────────────────── */
	.create-form {
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-input,
	.form-select {
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}

	.form-input:focus {
		outline: none;
		border-color: #10b981;
	}

	.time-input {
		width: 7rem;
	}

	.days-row {
		display: flex;
		gap: 0.25rem;
	}

	.day-btn {
		flex: 1;
		padding: 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}

	.day-btn.active {
		background: #10b981;
		color: white;
		border-color: #10b981;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}

	.btn-cancel,
	.btn-save {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}

	.btn-cancel {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}

	.btn-save {
		background: #10b981;
		color: white;
	}

	.btn-save:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.add-btn {
		padding: 0.625rem;
		border-radius: 0.75rem;
		border: 2px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.add-btn:hover {
		border-color: #10b981;
		color: #10b981;
	}

	.empty-text {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		padding: 1.5rem 0;
		margin: 0;
	}
</style>
