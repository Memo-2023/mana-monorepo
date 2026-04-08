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
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="cd-backdrop" onclick={onCancel}>
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
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 1rem;
	}
	.cd-dialog {
		background: #fffef5;
		border-radius: 0.75rem;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
		max-width: 420px;
		width: 100%;
		padding: 1.5rem;
		animation: cd-pop 0.18s ease-out;
	}
	:global(.dark) .cd-dialog {
		background: #252220;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
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
		color: #111827;
		margin: 0 0 0.5rem;
	}
	:global(.dark) .cd-title {
		color: #f9fafb;
	}
	.cd-message {
		font-size: 0.875rem;
		color: #4b5563;
		margin: 0 0 1.25rem;
		line-height: 1.5;
	}
	:global(.dark) .cd-message {
		color: #d1d5db;
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
		color: #6b7280;
	}
	.cd-btn-cancel:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.05);
	}
	:global(.dark) .cd-btn-cancel {
		color: #9ca3af;
	}
	:global(.dark) .cd-btn-cancel:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.06);
	}
	.cd-btn-primary {
		background: var(--color-primary, #8b5cf6);
		color: white;
	}
	.cd-btn-primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
	.cd-btn-danger {
		background: #ef4444;
		color: white;
	}
	.cd-btn-danger:hover:not(:disabled) {
		background: #dc2626;
	}
</style>
