<script lang="ts">
	import { _ } from 'svelte-i18n';

	let {
		visible = false,
		title = '',
		message = '',
		confirmLabel,
		cancelLabel,
		destructive = true,
		onConfirm,
		onCancel,
	}: {
		visible: boolean;
		title: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		destructive?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
</script>

{#if visible}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="mx-4 w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl"
		>
			<h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
			{#if message}
				<p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{message}</p>
			{/if}
			<div class="mt-5 flex gap-2">
				<button
					onclick={onCancel}
					class="flex-1 rounded-lg border border-[hsl(var(--border))] py-2.5 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
				>
					{cancelLabel || $_('common.cancel')}
				</button>
				<button
					onclick={onConfirm}
					class="flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors {destructive
						? 'bg-red-500 text-white hover:bg-red-600'
						: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'}"
				>
					{confirmLabel || $_('common.delete')}
				</button>
			</div>
		</div>
	</div>
{/if}
