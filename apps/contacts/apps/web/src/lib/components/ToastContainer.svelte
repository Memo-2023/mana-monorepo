<script lang="ts">
	import { toasts, type Toast } from '$lib/stores/toast';

	function getIcon(type: Toast['type']) {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
			default:
				return 'ℹ';
		}
	}

	function getColorClass(type: Toast['type']) {
		switch (type) {
			case 'success':
				return 'bg-green-500';
			case 'error':
				return 'bg-red-500';
			case 'warning':
				return 'bg-yellow-500';
			case 'info':
			default:
				return 'bg-blue-500';
		}
	}
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
	{#each $toasts as toast (toast.id)}
		<div
			class="flex items-center gap-3 rounded-lg bg-card px-4 py-3 shadow-lg border border-border animate-in slide-in-from-right duration-200"
		>
			<span
				class="{getColorClass(toast.type)} flex h-6 w-6 items-center justify-center rounded-full text-white text-sm"
			>
				{getIcon(toast.type)}
			</span>
			<span class="text-foreground">{toast.message}</span>
			<button
				onclick={() => toasts.remove(toast.id)}
				class="ml-2 text-muted-foreground hover:text-foreground"
			>
				✕
			</button>
		</div>
	{/each}
</div>

<style>
	@keyframes slide-in-from-right {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-in {
		animation: slide-in-from-right 0.2s ease-out;
	}
</style>
