<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
import type { Toast, ToastType } from '$lib/stores/toast.svelte';

	// Icon paths for each toast type
	const icons: Record<ToastType, string> = {
		success: 'M5 13l4 4L19 7',
		error: 'M6 18L18 6M6 6l12 12',
		warning:
			'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
	};

	// Colors for each toast type
	const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
		success: {
			bg: 'bg-green-50 dark:bg-green-900/30',
			border: 'border-green-200 dark:border-green-800',
			icon: 'text-green-500 dark:text-green-400',
			text: 'text-green-800 dark:text-green-200',
		},
		error: {
			bg: 'bg-red-50 dark:bg-red-900/30',
			border: 'border-red-200 dark:border-red-800',
			icon: 'text-red-500 dark:text-red-400',
			text: 'text-red-800 dark:text-red-200',
		},
		warning: {
			bg: 'bg-amber-50 dark:bg-amber-900/30',
			border: 'border-amber-200 dark:border-amber-800',
			icon: 'text-amber-500 dark:text-amber-400',
			text: 'text-amber-800 dark:text-amber-200',
		},
		info: {
			bg: 'bg-blue-50 dark:bg-blue-900/30',
			border: 'border-blue-200 dark:border-blue-800',
			icon: 'text-blue-500 dark:text-blue-400',
			text: 'text-blue-800 dark:text-blue-200',
		},
	};

	function getToastClasses(type: ToastType) {
		return colors[type];
	}
</script>

{#if toastStore.toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
		{#each toastStore.toasts as toast (toast.id)}
			{@const classes = getToastClasses(toast.type)}
			<div
				class="flex min-w-[280px] max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300 {classes.bg} {classes.border}"
				role="alert"
			>
				<!-- Icon -->
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 {classes.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={icons[toast.type]}
						/>
					</svg>
				</div>

				<!-- Message -->
				<p class="flex-1 text-sm font-medium {classes.text}">
					{toast.message}
				</p>

				<!-- Close button -->
				<button
					onclick={() => toastStore.remove(toast.id)}
					class="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
					aria-label="Schließen"
				>
					<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}

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
		animation: slide-in-from-right 0.3s ease-out;
	}
</style>
