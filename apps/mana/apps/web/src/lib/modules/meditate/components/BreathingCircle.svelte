<!--
  BreathingCircle — animated breathing guide.
  Expands on inhale, holds, contracts on exhale. Phase label in the center.
-->
<script lang="ts">
	import type { BreathPattern, BreathPhase } from '../types';
	import { BREATH_PHASE_LABELS } from '../types';

	interface Props {
		pattern: BreathPattern;
		isActive: boolean;
	}

	let { pattern, isActive }: Props = $props();

	let phase = $state<BreathPhase>('inhale');
	let phaseElapsed = $state(0);
	let animationFrame = $state<number | null>(null);
	let lastTick = $state(0);

	const cycleDuration = $derived(pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2);

	// Scale from 0.6 → 1.0 during inhale, stay at 1.0 during hold1,
	// 1.0 → 0.6 during exhale, stay at 0.6 during hold2.
	let scale = $derived.by(() => {
		if (!isActive) return 0.6;
		const minScale = 0.6;
		const maxScale = 1.0;
		const range = maxScale - minScale;

		if (phase === 'inhale' && pattern.inhale > 0) {
			return minScale + range * (phaseElapsed / pattern.inhale);
		}
		if (phase === 'hold1') return maxScale;
		if (phase === 'exhale' && pattern.exhale > 0) {
			return maxScale - range * (phaseElapsed / pattern.exhale);
		}
		return minScale; // hold2
	});

	let phaseDuration = $derived.by(() => {
		if (phase === 'inhale') return pattern.inhale;
		if (phase === 'hold1') return pattern.hold1;
		if (phase === 'exhale') return pattern.exhale;
		return pattern.hold2;
	});

	let phaseLabel = $derived(BREATH_PHASE_LABELS[phase].de);
	let phaseCountdown = $derived(Math.max(0, Math.ceil(phaseDuration - phaseElapsed)));

	function nextPhase(): BreathPhase {
		const order: BreathPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'];
		let idx = order.indexOf(phase);
		// Skip phases with 0 duration
		do {
			idx = (idx + 1) % 4;
		} while (getPatternValue(order[idx]) === 0 && idx !== order.indexOf(phase));
		return order[idx];
	}

	function getPatternValue(p: BreathPhase): number {
		if (p === 'inhale') return pattern.inhale;
		if (p === 'hold1') return pattern.hold1;
		if (p === 'exhale') return pattern.exhale;
		return pattern.hold2;
	}

	function tick() {
		if (!isActive) return;
		const now = performance.now();
		const elapsed = (now - lastTick) / 1000;
		lastTick = now;
		phaseElapsed += elapsed;

		if (phaseElapsed >= phaseDuration) {
			phaseElapsed = 0;
			phase = nextPhase();
		}

		animationFrame = requestAnimationFrame(tick);
	}

	function start() {
		phase = 'inhale';
		phaseElapsed = 0;
		lastTick = performance.now();
		tick();
	}

	function stop() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
	}

	$effect(() => {
		if (isActive) {
			start();
		} else {
			stop();
		}
		return () => stop();
	});
</script>

<div class="breathing-container">
	<div class="breathing-circle" style:transform="scale({scale})">
		<div class="breath-label">{phaseLabel}</div>
		{#if phaseDuration > 0}
			<div class="breath-countdown">{phaseCountdown}</div>
		{/if}
	</div>
	<div class="breathing-ring ring-outer"></div>
	<div class="breathing-ring ring-inner"></div>
</div>

<style>
	.breathing-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 240px;
		height: 240px;
	}

	.breathing-circle {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 180px;
		height: 180px;
		border-radius: 50%;
		background: radial-gradient(
			circle at 40% 40%,
			hsl(var(--color-primary) / 0.6),
			hsl(var(--color-primary) / 0.3)
		);
		backdrop-filter: blur(8px);
		transition: transform 0.1s linear;
		box-shadow:
			0 0 40px hsl(var(--color-primary) / 0.2),
			0 0 80px hsl(var(--color-primary) / 0.1);
	}

	.breath-label {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-primary-foreground));
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.9;
	}

	.breath-countdown {
		font-size: 2rem;
		font-weight: 700;
		color: hsl(var(--color-primary-foreground));
		font-variant-numeric: tabular-nums;
	}

	.breathing-ring {
		position: absolute;
		border-radius: 50%;
		border: 1px solid hsl(var(--color-primary) / 0.15);
	}

	.ring-outer {
		width: 230px;
		height: 230px;
	}

	.ring-inner {
		width: 210px;
		height: 210px;
	}
</style>
