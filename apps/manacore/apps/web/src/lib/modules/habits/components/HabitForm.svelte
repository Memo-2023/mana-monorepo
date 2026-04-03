<!--
  HabitForm — inline form for creating or editing a habit.
  Used both on the main page and in detail view.
-->
<script lang="ts">
	import { habitsStore } from '../stores/habits.svelte';
	import { HABIT_COLORS, HABIT_EMOJIS, type Habit } from '../types';

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
	let emoji = $state(habit?.emoji ?? '\u2b50');
	let color = $state(habit?.color ?? '#6366f1');
	let targetPerDay = $state<string>(habit?.targetPerDay?.toString() ?? '');
	let showEmojiPicker = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;

		const target = targetPerDay.trim() ? parseInt(targetPerDay) : null;

		if (habit) {
			await habitsStore.updateHabit(habit.id, {
				title: title.trim(),
				emoji,
				color,
				targetPerDay: target,
			});
		} else {
			await habitsStore.createHabit({
				title: title.trim(),
				emoji,
				color,
				targetPerDay: target,
			});
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
			class="emoji-btn"
			style:background={color}
			onclick={() => (showEmojiPicker = !showEmojiPicker)}
		>
			{emoji}
		</button>
		<input
			class="title-input"
			type="text"
			placeholder="Habit Name..."
			bind:value={title}
			autofocus
		/>
	</div>

	{#if showEmojiPicker}
		<div class="emoji-picker">
			{#each HABIT_EMOJIS as e}
				<button
					type="button"
					class="emoji-option"
					class:selected={emoji === e}
					onclick={() => {
						emoji = e;
						showEmojiPicker = false;
					}}
				>
					{e}
				</button>
			{/each}
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

	.emoji-btn {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.emoji-btn:hover {
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

	.emoji-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.emoji-option {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		background: transparent;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s;
	}
	.emoji-option:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	.emoji-option.selected {
		border-color: var(--color-primary, #6366f1);
		background: rgba(99, 102, 241, 0.15);
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
