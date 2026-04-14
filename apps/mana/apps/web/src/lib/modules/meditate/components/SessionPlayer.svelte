<!--
  SessionPlayer — fullscreen meditation session overlay.
  Timer, breathing animation, body scan steps, mood tracking, gong.
-->
<script lang="ts">
	import type { MeditatePreset, MeditateCategory } from '../types';
	import { meditateStore } from '../stores/meditate.svelte';
	import { formatDuration } from '../queries';
	import BreathingCircle from './BreathingCircle.svelte';
	import MoodPicker from './MoodPicker.svelte';

	interface Props {
		preset: MeditatePreset;
		onComplete: () => void;
		onCancel: () => void;
	}

	let { preset, onComplete, onCancel }: Props = $props();

	// ─── State ──────────────────────────────────────
	type SessionPhase = 'mood_before' | 'countdown' | 'active' | 'finishing' | 'mood_after';

	let phase = $state<SessionPhase>('mood_before');
	let initialDuration = $derived(preset.defaultDurationSec);
	let timeRemaining = $state(0);
	let totalDuration = $state(0);

	// Initialize from preset
	$effect(() => {
		timeRemaining = initialDuration;
		totalDuration = initialDuration;
	});
	let isPaused = $state(false);
	let moodBefore = $state<number | null>(null);
	let moodAfter = $state<number | null>(null);
	let notes = $state('');
	let countdownValue = $state(3);
	let sessionStartTime = $state('');
	let currentBodyScanStep = $state(0);

	// Timer internals
	let timerRef = $state<number | null>(null);
	let lastTick = $state(0);

	let displayTime = $derived(formatDuration(Math.ceil(timeRemaining)));
	let progress = $derived(totalDuration > 0 ? 1 - timeRemaining / totalDuration : 0);
	let isBreathing = $derived(preset.category === 'breathing' && preset.breathPattern !== null);
	let isBodyScan = $derived(preset.category === 'bodyscan' && preset.bodyScanSteps !== null);
	let bodyScanStepCount = $derived(preset.bodyScanSteps?.length ?? 0);
	let bodyScanStepText = $derived(preset.bodyScanSteps?.[currentBodyScanStep] ?? '');
	let bodyScanTimePerStep = $derived(
		bodyScanStepCount > 0 ? totalDuration / bodyScanStepCount : totalDuration
	);

	// ─── Timer Engine ───────────────────────────────
	function startTimer() {
		timeRemaining = totalDuration;
		isPaused = false;
		lastTick = performance.now();
		sessionStartTime = new Date().toISOString();
		tick();
	}

	function tick() {
		if (isPaused) return;
		const now = performance.now();
		const elapsed = (now - lastTick) / 1000;
		lastTick = now;
		timeRemaining = Math.max(0, timeRemaining - elapsed);

		// Update body scan step based on elapsed time
		if (isBodyScan && bodyScanStepCount > 0) {
			const elapsedTotal = totalDuration - timeRemaining;
			currentBodyScanStep = Math.min(
				Math.floor(elapsedTotal / bodyScanTimePerStep),
				bodyScanStepCount - 1
			);
		}

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
		playGong();
		phase = 'mood_after';
	}

	function stopSession() {
		if (timerRef) cancelAnimationFrame(timerRef);
		phase = 'finishing';
	}

	// ─── Audio (Web Audio API — no external files needed) ───
	function playGong() {
		try {
			const ctx = new AudioContext();
			const now = ctx.currentTime;

			// Sine tone at ~220 Hz with slow decay = bell/gong character
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(220, now);
			osc.frequency.exponentialRampToValueAtTime(180, now + 2);

			// Second harmonic for richness
			const osc2 = ctx.createOscillator();
			osc2.type = 'sine';
			osc2.frequency.setValueAtTime(440, now);
			osc2.frequency.exponentialRampToValueAtTime(360, now + 1.5);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.4, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

			const gain2 = ctx.createGain();
			gain2.gain.setValueAtTime(0.15, now);
			gain2.gain.exponentialRampToValueAtTime(0.001, now + 2);

			osc.connect(gain).connect(ctx.destination);
			osc2.connect(gain2).connect(ctx.destination);

			osc.start(now);
			osc.stop(now + 3);
			osc2.start(now);
			osc2.stop(now + 2);
		} catch {
			// Audio not available — not critical
		}
	}

	// ─── Phase Transitions ──────────────────────────
	function startCountdown() {
		phase = 'countdown';
		countdownValue = 3;
		const interval = setInterval(() => {
			countdownValue--;
			if (countdownValue <= 0) {
				clearInterval(interval);
				phase = 'active';
				playGong();
				startTimer();
			}
		}, 1000);
	}

	function skipMoodBefore() {
		startCountdown();
	}

	function selectMoodBefore(mood: number) {
		moodBefore = mood;
		startCountdown();
	}

	function selectMoodAfter(mood: number) {
		moodAfter = mood;
	}

	async function saveAndFinish() {
		const actualDuration = Math.round(totalDuration - timeRemaining);
		await meditateStore.logSession({
			presetId: preset.id,
			category: preset.category,
			startedAt: sessionStartTime || new Date().toISOString(),
			durationSec: actualDuration,
			completed: timeRemaining <= 0,
			moodBefore,
			moodAfter,
			notes: notes.trim() || null,
		});
		onComplete();
	}

	async function cancelEarly() {
		if (phase === 'active' || phase === 'finishing') {
			const actualDuration = Math.round(totalDuration - timeRemaining);
			if (actualDuration > 10) {
				// Save partial session
				await meditateStore.logSession({
					presetId: preset.id,
					category: preset.category,
					startedAt: sessionStartTime || new Date().toISOString(),
					durationSec: actualDuration,
					completed: false,
					moodBefore,
					moodAfter: null,
					notes: null,
				});
			}
		}
		if (timerRef) cancelAnimationFrame(timerRef);
		onCancel();
	}

	// Cleanup on unmount
	$effect(() => {
		return () => {
			if (timerRef) cancelAnimationFrame(timerRef);
		};
	});
</script>

<div class="session-overlay">
	<!-- Close button -->
	<button type="button" class="close-btn" onclick={cancelEarly}> ✕ </button>

	{#if phase === 'mood_before'}
		<!-- Mood before meditation -->
		<div class="center-content">
			<h2 class="phase-title">{preset.name}</h2>
			<p class="phase-subtitle">Wie fühlst du dich gerade?</p>
			<div class="mood-section">
				<MoodPicker value={moodBefore} onSelect={selectMoodBefore} label="Stimmung vorher" />
			</div>
			<button type="button" class="skip-btn" onclick={skipMoodBefore}> Überspringen </button>
		</div>
	{:else if phase === 'countdown'}
		<!-- 3-2-1 countdown -->
		<div class="center-content">
			<div class="countdown-number">{countdownValue}</div>
			<p class="phase-subtitle">Mach es dir bequem…</p>
		</div>
	{:else if phase === 'active'}
		<!-- Active meditation -->
		<div class="center-content">
			{#if isBreathing && preset.breathPattern}
				<BreathingCircle pattern={preset.breathPattern} isActive={!isPaused} />
			{:else if isBodyScan}
				<div class="bodyscan-container">
					<div class="bodyscan-step-indicator">
						{currentBodyScanStep + 1} / {bodyScanStepCount}
					</div>
					<p class="bodyscan-text">{bodyScanStepText}</p>
				</div>
			{:else}
				<!-- Silence: minimal visual -->
				<div class="silence-circle"></div>
			{/if}

			<div class="timer-display">{displayTime}</div>

			<!-- Progress bar -->
			<div class="progress-bar">
				<div class="progress-fill" style:width="{progress * 100}%"></div>
			</div>

			<!-- Controls -->
			<div class="controls">
				<button type="button" class="control-btn" onclick={togglePause}>
					{isPaused ? '▶' : '⏸'}
				</button>
				<button type="button" class="control-btn control-stop" onclick={stopSession}> ⏹ </button>
			</div>
		</div>
	{:else if phase === 'finishing'}
		<!-- Confirm stop early -->
		<div class="center-content">
			<h2 class="phase-title">Session beenden?</h2>
			<p class="phase-subtitle">
				Du hast {formatDuration(Math.round(totalDuration - timeRemaining))} meditiert.
			</p>
			<div class="finish-actions">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={() => {
						phase = 'active';
						lastTick = performance.now();
						isPaused = false;
						tick();
					}}
				>
					Weitermachen
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={() => {
						phase = 'mood_after';
					}}
				>
					Beenden
				</button>
			</div>
		</div>
	{:else if phase === 'mood_after'}
		<!-- Post-session: mood + notes -->
		<div class="center-content">
			<h2 class="phase-title">Geschafft!</h2>
			<p class="phase-subtitle">
				{formatDuration(Math.round(totalDuration - timeRemaining))} meditiert
			</p>
			<div class="mood-section">
				<MoodPicker value={moodAfter} onSelect={selectMoodAfter} label="Stimmung nachher" />
			</div>
			<div class="notes-section">
				<textarea
					class="notes-input"
					bind:value={notes}
					placeholder="Wie war's? (optional)"
					rows="3"
				></textarea>
			</div>
			<button type="button" class="btn btn-primary save-btn" onclick={saveAndFinish}>
				Speichern
			</button>
		</div>
	{/if}
</div>

<style>
	.session-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--color-background));
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-muted-foreground));
		font-size: 1.1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: hsl(var(--color-muted));
	}

	.center-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		max-width: 400px;
		padding: 2rem;
		width: 100%;
	}

	.phase-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		text-align: center;
	}

	.phase-subtitle {
		font-size: 0.95rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
	}

	.countdown-number {
		font-size: 6rem;
		font-weight: 800;
		color: hsl(var(--color-primary));
		font-variant-numeric: tabular-nums;
	}

	.mood-section {
		margin: 0.5rem 0;
	}

	.skip-btn {
		padding: 0.5rem 1.5rem;
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.85rem;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.timer-display {
		font-size: 3rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
		margin-top: 1.5rem;
	}

	.progress-bar {
		width: 100%;
		max-width: 300px;
		height: 4px;
		border-radius: 2px;
		background: hsl(var(--color-muted));
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: hsl(var(--color-primary));
		border-radius: 2px;
		transition: width 0.3s linear;
	}

	.controls {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.control-btn {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 2px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.control-btn:hover {
		border-color: hsl(var(--color-primary) / 0.5);
	}

	.control-stop:hover {
		border-color: hsl(var(--color-destructive) / 0.5);
	}

	/* Body scan */
	.bodyscan-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		max-width: 320px;
	}

	.bodyscan-step-indicator {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.bodyscan-text {
		font-size: 1.1rem;
		color: hsl(var(--color-foreground));
		text-align: center;
		line-height: 1.6;
	}

	/* Silence mode */
	.silence-circle {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: radial-gradient(
			circle at 40% 40%,
			hsl(var(--color-primary) / 0.3),
			hsl(var(--color-primary) / 0.1)
		);
		animation: pulse-soft 4s ease-in-out infinite;
	}

	@keyframes pulse-soft {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.7;
		}
		50% {
			transform: scale(1.05);
			opacity: 1;
		}
	}

	/* Buttons */
	.finish-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn {
		padding: 0.65rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-secondary {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.btn-secondary:hover {
		background: hsl(var(--color-muted) / 0.8);
	}

	/* Notes */
	.notes-section {
		width: 100%;
	}

	.notes-input {
		width: 100%;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		font-size: 0.9rem;
		resize: vertical;
		font-family: inherit;
	}

	.notes-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.save-btn {
		min-width: 160px;
	}
</style>
