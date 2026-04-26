<!--
  FeedbackQuickModal — Lightweight feedback-submission modal opened from
  any FeedbackHook button or the global floating pill.

  Pre-fills moduleContext from the caller, exposes a category dropdown,
  and posts via the shared feedbackService. Submit flips into a "Danke"
  state that shows the public pseudonym so the user knows how their
  post will appear in the community.
-->
<script lang="ts">
	import { X, PaperPlaneTilt } from '@mana/shared-icons';
	import { FEEDBACK_CATEGORY_LABELS, type FeedbackCategory } from '@mana/feedback';
	import { feedbackService } from '$lib/api/feedback';

	interface Props {
		open: boolean;
		onClose: () => void;
		/** Module that owns this hook — pre-filled into the submission. */
		moduleContext?: string;
		/** Pre-selected category. Defaults to 'feature'. */
		defaultCategory?: FeedbackCategory;
		/** Optional headline override. */
		title?: string;
	}

	let props: Props = $props();
	let title = $derived(props.title ?? 'Idee oder Feedback?');
	let defaultCategory = $derived<FeedbackCategory>(props.defaultCategory ?? 'feature');

	let text = $state('');
	// svelte-ignore state_referenced_locally
	let category = $state<FeedbackCategory>(props.defaultCategory ?? 'feature');
	let isPublic = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let submittedDisplayName = $state<string | null>(null);

	const MAX_LEN = 2000;

	// Categories the user can pick — onboarding-wish/praise/other are
	// possible too, but the inline form is geared at feature/bug/improvement.
	const SELECTABLE: FeedbackCategory[] = ['feature', 'improvement', 'bug', 'praise', 'question'];

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
				moduleContext: props.moduleContext,
			});
			submittedDisplayName =
				(res as { displayName?: string }).displayName ??
				(res as { feedback?: { displayName?: string } }).feedback?.displayName ??
				null;
		} catch (err) {
			console.error('[FeedbackQuickModal] submit failed:', err);
			error = err instanceof Error ? err.message : 'Senden fehlgeschlagen.';
		} finally {
			saving = false;
		}
	}

	function handleClose() {
		text = '';
		category = defaultCategory;
		isPublic = true;
		error = null;
		submittedDisplayName = null;
		props.onClose();
	}

	function onBackdropKey(e: KeyboardEvent) {
		if (e.key === 'Escape') handleClose();
	}
</script>

{#if props.open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="backdrop"
		role="dialog"
		aria-modal="true"
		onclick={handleClose}
		onkeydown={onBackdropKey}
		tabindex="-1"
	>
		<div class="modal" role="document" onclick={(e) => e.stopPropagation()}>
			<header class="modal-header">
				<h2>{submittedDisplayName ? 'Danke!' : title}</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Schließen">
					<X size={18} weight="bold" />
				</button>
			</header>

			{#if submittedDisplayName}
				<div class="success">
					<p>
						Dein Feedback ist eingegangen — sichtbar als
						<strong>{submittedDisplayName}</strong>.
					</p>
					{#if isPublic}
						<p class="muted">Es taucht in der Community-Page auf, sobald wir es freigeben.</p>
					{:else}
						<p class="muted">Es bleibt privat und ist nur für dich + Admins sichtbar.</p>
					{/if}
					<button class="btn-primary" onclick={handleClose}>Schließen</button>
				</div>
			{:else}
				<div class="body">
					{#if props.moduleContext}
						<div class="context-badge">Modul: {props.moduleContext}</div>
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
						<!-- svelte-ignore a11y_autofocus -->
						<textarea
							bind:value={text}
							placeholder="Beschreib's so genau du willst…"
							maxlength={MAX_LEN}
							rows="5"
							autofocus
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
						<button class="btn-ghost" onclick={handleClose} disabled={saving}>Abbrechen</button>
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
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: hsl(0 0% 0% / 0.5);
		backdrop-filter: blur(2px);
	}

	.modal {
		width: 100%;
		max-width: 520px;
		max-height: calc(100dvh - 2rem);
		display: flex;
		flex-direction: column;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		border: 2px solid hsl(0 0% 0% / 0.12);
		border-radius: 1rem;
		box-shadow:
			0 16px 32px hsl(0 0% 0% / 0.18),
			0 6px 12px hsl(0 0% 0% / 0.1);
		overflow: hidden;
	}

	:global(.dark) .modal {
		border-color: hsl(0 0% 0% / 0.28);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1rem 0.5rem;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.close-btn {
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border-radius: 50%;
		cursor: pointer;
	}

	.close-btn:hover {
		background: hsl(var(--color-surface-hover, var(--color-muted)));
		color: hsl(var(--color-foreground));
	}

	.body {
		padding: 0.5rem 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		overflow-y: auto;
	}

	.success {
		padding: 1rem 1rem 1.25rem;
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
