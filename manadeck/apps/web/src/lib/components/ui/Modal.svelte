<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	interface Props {
		open?: boolean;
		title?: string;
		onClose?: () => void;
		children: Snippet;
	}

	let { open = $bindable(false), title, onClose, children }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-surface-elevated rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
			<!-- Header -->
			{#if title}
				<div class="flex items-center justify-between p-6 border-b border-border">
					<h2 class="text-xl font-semibold">{title}</h2>
					<button
						onclick={handleClose}
						class="text-muted-foreground hover:text-foreground transition-colors"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}

			<!-- Content -->
			<div class="p-6">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
