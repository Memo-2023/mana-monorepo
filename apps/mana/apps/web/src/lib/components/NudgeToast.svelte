<!--
  NudgeToast — In-app display for Companion Brain Pulse nudges.
  Lives in .bottom-stack in (app)/+layout.svelte.
  Self-gates: only renders when there are active nudges.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { X } from '@mana/shared-icons';
	import { evaluateRules, dismissNudge } from '$lib/companion/rules';
	import { recordOutcome } from '$lib/companion/feedback';
	import { useDaySnapshot } from '$lib/data/projections/day-snapshot';
	import { useStreaks } from '$lib/data/projections/streaks';
	import type { Nudge, NudgeType } from '$lib/companion/rules/types';

	const day = useDaySnapshot();
	const streaks = useStreaks();

	let nudges = $state<Nudge[]>([]);
	let currentNudge = $derived(nudges[0] ?? null);
	let shownAt = $state(0);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	function checkNudges() {
		const results = evaluateRules(day.value, streaks.value, []);
		// Only show nudges we haven't already dismissed in this session
		nudges = results.filter((n) => !dismissed.has(n.id));
	}

	const dismissed = new Set<string>();

	onMount(() => {
		// Check every 60 seconds
		checkNudges();
		intervalId = setInterval(checkNudges, 60_000);
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});

	// Re-check when projections update
	$effect(() => {
		if (day.value.date && streaks.value) {
			checkNudges();
		}
	});

	function handleAction() {
		if (!currentNudge) return;
		const latencyMs = Date.now() - shownAt;
		recordOutcome(currentNudge.id, currentNudge.type as NudgeType, 'acted', latencyMs);
		if (currentNudge.actionRoute) {
			goto(currentNudge.actionRoute);
		}
		removeCurrentNudge();
	}

	function handleDismiss() {
		if (!currentNudge) return;
		const latencyMs = Date.now() - shownAt;
		recordOutcome(currentNudge.id, currentNudge.type as NudgeType, 'dismissed', latencyMs);
		dismissNudge(currentNudge.id);
		removeCurrentNudge();
	}

	function removeCurrentNudge() {
		if (currentNudge) {
			dismissed.add(currentNudge.id);
			nudges = nudges.slice(1);
		}
	}

	$effect(() => {
		if (currentNudge) shownAt = Date.now();
	});
</script>

{#if currentNudge}
	<div class="nudge-toast" role="alert">
		<div class="nudge-body">
			<span class="nudge-title">{currentNudge.title}</span>
			<span class="nudge-text">{currentNudge.body}</span>
		</div>
		<div class="nudge-actions">
			{#if currentNudge.actionLabel}
				<button class="nudge-action" onclick={handleAction}>
					{currentNudge.actionLabel}
				</button>
			{/if}
			<button class="nudge-dismiss" onclick={handleDismiss} title="Ausblenden">
				<X size={14} />
			</button>
		</div>
		{#if nudges.length > 1}
			<span class="nudge-count">{nudges.length}</span>
		{/if}
	</div>
{/if}

<style>
	.nudge-toast {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1rem;
		border-radius: 0.75rem;
		background: rgba(30, 30, 40, 0.95);
		border: 1px solid hsl(var(--color-primary) / 0.3);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(12px);
		max-width: min(90vw, 480px);
		margin: 0 auto;
		animation: slide-up 0.3s ease-out;
		position: relative;
		pointer-events: auto;
	}

	.nudge-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.nudge-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.nudge-text {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.3;
	}

	.nudge-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.nudge-action {
		padding: 0.3125rem 0.75rem;
		border-radius: 9999px;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		transition: filter 0.15s;
		white-space: nowrap;
	}
	.nudge-action:hover {
		filter: brightness(1.15);
	}

	.nudge-dismiss {
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		padding: 0.125rem;
		display: flex;
		border-radius: 50%;
	}
	.nudge-dismiss:hover {
		color: hsl(var(--color-foreground));
	}

	.nudge-count {
		position: absolute;
		top: -0.375rem;
		right: -0.375rem;
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.625rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(1rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
