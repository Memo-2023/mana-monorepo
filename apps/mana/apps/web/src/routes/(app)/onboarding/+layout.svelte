<!--
  Onboarding shell — wraps the three onboarding screens with a
  centered layout, progress dots, and a skip-all affordance.

  Lives under (app)/ so the AuthGate in the parent layout keeps
  unauthenticated users out. The parent layout hides its own chrome
  (PillNav, bottom-stack) when the pathname starts with /onboarding,
  so this shell renders into a clean full-viewport container.

  The skip-all button writes `onboardingCompletedAt = now()` via the
  shared store and navigates home. Individual screens can also call
  `onboardingStatus.markComplete()` themselves (templates/+page.svelte
  does this as part of its finish handler).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { X } from '@mana/shared-icons';
	import { onboardingStatus } from '$lib/stores/onboarding-status.svelte';

	let { children } = $props();

	// Map pathname → step index (0-based) so the progress dots light up.
	// Any unknown /onboarding/* path falls back to step 0.
	let currentStep = $derived.by(() => {
		const path = $page.url.pathname;
		if (path.startsWith('/onboarding/templates')) return 2;
		if (path.startsWith('/onboarding/look')) return 1;
		return 0; // /onboarding, /onboarding/name, or anything else
	});

	async function handleSkipAll() {
		try {
			await onboardingStatus.markComplete();
		} catch (err) {
			console.warn('[onboarding] skip-all markComplete failed:', err);
		}
		await goto('/');
	}
</script>

<div class="onboarding-shell">
	<header class="onboarding-header">
		<div
			class="progress-dots"
			role="progressbar"
			aria-valuemin={1}
			aria-valuemax={3}
			aria-valuenow={currentStep + 1}
		>
			{#each [0, 1, 2] as step (step)}
				<span class="dot" class:active={step === currentStep} class:done={step < currentStep}
				></span>
			{/each}
		</div>
		<button
			type="button"
			class="skip-all"
			onclick={handleSkipAll}
			aria-label="Onboarding überspringen"
		>
			<X size={14} />
			<span>Überspringen</span>
		</button>
	</header>

	<main class="onboarding-body">
		{@render children()}
	</main>
</div>

<style>
	.onboarding-shell {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
	}

	.onboarding-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
	}

	.progress-dots {
		display: flex;
		gap: 0.5rem;
	}

	.dot {
		width: 28px;
		height: 4px;
		border-radius: 2px;
		background: hsl(var(--color-muted-foreground) / 0.25);
		transition: background 0.2s ease;
	}

	.dot.done {
		background: hsl(var(--color-primary) / 0.6);
	}

	.dot.active {
		background: hsl(var(--color-primary));
	}

	.skip-all {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.skip-all:hover {
		background: hsl(var(--color-muted) / 0.4);
		color: hsl(var(--color-foreground));
	}

	.onboarding-body {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.5rem 4rem;
		overflow-y: auto;
	}
</style>
