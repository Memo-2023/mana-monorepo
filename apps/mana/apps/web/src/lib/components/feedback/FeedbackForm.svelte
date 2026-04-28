<!--
  FeedbackForm — Pure feedback-submission form (no chrome).

  Used by FeedbackQuickModal (modal-mode, fallback for non-workbench
  contexts) and the inline panel inside AppPage (workbench cards). Keeps
  the two render modes in sync — change the form once, both surfaces
  pick it up.
-->
<script lang="ts">
	import { PaperPlaneTilt } from '@mana/shared-icons';
	import { FEEDBACK_CATEGORY_LABELS, type FeedbackCategory } from '@mana/feedback';
	import { feedbackService } from '$lib/api/feedback';

	interface Props {
		moduleContext?: string;
		defaultCategory?: FeedbackCategory;
		onCancel?: () => void;
		onSubmitted?: (displayName: string | null) => void;
	}

	let {
		moduleContext,
		defaultCategory: defaultCategoryProp,
		onCancel,
		onSubmitted,
	}: Props = $props();

	let defaultCategory = $derived<FeedbackCategory>(defaultCategoryProp ?? 'feature');

	let text = $state('');
	// svelte-ignore state_referenced_locally
	let category = $state<FeedbackCategory>(defaultCategoryProp ?? 'feature');
	let isPublic = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let submittedDisplayName = $state<string | null>(null);

	const MAX_LEN = 2000;
	const SELECTABLE: FeedbackCategory[] = ['feature', 'improvement', 'bug', 'praise', 'question'];

	export function reset() {
		text = '';
		category = defaultCategory;
		isPublic = true;
		error = null;
		submittedDisplayName = null;
	}

	async function handleSubmit() {
		const trimmed = text.trim();
		if (!trimmed || saving) return;
		saving = true;
		error = null;
		try {
			const res = await feedbackService.createFeedback({
				feedbackText: trimmed,
				category,
				isPublic,
				moduleContext,
			});
			const name =
				(res as { displayName?: string }).displayName ??
				(res as { feedback?: { displayName?: string } }).feedback?.displayName ??
				null;
			submittedDisplayName = name;
			onSubmitted?.(name);
		} catch (err) {
			console.error('[FeedbackForm] submit failed:', err);
			error = err instanceof Error ? err.message : 'Senden fehlgeschlagen.';
		} finally {
			saving = false;
		}
	}
</script>

{#if submittedDisplayName}
	<div class="success">
		<p>
			Dein Feedback ist eingegangen — sichtbar als <strong>{submittedDisplayName}</strong>.
		</p>
		<div class="reward-chip" aria-live="polite">
			<span class="reward-amount">+5</span>
			<span class="reward-label">Mana Credits</span>
		</div>
		{#if isPublic}
			<p class="muted">Es taucht in der Community-Page auf, sobald wir es freigeben.</p>
		{:else}
			<p class="muted">Es bleibt privat und ist nur für dich + Admins sichtbar.</p>
		{/if}
		{#if onCancel}
			<button class="btn-primary" onclick={() => onCancel()}>Schließen</button>
		{/if}
	</div>
{:else}
	<div class="form">
		{#if moduleContext}
			<div class="context-badge">Modul: {moduleContext}</div>
		{/if}

		<label class="field">
			<span class="label">Kategorie</span>
			<select bind:value={category}>
				{#each SELECTABLE as cat (cat)}
					<option value={cat}>{FEEDBACK_CATEGORY_LABELS[cat]}</option>
				{/each}
			</select>
		</label>

		<label class="field">
			<span class="label">Was ist los?</span>
			<textarea
				bind:value={text}
				placeholder="Beschreib's so genau du willst…"
				maxlength={MAX_LEN}
				rows="5"
			></textarea>
			<span class="counter">{MAX_LEN - text.length} Zeichen übrig</span>
		</label>

		<label class="checkbox">
			<input type="checkbox" bind:checked={isPublic} />
			<span>
				In Community-Feed öffentlich anzeigen (anonym als Eulen-Pseudonym).
				{#if !isPublic}<small>— bleibt privat, nur für Admins sichtbar.</small>{/if}
			</span>
		</label>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<div class="actions">
			{#if onCancel}
				<button class="btn-ghost" onclick={() => onCancel()} disabled={saving}>Abbrechen</button>
			{/if}
			<button
				class="btn-primary"
				onclick={handleSubmit}
				disabled={saving || text.trim().length < 3}
			>
				<span>{saving ? 'Sende…' : 'Senden'}</span>
				<PaperPlaneTilt size={16} weight="bold" />
			</button>
		</div>
	</div>
{/if}

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.success {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.success p {
		margin: 0;
		font-size: 0.9375rem;
	}

	.success .muted {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	.success .btn-primary {
		align-self: flex-end;
		margin-top: 0.5rem;
	}

	.reward-chip {
		align-self: flex-start;
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
		color: hsl(var(--color-primary));
		border: 1px solid hsl(var(--color-primary) / 0.3);
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

	.context-badge {
		align-self: flex-start;
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		font-size: 0.75rem;
		font-weight: 600;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--color-muted-foreground));
	}

	.field select,
	.field textarea {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface, var(--color-background)));
		color: hsl(var(--color-foreground));
		font: inherit;
	}

	.field textarea {
		resize: vertical;
		min-height: 6rem;
	}

	.field select:focus,
	.field textarea:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}

	.counter {
		align-self: flex-end;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.checkbox {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.4;
	}

	.checkbox input {
		margin-top: 0.2rem;
	}

	.checkbox small {
		display: block;
		font-size: 0.75rem;
	}

	.error {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.btn-ghost {
		padding: 0.5rem 0.875rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		border-radius: 0.5rem;
		cursor: pointer;
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
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.3);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
