<script lang="ts">
	import type { CreateFeedbackInput } from '@manacore/shared-feedback-types';

	interface Props {
		onSubmit: (input: CreateFeedbackInput) => Promise<void>;
		onCancel?: () => void;
		isSubmitting?: boolean;
		feedbackLabel?: string;
		submitLabel?: string;
		cancelLabel?: string;
		feedbackPlaceholder?: string;
	}

	let {
		onSubmit,
		onCancel,
		isSubmitting = false,
		feedbackLabel = 'Dein Feedback',
		submitLabel = 'Feedback senden',
		cancelLabel = 'Abbrechen',
		feedbackPlaceholder = 'Was gefällt dir? Was können wir verbessern?',
	}: Props = $props();

	let feedbackText = $state('');
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (feedbackText.trim().length < 10) {
			error = 'Bitte gib mindestens 10 Zeichen ein.';
			return;
		}

		try {
			await onSubmit({
				feedbackText: feedbackText.trim(),
			});

			// Reset form on success
			feedbackText = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.';
		}
	}
</script>

<form class="feedback-form" onsubmit={handleSubmit}>
	<div class="feedback-form__field">
		<label for="feedback-text" class="feedback-form__label">{feedbackLabel}</label>
		<textarea
			id="feedback-text"
			class="feedback-form__textarea"
			placeholder={feedbackPlaceholder}
			bind:value={feedbackText}
			rows="5"
			maxlength="2000"
			disabled={isSubmitting}
			required
		></textarea>
		<span class="feedback-form__counter">{feedbackText.length}/2000</span>
	</div>

	{#if error}
		<div class="feedback-form__error">{error}</div>
	{/if}

	<div class="feedback-form__actions">
		{#if onCancel}
			<button
				type="button"
				class="feedback-form__button feedback-form__button--secondary"
				onclick={onCancel}
				disabled={isSubmitting}
			>
				{cancelLabel}
			</button>
		{/if}
		<button
			type="submit"
			class="feedback-form__button feedback-form__button--primary"
			disabled={isSubmitting || feedbackText.trim().length < 10}
		>
			{#if isSubmitting}
				Wird gesendet...
			{:else}
				{submitLabel}
			{/if}
		</button>
	</div>
</form>

<style>
	.feedback-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.feedback-form__field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.feedback-form__label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground, 0 0% 17%));
	}

	.feedback-form__textarea {
		padding: 0.75rem;
		border: 1px solid hsl(var(--color-border, 0 0% 90%));
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground, 0 0% 17%));
		background: hsl(var(--color-input, 0 0% 100%));
		transition: border-color 0.2s ease;
	}

	.feedback-form__textarea::placeholder {
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
	}

	.feedback-form__textarea:focus {
		outline: none;
		border-color: hsl(var(--color-primary, 47 95% 58%));
	}

	.feedback-form__textarea {
		resize: vertical;
		min-height: 120px;
	}

	.feedback-form__counter {
		align-self: flex-end;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
	}

	.feedback-form__error {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-error, 6 78% 57%) / 0.1);
		color: hsl(var(--color-error, 6 78% 57%));
		font-size: 0.875rem;
	}

	.feedback-form__actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.feedback-form__button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.feedback-form__button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.feedback-form__button--primary {
		background: hsl(var(--color-primary, 47 95% 58%));
		color: hsl(var(--color-primary-foreground, 0 0% 0%));
	}

	.feedback-form__button--primary:hover:not(:disabled) {
		background: hsl(var(--color-primary, 47 95% 58%) / 0.9);
	}

	.feedback-form__button--secondary {
		background: transparent;
		border: 1px solid hsl(var(--color-border, 0 0% 90%));
		color: hsl(var(--color-foreground, 0 0% 17%));
	}

	.feedback-form__button--secondary:hover:not(:disabled) {
		background: hsl(var(--color-muted, 0 0% 90%));
	}
</style>
