<!--
  ConfirmDialog — minimal reusable confirm modal.

  Backdrop click cancels. Escape cancels. Confirm button is auto-focused
  with the danger variant when `variant="danger"`.
-->
<script lang="ts">
	interface Props {
		show: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'default' | 'danger';
		onConfirm: () => void | Promise<void>;
		onCancel: () => void;
	}

	let {
		show,
		title,
		message,
		confirmLabel = 'Bestätigen',
		cancelLabel = 'Abbrechen',
		variant = 'default',
		onConfirm,
		onCancel,
	}: Props = $props();

	let pending = $state(false);

	async function handleConfirm() {
		if (pending) return;
		pending = true;
		try {
			await onConfirm();
		} finally {
			pending = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!show) return;
		if (e.key === 'Escape') onCancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
	<div class="cd-backdrop" onclick={onCancel} role="presentation" tabindex="-1">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="cd-dialog"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="cd-title"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 id="cd-title" class="cd-title">{title}</h3>
			<p class="cd-message">{message}</p>
			<div class="cd-actions">
				<button class="cd-btn cd-btn-cancel" onclick={onCancel} disabled={pending}>
					{cancelLabel}
				</button>
				<button
					class="cd-btn"
					class:cd-btn-danger={variant === 'danger'}
					class:cd-btn-primary={variant !== 'danger'}
					onclick={handleConfirm}
					disabled={pending}
				>
					{pending ? '…' : confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.cd-backdrop {
		position: fixed;
		inset: 0;
		background: hsl(0 0% 0% / 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 1rem;
	}
	.cd-dialog {
		background: hsl(var(--color-card));
		border-radius: 0.75rem;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
		max-width: 420px;
		width: 100%;
		padding: 1.5rem;
		animation: cd-pop 0.18s ease-out;
	}
	@keyframes cd-pop {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.cd-title {
		font-size: 1.0625rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.5rem;
	}
	.cd-message {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		margin: 0 0 1.25rem;
		line-height: 1.5;
	}
	.cd-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.cd-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.cd-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.cd-btn-cancel {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.cd-btn-cancel:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
	}
	.cd-btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.cd-btn-primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
	.cd-btn-danger {
		background: hsl(var(--color-error));
		color: hsl(var(--color-primary-foreground));
	}
	.cd-btn-danger:hover:not(:disabled) {
		background: hsl(var(--color-error));
	}
</style>
