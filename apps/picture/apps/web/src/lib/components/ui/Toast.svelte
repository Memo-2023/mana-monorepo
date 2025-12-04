<script lang="ts">
	import { toasts, dismissToast } from '$lib/stores/toast';
	import type { Toast } from '$lib/stores/toast';
	import { fly, fade } from 'svelte/transition';
	import { CheckCircle, XCircle, Warning, Info, X } from '@manacore/shared-icons';

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
		{@const bgColor = getToastBgColor(toast.type)}
		<div
			transition:fly={{ y: 50, duration: 300 }}
			class="pointer-events-auto flex min-w-[320px] items-start gap-3 rounded-lg border p-4 shadow-lg {bgColor}"
			role="alert"
		>
			<span class="flex-shrink-0">
				{#if toast.type === 'success'}
					<CheckCircle size={24} weight="regular" class="text-green-500" />
				{:else if toast.type === 'error'}
					<XCircle size={24} weight="regular" class="text-red-500" />
				{:else if toast.type === 'warning'}
					<Warning size={24} weight="regular" class="text-yellow-500" />
				{:else}
					<Info size={24} weight="regular" class="text-blue-500" />
				{/if}
			</span>

			<p class="flex-1 text-sm font-medium text-gray-900">{toast.message}</p>

			<button
				onclick={() => dismissToast(toast.id)}
				class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
				aria-label="Schließen"
			>
				<X size={20} weight="bold" />
			</button>
		</div>
	{/each}
</div>
