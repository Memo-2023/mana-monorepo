<!--
  Onboarding shell — wraps the four onboarding screens (name, look,
  templates, wish) in a centered card that mirrors the workbench
  ModuleShell chrome (paper texture, soft border, rounded corners,
  shadow). The card has no header bar; the global skip-all sits in the
  footer next to centered progress dots so the body owns the full top
  of the card.

  Lives under (app)/ so the AuthGate in the parent layout keeps
  unauthenticated users out. The parent layout hides its own chrome
  (PillNav, bottom-stack, wallpaper) when the pathname starts with
  /onboarding, so this shell renders into a clean full-viewport
  container and supplies its own page background + centered card.

  The skip-all button writes `onboardingCompletedAt = now()` via the
  shared store and navigates home. The wish screen (final step) also
  calls `onboardingStatus.markComplete()` as part of its finish
  handler — templates used to do this too but now just advances to the
  wish screen.
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
		if (path.startsWith('/onboarding/wish')) return 3;
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
	<div class="onboarding-card">
		<main class="onboarding-body">
			{@render children()}
		</main>

		<footer class="onboarding-footer">
			<button
				type="button"
				class="skip-all"
				onclick={handleSkipAll}
				aria-label="Onboarding überspringen"
			>
				<X size={14} weight="bold" />
				<span>Überspringen</span>
			</button>
			<div
				class="progress-dots"
				role="progressbar"
				aria-valuemin={1}
				aria-valuemax={4}
				aria-valuenow={currentStep + 1}
			>
				{#each [0, 1, 2, 3] as step (step)}
					<span class="dot" class:active={step === currentStep} class:done={step < currentStep}
					></span>
				{/each}
			</div>
			<span class="footer-spacer" aria-hidden="true"></span>
		</footer>
	</div>
</div>

<style>
	.onboarding-shell {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		overflow-y: auto;
	}

	/* Paper card — visual chrome mirrors ModuleShell.svelte so onboarding
	   reads as a workbench page. CSS vars come from applyThemeToDocument()
	   in @mana/shared-theme. */
	.onboarding-card {
		width: 100%;
		max-width: 720px;
		max-height: calc(100dvh - 2rem);
		background-color: hsl(var(--color-card));
		background-image: var(--paper-texture, none);
		background-size: var(--paper-size, 240px 240px);
		background-repeat: repeat;
		background-blend-mode: var(--paper-blend-mode, multiply);
		border: 2px solid hsl(0 0% 0% / 0.12);
		border-radius: 1.25rem;
		box-shadow:
			0 8px 24px hsl(0 0% 0% / 0.12),
			0 3px 8px hsl(0 0% 0% / 0.08);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: fadeInUp 0.25s ease-out;
	}

	:global(.dark) .onboarding-card {
		border-color: hsl(0 0% 0% / 0.28);
	}

	@media (prefers-contrast: more) {
		.onboarding-card {
			background-image: none;
		}
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.skip-all {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
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
		background: hsl(var(--color-surface-hover, var(--color-muted)));
		color: hsl(var(--color-foreground));
	}

	.onboarding-body {
		flex: 1;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 2rem 1.5rem 1.5rem;
		overflow-y: auto;
	}

	.onboarding-footer {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 0.875rem 1rem;
		flex-shrink: 0;
	}

	.onboarding-footer .skip-all {
		justify-self: start;
	}

	.onboarding-footer .progress-dots {
		justify-self: center;
	}

	.footer-spacer {
		display: block;
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

	@media (max-width: 540px) {
		.onboarding-shell {
			padding: 0.5rem;
		}
		.onboarding-card {
			max-height: calc(100dvh - 1rem);
			border-radius: 1rem;
		}
		.onboarding-body {
			padding: 1.5rem 1rem 1.25rem;
		}
		.onboarding-footer {
			padding: 0.75rem 0.75rem 0.875rem;
		}
	}
</style>
