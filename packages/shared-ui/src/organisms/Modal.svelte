<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@manacore/shared-icons';
	import Text from '../atoms/Text.svelte';

	interface Props {
		visible: boolean;
		onClose: () => void;
		title?: string;
		icon?: Snippet;
		children: Snippet;
		footer?: Snippet;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
		showHeader?: boolean;
	}

	let {
		visible,
		onClose,
		title,
		icon,
		children,
		footer,
		maxWidth = 'lg',
		showHeader = true,
	}: Props = $props();

	const maxWidthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		'3xl': 'max-w-3xl',
	};

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && visible) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<!-- Modal Backdrop -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e as unknown as MouseEvent)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative flex max-h-[90vh] w-full {maxWidthClasses[
				maxWidth
			]} flex-col rounded-2xl border border-border bg-surface-elevated-2 backdrop-blur-xl shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			{#if showHeader}
				<!-- Header -->
				<div class="flex items-center justify-between p-6 border-b border-border">
					<div class="flex items-center gap-3 flex-1">
						{#if icon}
							{@render icon()}
						{/if}
						{#if title}
							<Text variant="large" weight="semibold">
								{title}
							</Text>
						{/if}
					</div>
					<button
						onclick={onClose}
						class="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all duration-200 hover:scale-105"
						aria-label="Close"
					>
						<X size={18} weight="bold" class="text-muted-foreground" />
					</button>
				</div>
			{/if}

			<!-- Body (scrollable) -->
			<div class="flex-1 overflow-y-auto p-6">
				{@render children()}
			</div>

			<!-- Footer (optional) -->
			{#if footer}
				<div class="border-t border-border p-6">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
