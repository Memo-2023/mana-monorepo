<script lang="ts">
	import { toastStore, type Toast } from '$lib/stores/toast.svelte';
	import { X, CheckCircle, XCircle, Warning, Info } from '@manacore/shared-icons';

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
	<div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
		{#each toasts as toast (toast.id)}
			{@const Icon = icons[toast.type]}
			<div
				class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl border border-white/20 animate-slide-in {colors[toast.type]}"
				role="alert"
			>
				<Icon size={20} weight="fill" class="flex-shrink-0 mt-0.5" />
				<p class="flex-1 text-sm font-medium">{toast.message}</p>
				<button
					onclick={() => handleDismiss(toast.id)}
					class="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
					aria-label="Schließen"
				>
					<X size={16} weight="bold" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>
