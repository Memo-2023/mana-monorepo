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
			<svg
				class="w-12 h-12"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
				/>
			</svg>
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
