<script lang="ts">
	/**
	 * EmptyState - Standardized empty state display
	 *
	 * Used when a list, search, or section has no content to display.
	 * Provides consistent visual feedback with optional action button.
	 *
	 * @example Basic usage
	 * ```svelte
	 * <EmptyState
	 *   title="No memos yet"
	 *   message="Start recording to create your first memo"
	 * />
	 * ```
	 *
	 * @example With action and icon
	 * ```svelte
	 * <EmptyState
	 *   title="No results found"
	 *   message="Try adjusting your search or filters"
	 *   actionLabel="Clear filters"
	 *   onAction={() => clearFilters()}
	 * >
	 *   {#snippet icon()}
	 *     <SearchIcon class="w-12 h-12" />
	 *   {/snippet}
	 * </EmptyState>
	 * ```
	 */

	import type { Snippet } from 'svelte';
	import { Text, Button } from '../../atoms';
	import { Tray } from '@manacore/shared-icons';

	type EmptyStateVariant = 'default' | 'compact' | 'centered';

	interface Props {
		/** Title text */
		title: string;
		/** Description message */
		message?: string;
		/** Action button label */
		actionLabel?: string;
		/** Action button callback */
		onAction?: () => void;
		/** Secondary action label */
		secondaryActionLabel?: string;
		/** Secondary action callback */
		onSecondaryAction?: () => void;
		/** Layout variant */
		variant?: EmptyStateVariant;
		/** Custom icon snippet */
		icon?: Snippet;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		title,
		message,
		actionLabel,
		onAction,
		secondaryActionLabel,
		onSecondaryAction,
		variant = 'default',
		icon,
		class: className = '',
	}: Props = $props();

	const variantClasses: Record<EmptyStateVariant, string> = {
		default: 'py-12 px-6',
		compact: 'py-6 px-4',
		centered: 'py-16 px-8',
	};
</script>

<div
	class="empty-state flex flex-col items-center justify-center text-center {variantClasses[
		variant
	]} {className}"
>
	<!-- Icon -->
	{#if icon}
		<div class="empty-state__icon mb-4 text-theme-secondary opacity-50">
			{@render icon()}
		</div>
	{:else}
		<!-- Default icon -->
		<div class="empty-state__icon mb-4 text-theme-secondary opacity-50">
			<Tray size={48} />
		</div>
	{/if}

	<!-- Title -->
	<Text variant="body" weight="semibold" class="mb-2">
		{title}
	</Text>

	<!-- Message -->
	{#if message}
		<Text variant="muted" class="max-w-sm mb-4">
			{message}
		</Text>
	{/if}

	<!-- Actions -->
	{#if actionLabel || secondaryActionLabel}
		<div class="empty-state__actions flex gap-3 mt-2">
			{#if secondaryActionLabel && onSecondaryAction}
				<Button variant="ghost" onclick={onSecondaryAction}>
					{secondaryActionLabel}
				</Button>
			{/if}
			{#if actionLabel && onAction}
				<Button variant="primary" onclick={onAction}>
					{actionLabel}
				</Button>
			{/if}
		</div>
	{/if}
</div>
