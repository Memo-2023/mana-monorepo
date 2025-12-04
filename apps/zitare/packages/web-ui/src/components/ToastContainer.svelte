<script lang="ts">
	import { toast } from '../stores/toast';
	import type { Toast } from '../stores/toast';
	import { fade, fly } from 'svelte/transition';

	let toasts = $state<Toast[]>([]);

	toast.subscribe((value) => {
		toasts = value;
	});

	function handleClose(id: string) {
		toast.remove(id);
	}

	function getIcon(type: Toast['type']) {
		switch (type) {
			case 'success':
				return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
			case 'error':
				return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`;
			case 'warning':
				return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`;
			case 'info':
			default:
				return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
		}
	}
</script>

<div class="toast-container">
	{#each toasts as toastItem (toastItem.id)}
		<div
			class="toast toast-{toastItem.type}"
			transition:fly={{ y: 20, duration: 300 }}
			role="alert"
		>
			<div class="toast-icon">
				{@html getIcon(toastItem.type)}
			</div>
			<p class="toast-message">{toastItem.message}</p>
			<button
				class="toast-close"
				onclick={() => handleClose(toastItem.id)}
				aria-label="Close notification"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		background: rgb(var(--color-surface-elevated));
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		border: 1px solid rgb(var(--color-border));
		min-width: 300px;
		max-width: 400px;
		pointer-events: auto;
		backdrop-filter: blur(10px);
	}

	.toast-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toast-success {
		border-left: 4px solid rgb(var(--color-success));
	}

	.toast-success .toast-icon {
		color: rgb(var(--color-success));
	}

	.toast-error {
		border-left: 4px solid rgb(var(--color-error));
	}

	.toast-error .toast-icon {
		color: rgb(var(--color-error));
	}

	.toast-warning {
		border-left: 4px solid rgb(var(--color-warning));
	}

	.toast-warning .toast-icon {
		color: rgb(var(--color-warning));
	}

	.toast-info {
		border-left: 4px solid rgb(var(--color-info));
	}

	.toast-info .toast-icon {
		color: rgb(var(--color-info));
	}

	.toast-message {
		flex: 1;
		margin: 0;
		font-size: 0.9375rem;
		color: rgb(var(--color-text-primary));
		line-height: 1.5;
	}

	.toast-close {
		flex-shrink: 0;
		background: none;
		border: none;
		padding: var(--spacing-xs);
		cursor: pointer;
		color: rgb(var(--color-text-secondary));
		transition: all var(--transition-fast);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toast-close:hover {
		background: rgba(var(--color-border), 0.5);
		color: rgb(var(--color-text-primary));
	}

	/* Mobile */
	@media (max-width: 768px) {
		.toast-container {
			bottom: 6rem; /* Above mobile bottom nav */
			right: 1rem;
			left: 1rem;
			align-items: stretch;
		}

		.toast {
			min-width: auto;
			max-width: none;
		}

		.toast-message {
			font-size: 0.875rem;
		}
	}

	/* Animation for progress bar (optional enhancement) */
	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
