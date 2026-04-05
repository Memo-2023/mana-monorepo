<!--
  FocusCard — Pomodoro focus timer UI.
  Shows a circular progress ring, phase indicator, and controls.
-->
<script lang="ts">
	import { focusStore } from '../stores/focus.svelte';
	import { Lightning, Coffee, Play, Stop, SkipForward } from '@manacore/shared-icons';

	let { compact = false }: { compact?: boolean } = $props();

	let title = $state('');

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	async function handleStart() {
		await focusStore.startFocus({ title: title.trim() || undefined });
		title = '';
	}

	// Auto-transition: focus done → suggest break, break done → suggest focus
	$effect(() => {
		if (focusStore.isTimerDone && focusStore.phase === 'focus') {
			// Play notification sound or vibrate could go here
		}
	});

	const phaseLabel = $derived(
		focusStore.phase === 'focus' ? 'Fokus' : focusStore.phase === 'break' ? 'Pause' : 'Bereit'
	);

	const phaseColor = $derived(
		focusStore.phase === 'focus' ? '#ef4444' : focusStore.phase === 'break' ? '#22c55e' : '#6b7280'
	);

	// SVG ring
	const RADIUS = 45;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	let strokeOffset = $derived(CIRCUMFERENCE * (1 - focusStore.progress));
</script>

<div class="focus-card" class:compact>
	{#if focusStore.phase === 'idle'}
		<!-- Idle state -->
		<div class="idle-content">
			<div class="idle-header">
				<Lightning size={20} weight="bold" />
				<span class="focus-label">Fokus-Modus</span>
			</div>

			<input
				class="focus-input"
				type="text"
				bind:value={title}
				placeholder="Woran arbeitest du?"
				onkeydown={(e) => {
					if (e.key === 'Enter') handleStart();
				}}
			/>

			<div class="idle-info">
				<span>{focusStore.focusMinutes}min Fokus</span>
				<span>{focusStore.breakMinutes}min Pause</span>
				{#if focusStore.completedSessions > 0}
					<span>{focusStore.completedSessions} Sessions</span>
				{/if}
			</div>

			<button class="start-btn" onclick={handleStart}>
				<Play size={16} weight="fill" />
				Fokus starten
			</button>
		</div>
	{:else}
		<!-- Active state (focus or break) -->
		<div class="active-content">
			<div class="phase-header">
				{#if focusStore.phase === 'focus'}
					<Lightning size={16} weight="bold" style="color: {phaseColor}" />
				{:else}
					<Coffee size={16} weight="bold" style="color: {phaseColor}" />
				{/if}
				<span class="phase-label" style="color: {phaseColor}">{phaseLabel}</span>
				<span class="session-count">{focusStore.completedSessions} Sessions</span>
			</div>

			<!-- Timer ring -->
			<div class="timer-ring">
				<svg viewBox="0 0 100 100" class="ring-svg">
					<circle
						cx="50"
						cy="50"
						r={RADIUS}
						fill="none"
						stroke="hsl(var(--color-border))"
						stroke-width="4"
					/>
					<circle
						cx="50"
						cy="50"
						r={RADIUS}
						fill="none"
						stroke={phaseColor}
						stroke-width="4"
						stroke-linecap="round"
						stroke-dasharray={CIRCUMFERENCE}
						stroke-dashoffset={strokeOffset}
						transform="rotate(-90 50 50)"
						class="progress-ring"
					/>
				</svg>
				<div class="timer-display">
					<span class="timer-time" class:done={focusStore.isTimerDone}>
						{formatTime(focusStore.remainingSeconds)}
					</span>
				</div>
			</div>

			<!-- Controls -->
			<div class="controls">
				{#if focusStore.isTimerDone}
					{#if focusStore.phase === 'focus'}
						<button class="control-btn primary" onclick={() => focusStore.startBreak()}>
							<Coffee size={16} />
							Pause
						</button>
					{:else}
						<button class="control-btn primary" onclick={handleStart}>
							<Lightning size={16} />
							Weiter
						</button>
					{/if}
				{:else if focusStore.phase === 'focus'}
					<button class="control-btn" onclick={() => focusStore.startBreak()}>
						<SkipForward size={16} />
					</button>
				{/if}

				<button class="control-btn danger" onclick={() => focusStore.stop()}>
					<Stop size={16} />
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.focus-card {
		border-radius: 1rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		padding: 1.5rem;
	}

	/* Idle */
	.idle-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.idle-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: hsl(var(--color-foreground));
	}

	.focus-label {
		font-size: 1rem;
		font-weight: 600;
	}

	.focus-input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-input, var(--color-background)));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		outline: none;
	}
	.focus-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.focus-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.idle-info {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.start-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem;
		border: none;
		border-radius: 0.75rem;
		background: #ef4444;
		color: white;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.start-btn:hover {
		opacity: 0.9;
	}

	/* Active */
	.active-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.phase-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.phase-label {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.session-count {
		margin-left: auto;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Timer ring */
	.timer-ring {
		position: relative;
		width: 140px;
		height: 140px;
	}

	.ring-svg {
		width: 100%;
		height: 100%;
	}

	.progress-ring {
		transition: stroke-dashoffset 1s linear;
	}

	.timer-display {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.timer-time {
		font-size: 1.75rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	.timer-time.done {
		animation: pulse-text 1s ease-in-out infinite;
	}

	@keyframes pulse-text {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	/* Controls */
	.controls {
		display: flex;
		gap: 0.5rem;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.control-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
	.control-btn.primary {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.control-btn.primary:hover {
		opacity: 0.9;
	}
	.control-btn.danger:hover {
		color: #ef4444;
		border-color: #ef4444;
	}

	/* Compact mode */
	.compact {
		padding: 1rem;
	}
	.compact .timer-ring {
		width: 100px;
		height: 100px;
	}
	.compact .timer-time {
		font-size: 1.25rem;
	}
</style>
