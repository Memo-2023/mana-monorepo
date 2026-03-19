<script lang="ts">
	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		destructive?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open,
		title,
		message,
		confirmLabel = 'Bestätigen',
		cancelLabel = 'Abbrechen',
		destructive = false,
		onConfirm,
		onCancel,
	}: Props = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
		<button class="absolute inset-0 bg-black/50" onclick={onCancel} aria-label="Schließen"></button>
		<div
			class="relative bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl"
		>
			<h3 class="text-lg font-semibold text-foreground">{title}</h3>
			<p class="text-sm text-muted-foreground mt-2">{message}</p>
			<div class="flex justify-end gap-2 mt-6">
				<button class="btn btn-secondary text-sm" onclick={onCancel}>
					{cancelLabel}
				</button>
				<button
					class="btn text-sm text-white {destructive
						? 'bg-destructive hover:bg-destructive/90'
						: 'btn-primary'}"
					onclick={onConfirm}
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
