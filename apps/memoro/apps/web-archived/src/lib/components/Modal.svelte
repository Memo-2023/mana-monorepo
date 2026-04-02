<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import Text from '$lib/components/atoms/Text.svelte';

	interface Props {
		visible: boolean;
		onClose: () => void;
		title?: string;
		icon?: Snippet;
		children: Snippet;
		footer?: Snippet;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
		showHeader?: boolean;
		transparentBackdrop?: boolean;
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
		transparentBackdrop = false,
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
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 {transparentBackdrop
			? ''
			: 'bg-black/50 backdrop-blur-sm'}"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
	>
		<!-- Modal Content -->
		<div
			class="relative flex max-h-[90vh] w-full {maxWidthClasses[
				maxWidth
			]} flex-col rounded-xl border border-theme bg-menu shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			{#if showHeader}
				<!-- Header -->
				<div class="flex items-center justify-between p-6 border-b border-theme">
					<div class="flex items-center gap-2 flex-1">
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
						class="p-2 rounded-full hover:bg-menu-hover transition-colors"
						aria-label="Schließen"
					>
						<Icon name="x" size={20} class="text-theme-muted" />
					</button>
				</div>
			{/if}

			<!-- Body (scrollable) -->
			<div class="flex-1 overflow-y-auto p-6">
				{@render children()}
			</div>

			<!-- Footer (optional) -->
			{#if footer}
				<div class="border-t border-theme p-6">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
