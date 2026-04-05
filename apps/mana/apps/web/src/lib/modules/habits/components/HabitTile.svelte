<!--
  HabitTile — single tappable tile in the tally board.
  Shows icon, title, today's count, and optional target.
  Tap = log habit. Long press = undo last.
-->
<script lang="ts">
	import type { Habit } from '../types';
	import { habitsStore } from '../stores/habits.svelte';
	import { DynamicIcon } from '@mana/shared-ui/atoms';
	import { CaretRight } from '@mana/shared-icons';
	import { dragSource } from '@mana/shared-ui/dnd';

	let {
		habit,
		todayCount = 0,
		onDetail,
	}: {
		habit: Habit;
		todayCount: number;
		onDetail: (habit: Habit) => void;
	} = $props();

	let pressing = $state(false);
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let justLongPressed = $state(false);
	let animatePulse = $state(false);

	function handlePointerDown() {
		pressing = true;
		justLongPressed = false;
		pressTimer = setTimeout(() => {
			justLongPressed = true;
			pressing = false;
			habitsStore.undoLastLog(habit.id);
		}, 500);
	}

	function handlePointerUp() {
		pressing = false;
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
		if (!justLongPressed) {
			habitsStore.logHabit(habit.id);
			animatePulse = true;
			setTimeout(() => (animatePulse = false), 300);
		}
	}

	function handlePointerLeave() {
		pressing = false;
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	let isOverTarget = $derived(habit.targetPerDay !== null && todayCount >= habit.targetPerDay);

	let progressPercent = $derived(
		habit.targetPerDay ? Math.min(100, (todayCount / habit.targetPerDay) * 100) : 0
	);
</script>

<div
	class="habit-tile-wrapper"
	use:dragSource={{
		type: 'habit',
		data: () => ({
			id: habit.id,
			title: habit.title,
			color: habit.color,
			icon: habit.icon,
		}),
		longPressMs: 600,
	}}
>
	<button
		class="habit-tile"
		class:pressing
		class:pulse={animatePulse}
		class:over-target={isOverTarget}
		style:--habit-color={habit.color}
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerLeave}
	>
		{#if habit.targetPerDay}
			<div class="progress-ring" style:--progress="{progressPercent}%"></div>
		{/if}
		<span class="icon">
			<DynamicIcon name={habit.icon} size={32} weight="bold" class="text-white" />
		</span>
		<span class="title">{habit.title}</span>
		<span class="count">
			{todayCount}{#if habit.targetPerDay}<span class="target">/{habit.targetPerDay}</span>{/if}
		</span>
	</button>
	<button class="detail-btn" onclick={() => onDetail(habit)} title="Details">
		<CaretRight size={14} />
	</button>
</div>

<style>
	.habit-tile-wrapper {
		position: relative;
	}

	.habit-tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 1rem;
		background: var(--habit-color);
		background: linear-gradient(
			135deg,
			var(--habit-color),
			color-mix(in srgb, var(--habit-color) 70%, black)
		);
		color: white;
		cursor: pointer;
		user-select: none;
		touch-action: manipulation;
		border: none;
		overflow: hidden;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.habit-tile:hover {
		transform: scale(1.03);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}

	.habit-tile.pressing {
		transform: scale(0.95);
	}

	.habit-tile.pulse {
		animation: tap-pulse 300ms ease-out;
	}

	.habit-tile.over-target {
		box-shadow:
			0 0 0 3px rgba(255, 255, 255, 0.3),
			0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.progress-ring {
		position: absolute;
		inset: 0;
		border-radius: 1rem;
		background: conic-gradient(
			rgba(255, 255, 255, 0.2) var(--progress),
			transparent var(--progress)
		);
		pointer-events: none;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		position: relative;
		z-index: 1;
	}

	.title {
		font-size: 0.75rem;
		font-weight: 600;
		opacity: 0.9;
		position: relative;
		z-index: 1;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		max-width: 90%;
	}

	.count {
		font-size: 1.25rem;
		font-weight: 700;
		position: relative;
		z-index: 1;
	}

	.target {
		font-size: 0.75rem;
		font-weight: 400;
		opacity: 0.7;
	}

	.detail-btn {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border: none;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s;
		z-index: 2;
	}

	.habit-tile-wrapper:hover .detail-btn {
		opacity: 1;
	}

	@keyframes tap-pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5);
		}
		100% {
			box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
		}
	}
</style>
