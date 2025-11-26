<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		size?: 'small' | 'medium' | 'large';
		children: Snippet;
	}

	let { open, onClose, size = 'medium', children }: Props = $props();

	const sizeClasses = {
		small: 'max-w-md',
		medium: 'max-w-2xl',
		large: 'max-w-6xl'
	};
	let modalElement = $state<HTMLDivElement | null>(null);

	onMount(() => {
		function handleEscape(e: KeyboardEvent) {
			if (e.key === 'Escape' && open) {
				onClose();
			}
		}

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	});

	$effect(() => {
		if (open && modalElement) {
			// Lock body scroll when modal is open
			document.body.style.overflow = 'hidden';

			// Focus the modal
			modalElement.focus();
		} else {
			// Restore body scroll
			document.body.style.overflow = '';
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if open}
	<div
		bind:this={modalElement}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="relative max-h-[90vh] w-full {sizeClasses[size]} overflow-auto rounded-lg bg-white shadow-xl dark:bg-gray-900">
			<button
				onclick={onClose}
				class="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50 dark:bg-gray-800 dark:hover:bg-gray-700"
				aria-label="Close"
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
			{@render children()}
		</div>
	</div>
{/if}
