<!--
  Onboarding — Screen 4: Wish.
  Free-text "what do you want from Mana?" capture. Posts to the central
  @mana/feedback hub as category='onboarding-wish'.

  Public by default — appears in the /feedback feed under a Tier-
  pseudonym ("Wachsame Eule #4528"). Users can opt out via the visibility
  toggle, in which case the wish stays private (admin-only).

  Submit is fail-soft: a network/server failure logs a warning and
  still completes the flow — onboarding must never block on backend
  latency.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import { ArrowLeft, Check, Globe, Lock } from '@mana/shared-icons';
	import { onboardingFlow } from '$lib/stores/onboarding-flow.svelte';
	import { onboardingStatus } from '$lib/stores/onboarding-status.svelte';
	import { feedbackService } from '$lib/api/feedback';

	const MAX_LEN = 2000;

	let wish = $state(onboardingFlow.pendingWish ?? '');
	let isPublic = $state(true);
	let saving = $state(false);
	let submittedDisplayName = $state<string | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);

	let trimmed = $derived(wish.trim());
	let charsLeft = $derived(MAX_LEN - wish.length);

	// Imperative focus after the previous onboarding screen has fully
	// unmounted. Using the static `autofocus` attribute would race the
	// outgoing route's focus owner (Chrome warns "Autofocus processing
	// was blocked because a document already has a focused element"
	// when a router transition leaves a button focused). `tick()` waits
	// for the next microtask so the textarea is mounted and has no
	// competing focus claim.
	$effect(() => {
		void tick().then(() => textareaEl?.focus());
	});

	async function handleFinish() {
		if (saving) return;
		saving = true;

		// Fail-soft: a failed POST must not block onboarding completion.
		if (trimmed.length > 0) {
			onboardingFlow.setPendingWish(trimmed);
			try {
				const res = await feedbackService.createFeedback({
					feedbackText: trimmed,
					category: 'onboarding-wish',
					isPublic,
				});
				submittedDisplayName =
					(res as { displayName?: string }).displayName ??
					(res as { feedback?: { displayName?: string } }).feedback?.displayName ??
					null;
			} catch (err) {
				console.warn('[onboarding/wish] feedback submit failed:', err);
			}
		}

		try {
			await onboardingStatus.markComplete();
		} catch (err) {
			console.warn('[onboarding/wish] markComplete failed:', err);
		}
		onboardingFlow.reset();
		await goto('/');
	}

	async function handleBack() {
		onboardingFlow.setPendingWish(wish);
		await goto('/onboarding/templates');
	}
</script>

<div class="screen">
	<div class="hero">
		<h1>Eine letzte Sache</h1>
		<p class="subtitle">
			Was wünschst du dir von Mana? Wofür willst du's nutzen, was erhoffst du dir?
		</p>
		<p class="subtitle subtle">
			Schreib einfach, wie's dir kommt — wir lesen jede Antwort und sie hilft uns, Mana für dich
			besser zu machen.
		</p>
	</div>

	<div class="field">
		<textarea
			bind:this={textareaEl}
			bind:value={wish}
			maxlength={MAX_LEN}
			placeholder="Ich möchte Mana nutzen, um …"
			rows="6"
			aria-label="Was du dir von Mana wünschst"
		></textarea>
		<div class="counter" class:warn={charsLeft < 100}>
			{charsLeft} Zeichen übrig
		</div>
	</div>

	<!-- Public-Disclosure mit Toggle -->
	<div class="visibility">
		<button
			type="button"
			class="vis-toggle"
			class:active={isPublic}
			onclick={() => (isPublic = !isPublic)}
			aria-pressed={isPublic}
		>
			<span class="vis-icon">
				{#if isPublic}<Globe size={16} weight="bold" />{:else}<Lock size={16} weight="bold" />{/if}
			</span>
			<span class="vis-label">
				{isPublic ? 'Öffentlich teilen' : 'Nur für Admins'}
			</span>
		</button>
		<p class="vis-hint">
			{#if isPublic}
				Erscheint in unserer Community-Page als <strong>Tier-Pseudonym</strong> (z.B. "Wachsame Eule
				#4528"). Dein Name wird <em>nicht</em> gezeigt.
			{:else}
				Bleibt privat — nur du und das Mana-Team können das lesen. Du kannst es später öffentlich
				stellen.
			{/if}
		</p>
	</div>

	<div class="actions">
		<button type="button" class="btn-ghost" onclick={handleBack} disabled={saving}>
			<ArrowLeft size={16} weight="bold" />
			<span>Zurück</span>
		</button>
		<button
			type="button"
			class="btn-primary"
			onclick={handleFinish}
			disabled={saving}
			aria-label="Onboarding abschließen"
		>
			<span>{saving ? 'Speichere…' : 'Fertig'}</span>
			<Check size={16} weight="bold" />
		</button>
	</div>

	{#if submittedDisplayName}
		<aside class="preview" aria-live="polite">
			<div>Gesendet — sichtbar als <strong>{submittedDisplayName}</strong></div>
			<div class="reward-chip">
				<span class="reward-amount">+5</span>
				<span class="reward-label">Mana Credits</span>
			</div>
		</aside>
	{/if}
</div>

<style>
	.screen {
		width: 100%;
		max-width: 560px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.hero h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
		margin: 0;
	}

	.subtitle.subtle {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		opacity: 0.85;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field textarea {
		width: 100%;
		min-height: 8rem;
		padding: 0.875rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-surface, var(--color-background)));
		color: hsl(var(--color-foreground));
		font-size: 1rem;
		font-family: inherit;
		line-height: 1.5;
		resize: vertical;
		transition: border-color 0.15s ease;
	}

	.field textarea:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}

	.counter {
		align-self: flex-end;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.counter.warn {
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.visibility {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-muted) / 0.2);
	}

	.vis-toggle {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.vis-toggle.active {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	.vis-toggle:hover {
		transform: translateY(-1px);
	}

	.vis-icon {
		display: inline-flex;
	}

	.vis-hint {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.4;
		color: hsl(var(--color-muted-foreground));
	}

	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.25rem;
	}

	.btn-ghost {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.9375rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.btn-ghost:hover:not(:disabled) {
		background: hsl(var(--color-muted) / 0.4);
		color: hsl(var(--color-foreground));
	}

	.btn-ghost:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		font-size: 0.9375rem;
		font-weight: 600;
		border-radius: 0.75rem;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			opacity 0.15s ease;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.35);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
		border-radius: 0.625rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-size: 0.8125rem;
		text-align: center;
	}

	.reward-chip {
		display: inline-flex;
		align-items: baseline;
		gap: 0.375rem;
		padding: 0.4375rem 0.75rem;
		border-radius: 999px;
		background: linear-gradient(
			135deg,
			hsl(var(--color-primary) / 0.18),
			hsl(var(--color-primary) / 0.08)
		);
		border: 1px solid hsl(var(--color-primary) / 0.35);
		font-weight: 600;
		animation: reward-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.reward-amount {
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
	}

	.reward-label {
		font-size: 0.8125rem;
		opacity: 0.85;
	}

	@keyframes reward-in {
		from {
			opacity: 0;
			transform: translateY(-6px) scale(0.92);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
