<script lang="ts">
	import { toastStore, type Toast } from '$lib/stores/toast.svelte';
	import { fly } from 'svelte/transition';

	// Reactive getter from the runes-based store
	let toasts = $derived(toastStore.toasts);

	function handleClose(id: string) {
		toastStore.remove(id);
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
		gap: 0.5rem;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: hsl(var(--card));
		border-radius: 0.75rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		border: 1px solid hsl(var(--border));
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
		border-left: 4px solid hsl(142.1 76.2% 36.3%);
	}

	.toast-success .toast-icon {
		color: hsl(142.1 76.2% 36.3%);
	}

	.toast-error {
		border-left: 4px solid hsl(var(--destructive));
	}

	.toast-error .toast-icon {
		color: hsl(var(--destructive));
	}

	.toast-warning {
		border-left: 4px solid hsl(47.9 95.8% 53.1%);
	}

	.toast-warning .toast-icon {
		color: hsl(47.9 95.8% 53.1%);
	}

	.toast-info {
		border-left: 4px solid hsl(var(--primary));
	}

	.toast-info .toast-icon {
		color: hsl(var(--primary));
	}

	.toast-message {
		flex: 1;
		margin: 0;
		font-size: 0.9375rem;
		color: hsl(var(--foreground));
		line-height: 1.5;
	}

	.toast-close {
		flex-shrink: 0;
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: hsl(var(--muted-foreground));
		transition: all 150ms ease;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toast-close:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	@media (max-width: 768px) {
		.toast-container {
			bottom: 6rem;
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
</style>
