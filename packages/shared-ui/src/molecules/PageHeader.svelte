<script lang="ts">
	/**
	 * PageHeader - Standardized page header layout
	 *
	 * Provides consistent page title, description, and action buttons layout.
	 *
	 * @example Basic usage
	 * ```svelte
	 * <PageHeader title="My Memos" />
	 * ```
	 *
	 * @example With description and actions
	 * ```svelte
	 * <PageHeader
	 *   title="Flashcard Decks"
	 *   description="Manage your study decks"
	 * >
	 *   {#snippet actions()}
	 *     <Button onclick={createDeck}>New Deck</Button>
	 *   {/snippet}
	 * </PageHeader>
	 * ```
	 *
	 * @example With breadcrumb and icon
	 * ```svelte
	 * <PageHeader title="Edit Profile">
	 *   {#snippet breadcrumb()}
	 *     <a href="/settings">Settings</a> / Profile
	 *   {/snippet}
	 *   {#snippet icon()}
	 *     <UserIcon />
	 *   {/snippet}
	 * </PageHeader>
	 * ```
	 */

	import type { Snippet } from 'svelte';
	import { Text } from '../atoms';

	type HeaderSize = 'sm' | 'md' | 'lg';

	interface Props {
		/** Page title */
		title: string;
		/** Page description/subtitle */
		description?: string;
		/** Header size variant */
		size?: HeaderSize;
		/** Whether to show bottom border */
		bordered?: boolean;
		/** Icon snippet (before title) */
		icon?: Snippet;
		/** Breadcrumb snippet (above title) */
		breadcrumb?: Snippet;
		/** Actions snippet (right side) */
		actions?: Snippet;
		/** Tabs or navigation snippet (below header) */
		tabs?: Snippet;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		title,
		description,
		size = 'md',
		bordered = false,
		icon,
		breadcrumb,
		actions,
		tabs,
		class: className = ''
	}: Props = $props();

	const sizeClasses: Record<HeaderSize, { container: string; title: string }> = {
		sm: {
			container: 'py-3',
			title: 'text-lg'
		},
		md: {
			container: 'py-4',
			title: 'text-xl'
		},
		lg: {
			container: 'py-6',
			title: 'text-2xl'
		}
	};
</script>

<header
	class="page-header {sizeClasses[size].container} {bordered
		? 'border-b border-theme'
		: ''} {className}"
>
	<!-- Breadcrumb -->
	{#if breadcrumb}
		<div class="page-header__breadcrumb mb-2 text-sm text-theme-secondary">
			{@render breadcrumb()}
		</div>
	{/if}

	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3 min-w-0">
			<!-- Icon -->
			{#if icon}
				<div class="page-header__icon flex-shrink-0 text-theme-secondary">
					{@render icon()}
				</div>
			{/if}

			<!-- Title & Description -->
			<div class="min-w-0">
				<h1 class="font-semibold text-theme {sizeClasses[size].title} truncate">
					{title}
				</h1>
				{#if description}
					<Text variant="muted" class="mt-1">
						{description}
					</Text>
				{/if}
			</div>
		</div>

		<!-- Actions -->
		{#if actions}
			<div class="page-header__actions flex-shrink-0 flex items-center gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>

	<!-- Tabs/Navigation -->
	{#if tabs}
		<div class="page-header__tabs mt-4">
			{@render tabs()}
		</div>
	{/if}
</header>
