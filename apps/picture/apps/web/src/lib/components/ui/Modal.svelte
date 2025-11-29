<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { X } from '@manacore/shared-icons';

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
		large: 'max-w-6xl',
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if open}
	<div
		bind:this={modalElement}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="relative max-h-[90vh] w-full {sizeClasses[
				size
			]} overflow-auto rounded-lg bg-white shadow-xl dark:bg-gray-900"
		>
			<button
				onclick={onClose}
				class="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50 dark:bg-gray-800 dark:hover:bg-gray-700"
				aria-label="Close"
			>
				<X size={24} weight="bold" />
			</button>
			{@render children()}
		</div>
	</div>
{/if}
