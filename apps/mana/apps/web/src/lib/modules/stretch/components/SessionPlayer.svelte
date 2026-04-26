<!--
  SessionPlayer — Timer-guided stretching session.
  Fullscreen overlay with exercise instructions, countdown, side-switch, skip/pause.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { StretchRoutine, StretchExercise, RoutineExercise } from '../types';
	import { BODY_REGION_LABELS } from '../types';
	import { stretchStore } from '../stores/stretch.svelte';

	interface Props {
		routine: StretchRoutine;
		exercises: StretchExercise[];
		onComplete: () => void;
		onCancel: () => void;
	}

	let { routine, exercises, onComplete, onCancel }: Props = $props();

	// ─── State ──────────────────────────────────────
	type SessionPhase = 'ready' | 'exercise' | 'side_switch' | 'rest' | 'finished';

	let sessionId = $state<string | null>(null);
	let phase = $state<SessionPhase>('ready');
	let currentIndex = $state(0);
	let currentSide = $state<'left' | 'right' | null>(null);
	let timeRemaining = $state(0);
	let totalTime = $state(0);
	let isPaused = $state(false);
	let skippedIds = $state<string[]>([]);
	let completedCount = $state(0);
	let sessionStartTime = $state(0);
	let moodRating = $state<number | null>(null);

	// Timer internals
	let timerRef = $state<number | null>(null);
	let lastTick = $state(0);

	let slots = $derived(routine.exercises);
	let currentSlot = $derived<RoutineExercise | null>(slots[currentIndex] ?? null);
	let currentExercise = $derived(
		currentSlot ? (exercises.find((e) => e.id === currentSlot.exerciseId) ?? null) : null
	);
	let totalSlots = $derived(slots.length);
	let progress = $derived(totalSlots > 0 ? currentIndex / totalSlots : 0);
	let timerProgress = $derived(totalTime > 0 ? 1 - timeRemaining / totalTime : 0);

	function formatTime(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}`;
	}

	// ─── Timer Engine ───────────────────────────────
	function startTimer(seconds: number) {
		timeRemaining = seconds;
		totalTime = seconds;
		isPaused = false;
		lastTick = performance.now();
		tick();
	}

	function tick() {
		if (isPaused) return;
		const now = performance.now();
		const elapsed = (now - lastTick) / 1000;
		lastTick = now;
		timeRemaining = Math.max(0, timeRemaining - elapsed);

		if (timeRemaining <= 0) {
			handleTimerEnd();
			return;
		}

		timerRef = requestAnimationFrame(tick);
	}

	function togglePause() {
		isPaused = !isPaused;
		if (!isPaused) {
			lastTick = performance.now();
			tick();
		}
	}

	function handleTimerEnd() {
		if (timerRef) cancelAnimationFrame(timerRef);

		if (phase === 'exercise') {
			if (currentExercise?.bilateral && currentSide === 'left') {
				// Switch to right side
				currentSide = 'right';
				phase = 'side_switch';
				startTimer(3); // 3s side-switch countdown
				return;
			}

			completedCount++;

			if (currentSlot && currentSlot.restAfterSec > 0 && currentIndex < totalSlots - 1) {
				phase = 'rest';
				startTimer(currentSlot.restAfterSec);
			} else {
				nextExercise();
			}
		} else if (phase === 'side_switch') {
			phase = 'exercise';
			startTimer(currentSlot?.durationSec ?? 30);
		} else if (phase === 'rest') {
			nextExercise();
		}
	}

	function nextExercise() {
		if (currentIndex >= totalSlots - 1) {
			finishSession();
			return;
		}
		currentIndex++;
		startExercise();
	}

	function startExercise() {
		const ex = exercises.find((e) => e.id === slots[currentIndex]?.exerciseId);
		phase = 'exercise';
		currentSide = ex?.bilateral ? 'left' : null;
		startTimer(slots[currentIndex]?.durationSec ?? 30);
	}

	function skipExercise() {
		if (timerRef) cancelAnimationFrame(timerRef);
		if (currentSlot) {
			skippedIds = [...skippedIds, currentSlot.exerciseId];
		}
		nextExercise();
	}

	function previousExercise() {
		if (currentIndex <= 0) return;
		if (timerRef) cancelAnimationFrame(timerRef);
		currentIndex--;
		startExercise();
	}

	// ─── Session Lifecycle ──────────────────────────
	async function startSession() {
		sessionStartTime = Date.now();
		const session = await stretchStore.startSession({
			routineId: routine.id,
			routineName: routine.name,
			totalExercises: totalSlots,
		});
		sessionId = session.id;
		currentIndex = 0;
		completedCount = 0;
		skippedIds = [];
		startExercise();
	}

	async function finishSession() {
		if (timerRef) cancelAnimationFrame(timerRef);
		phase = 'finished';
		const totalDurationSec = Math.round((Date.now() - sessionStartTime) / 1000);

		if (sessionId) {
			await stretchStore.finishSession(sessionId, {
				totalDurationSec,
				completedExercises: completedCount,
				skippedExerciseIds: skippedIds,
				mood: moodRating,
			});
		}
	}

	async function handleFinishWithMood() {
		if (sessionId && moodRating) {
			await stretchStore.finishSession(sessionId, {
				totalDurationSec: Math.round((Date.now() - sessionStartTime) / 1000),
				completedExercises: completedCount,
				skippedExerciseIds: skippedIds,
				mood: moodRating,
			});
		}
		onComplete();
	}

	function handleCancel() {
		if (timerRef) cancelAnimationFrame(timerRef);
		onCancel();
	}

	// Request wake lock to keep screen on
	let wakeLock = $state<WakeLockSentinel | null>(null);
	$effect(() => {
		if (phase !== 'ready' && phase !== 'finished' && 'wakeLock' in navigator) {
			navigator.wakeLock
				.request('screen')
				.then((wl) => {
					wakeLock = wl;
				})
				.catch(() => {});
		}
		return () => {
			wakeLock?.release().catch(() => {});
		};
	});
</script>

<div class="player-overlay">
	{#if phase === 'ready'}
		<!-- Ready Screen -->
		<div class="ready-screen">
			<button class="close-btn" onclick={handleCancel}>×</button>
			<div class="ready-content">
				<h2 class="ready-title">{routine.name}</h2>
				<p class="ready-desc">{routine.description}</p>
				<p class="ready-meta">
					{$_('stretch.player.ready_meta', {
						values: { count: totalSlots, minutes: routine.estimatedDurationMin },
					})}
				</p>
				<button class="start-btn" onclick={startSession}>
					{$_('stretch.player.action_start')}
				</button>
			</div>
		</div>
	{:else if phase === 'finished'}
		<!-- Finish Screen -->
		<div class="finish-screen">
			<div class="finish-content">
				<div class="finish-check">&#10003;</div>
				<h2 class="finish-title">{$_('stretch.player.finish_title')}</h2>
				<p class="finish-stats">
					{$_('stretch.player.finish_stats', {
						values: {
							completed: completedCount,
							total: totalSlots,
							minutes: Math.round((Date.now() - sessionStartTime) / 60000),
						},
					})}
				</p>
				{#if skippedIds.length > 0}
					<p class="finish-skipped">
						{$_('stretch.player.finish_skipped', { values: { count: skippedIds.length } })}
					</p>
				{/if}
				<div class="mood-section">
					<p class="mood-label">{$_('stretch.player.mood_label')}</p>
					<div class="mood-row">
						{#each [1, 2, 3, 4, 5] as val}
							<button
								class="mood-btn"
								class:selected={moodRating === val}
								onclick={() => (moodRating = val)}
							>
								{['😫', '😕', '😐', '😊', '🤩'][val - 1]}
							</button>
						{/each}
					</div>
				</div>
				<button class="done-btn" onclick={handleFinishWithMood}
					>{$_('stretch.player.action_done')}</button
				>
			</div>
		</div>
	{:else}
		<!-- Active Session -->
		<div class="active-screen">
			<div class="player-header">
				<button class="close-btn" onclick={handleCancel}>×</button>
				<span class="exercise-counter">{currentIndex + 1} / {totalSlots}</span>
				{#if isPaused}
					<span class="pause-badge">{$_('stretch.player.pause_badge')}</span>
				{/if}
			</div>

			<div class="exercise-display">
				{#if currentExercise}
					<h2 class="exercise-name">{currentExercise.name}</h2>
					{#if currentSide}
						<span class="side-badge"
							>{currentSide === 'left'
								? $_('stretch.player.side_left')
								: $_('stretch.player.side_right')}</span
						>
					{/if}
					<span class="exercise-region"
						>{BODY_REGION_LABELS[currentExercise.bodyRegion]?.de ?? ''}</span
					>
					<p class="exercise-instruction">{currentExercise.description}</p>
				{/if}

				{#if phase === 'side_switch'}
					<div class="side-switch-notice">{$_('stretch.player.side_switch_notice')}</div>
				{:else if phase === 'rest'}
					<div class="rest-notice">{$_('stretch.player.rest_notice')}</div>
				{/if}
			</div>

			<!-- Timer -->
			<div class="timer-section">
				<div class="timer-display">{formatTime(Math.ceil(timeRemaining))}</div>
				<div class="timer-bar">
					<div class="timer-fill" style:width="{timerProgress * 100}%"></div>
				</div>
			</div>

			<!-- Controls -->
			<div class="controls">
				<button class="ctrl-btn" onclick={previousExercise} disabled={currentIndex <= 0}>
					{$_('stretch.player.action_back')}
				</button>
				<button class="ctrl-btn pause-btn" onclick={togglePause}>
					{isPaused ? $_('stretch.player.action_resume') : $_('stretch.player.action_pause')}
				</button>
				<button class="ctrl-btn" onclick={skipExercise}>
					{$_('stretch.player.action_next')}
				</button>
			</div>

			<!-- Overall Progress -->
			<div class="overall-bar">
				<div class="overall-fill" style:width="{progress * 100}%"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.player-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
	}

	/* ── Close ────────────────────────────────────── */
	.close-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
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
		z-index: 10;
	}

	/* ── Ready ────────────────────────────────────── */
	.ready-screen {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.ready-content {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem;
	}

	.ready-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.ready-desc {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		max-width: 320px;
		margin: 0;
	}

	.ready-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.start-btn {
		margin-top: 1rem;
		padding: 0.75rem 2.5rem;
		border-radius: 2rem;
		background: #10b981;
		color: white;
		border: none;
		font-size: 1.125rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			transform 0.15s,
			filter 0.15s;
	}

	.start-btn:hover {
		filter: brightness(1.1);
		transform: scale(1.03);
	}

	/* ── Active ───────────────────────────────────── */
	.active-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		gap: 1rem;
	}

	.player-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.exercise-counter {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
	}

	.pause-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 1rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Exercise Display ─────────────────────────── */
	.exercise-display {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
		padding: 1rem;
	}

	.exercise-name {
		font-size: 1.375rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.side-badge {
		display: inline-block;
		padding: 0.125rem 0.625rem;
		border-radius: 1rem;
		background: #10b981;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.exercise-region {
		font-size: 0.6875rem;
		color: #10b981;
		font-weight: 500;
	}

	.exercise-instruction {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		max-width: 360px;
		line-height: 1.5;
		margin: 0;
	}

	.side-switch-notice,
	.rest-notice {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.5rem;
	}

	/* ── Timer ────────────────────────────────────── */
	.timer-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.timer-display {
		font-size: 3rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		line-height: 1;
	}

	.timer-bar {
		width: 100%;
		max-width: 300px;
		height: 6px;
		border-radius: 3px;
		background: hsl(var(--color-border));
		overflow: hidden;
	}

	.timer-fill {
		height: 100%;
		border-radius: 3px;
		background: #10b981;
		transition: width 0.1s linear;
	}

	/* ── Controls ─────────────────────────────────── */
	.controls {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
	}

	.ctrl-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.ctrl-btn:hover:not(:disabled) {
		background: hsl(var(--color-border));
	}

	.ctrl-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.pause-btn {
		background: #10b981;
		color: white;
		border-color: #10b981;
	}

	.pause-btn:hover {
		filter: brightness(1.1);
		background: #10b981;
	}

	/* ── Overall Progress ─────────────────────────── */
	.overall-bar {
		width: 100%;
		height: 3px;
		border-radius: 1.5px;
		background: hsl(var(--color-border));
		overflow: hidden;
	}

	.overall-fill {
		height: 100%;
		background: #10b981;
		transition: width 0.3s ease;
	}

	/* ── Finish ───────────────────────────────────── */
	.finish-screen {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.finish-content {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem;
	}

	.finish-check {
		font-size: 3rem;
		color: #10b981;
		line-height: 1;
	}

	.finish-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.finish-stats {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.finish-skipped {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.mood-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.mood-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.mood-row {
		display: flex;
		gap: 0.5rem;
	}

	.mood-btn {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: 2px solid transparent;
		font-size: 1.25rem;
		cursor: pointer;
		transition:
			transform 0.15s,
			border-color 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mood-btn:hover {
		transform: scale(1.15);
	}

	.mood-btn.selected {
		border-color: #10b981;
		transform: scale(1.15);
	}

	.done-btn {
		margin-top: 0.75rem;
		padding: 0.625rem 2rem;
		border-radius: 2rem;
		background: #10b981;
		color: white;
		border: none;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	.done-btn:hover {
		filter: brightness(1.1);
	}
</style>
