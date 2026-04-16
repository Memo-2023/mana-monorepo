<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
</script>

{#if toast.toasts.length > 0}
	<div class="toast-stack">
		{#each toast.toasts as t (t.id)}
			<div
				class="toast-item"
				class:success={t.type === 'success'}
				class:error={t.type === 'error'}
				class:warning={t.type === 'warning'}
			>
				<span>{t.message}</span>
				<button class="dismiss" onclick={() => toast.dismiss(t.id)}>✕</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-stack {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 24rem;
	}

	.toast-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		color: white;
		background: hsl(var(--color-foreground));
		box-shadow: 0 4px 12px hsl(0 0% 0% / 0.15);
		animation: slide-in 0.2s ease-out;
	}

	.toast-item.success {
		background: hsl(142 71% 45%);
	}

	.toast-item.error {
		background: hsl(var(--color-error));
	}

	.toast-item.warning {
		background: hsl(45 93% 47%);
		color: hsl(0 0% 10%);
	}

	.dismiss {
		background: none;
		border: none;
		color: inherit;
		opacity: 0.7;
		cursor: pointer;
		font-size: 0.75rem;
		padding: 0;
		line-height: 1;
	}

	.dismiss:hover {
		opacity: 1;
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
