<script lang="ts">
	import { toastStore } from './toast.svelte';
	import type { Toast } from './toast.svelte';
	import { X, CheckCircle, XCircle, Warning, Info } from '@mana/shared-icons';

	let toasts = $derived(toastStore.toasts);

	const icons = {
		success: CheckCircle,
		error: XCircle,
		warning: Warning,
		info: Info,
	};

	const colors = {
		success: 'bg-green-500/90 text-white',
		error: 'bg-destructive/90 text-destructive-foreground',
		warning: 'bg-amber-500/90 text-white',
		info: 'bg-primary/90 text-primary-foreground',
	};

	function handleDismiss(id: string) {
		toastStore.dismiss(id);
	}
</script>

{#if toasts.length > 0}
	<div class="toast-container">
		{#each toasts as toast (toast.id)}
			{@const Icon = icons[toast.type]}
			<div class="toast-item {colors[toast.type]}" role="alert">
				<Icon size={20} weight="fill" class="toast-icon" />
				<p class="toast-message">{toast.message}</p>
				{#if toast.action}
					<button
						onclick={() => {
							toast.action?.onClick();
							handleDismiss(toast.id);
						}}
						class="toast-action"
					>
						{toast.action.label}
					</button>
				{/if}
				<button
					onclick={() => handleDismiss(toast.id)}
					class="toast-dismiss"
					aria-label="Schließen"
				>
					<X size={16} weight="bold" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 24rem;
	}

	/* Mobile: full width at bottom, above nav bar */
	@media (max-width: 640px) {
		.toast-container {
			left: 0.75rem;
			right: 0.75rem;
			bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
			max-width: none;
		}
	}

	.toast-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		min-height: 48px;
		border-radius: 0.75rem;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		animation: toast-slide-in 0.3s ease-out;
	}

	.toast-icon {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.toast-message {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.4;
		margin: 0;
	}

	.toast-action {
		flex-shrink: 0;
		padding: 0.375rem 0.75rem;
		min-height: 36px;
		display: flex;
		align-items: center;
		border-radius: 0.375rem;
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
		color: inherit;
		transition: all 0.15s ease;
		white-space: nowrap;
	}
	.toast-action:hover {
		background: rgba(255, 255, 255, 0.35);
	}

	.toast-dismiss {
		flex-shrink: 0;
		padding: 0.5rem;
		min-width: 36px;
		min-height: 36px;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		opacity: 0.8;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		color: inherit;
	}

	.toast-dismiss:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.2);
	}

	@keyframes toast-slide-in {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Mobile: slide up instead of from right */
	@media (max-width: 640px) {
		@keyframes toast-slide-in {
			from {
				opacity: 0;
				transform: translateY(100%);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>
