<script lang="ts">
	import { toasts, dismissToast, type Toast } from '$lib/stores/toast';
	import { fly, fade } from 'svelte/transition';

	function getToastIcon(type: Toast['type']) {
		switch (type) {
			case 'success':
				return {
					path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
					color: 'text-green-500'
				};
			case 'error':
				return {
					path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
					color: 'text-red-500'
				};
			case 'warning':
				return {
					path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
					color: 'text-yellow-500'
				};
			case 'info':
			default:
				return {
					path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
					color: 'text-blue-500'
				};
		}
	}

	function getToastBgColor(type: Toast['type']) {
		switch (type) {
			case 'success':
				return 'bg-green-50 border-green-200';
			case 'error':
				return 'bg-red-50 border-red-200';
			case 'warning':
				return 'bg-yellow-50 border-yellow-200';
			case 'info':
			default:
				return 'bg-blue-50 border-blue-200';
		}
	}
</script>

<div class="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
	{#each $toasts as toast (toast.id)}
		{@const icon = getToastIcon(toast.type)}
		{@const bgColor = getToastBgColor(toast.type)}
		<div
			transition:fly={{ y: 50, duration: 300 }}
			class="pointer-events-auto flex min-w-[320px] items-start gap-3 rounded-lg border p-4 shadow-lg {bgColor}"
			role="alert"
		>
			<svg class="h-6 w-6 flex-shrink-0 {icon.color}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon.path} />
			</svg>

			<p class="flex-1 text-sm font-medium text-gray-900">{toast.message}</p>

			<button
				onclick={() => dismissToast(toast.id)}
				class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
				aria-label="Schließen"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/each}
</div>
