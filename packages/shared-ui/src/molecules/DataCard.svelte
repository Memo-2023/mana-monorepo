<script lang="ts">
	/**
	 * DataCard - Generic card for displaying data items
	 *
	 * Used for displaying items like memos, decks, blueprints, etc.
	 * Provides consistent layout with title, description, metadata, and actions.
	 *
	 * @example Basic usage
	 * ```svelte
	 * <DataCard
	 *   title="My Deck"
	 *   description="A collection of flashcards"
	 *   onclick={() => openDeck(deck.id)}
	 * />
	 * ```
	 *
	 * @example With metadata and actions
	 * ```svelte
	 * <DataCard title={memo.title} description={memo.summary}>
	 *   {#snippet metadata()}
	 *     <span>5 min ago</span>
	 *     <Badge>Audio</Badge>
	 *   {/snippet}
	 *   {#snippet actions()}
	 *     <Button variant="ghost" size="sm" onclick={edit}>Edit</Button>
	 *     <Button variant="ghost" size="sm" onclick={del}>Delete</Button>
	 *   {/snippet}
	 * </DataCard>
	 * ```
	 */

	import type { Snippet } from 'svelte';
	import { Text } from '../atoms';

	type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

	interface Props {
		/** Card title */
		title: string;
		/** Card description/subtitle */
		description?: string;
		/** Card variant */
		variant?: CardVariant;
		/** Whether card is interactive (clickable) */
		interactive?: boolean;
		/** Click handler */
		onclick?: () => void;
		/** Icon/thumbnail snippet (left side) */
		icon?: Snippet;
		/** Metadata snippet (below description) */
		metadata?: Snippet;
		/** Actions snippet (right side or bottom) */
		actions?: Snippet;
		/** Badge/status snippet (top right) */
		badge?: Snippet;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		title,
		description,
		variant = 'default',
		interactive = false,
		onclick,
		icon,
		metadata,
		actions,
		badge,
		class: className = ''
	}: Props = $props();

	const variantClasses: Record<CardVariant, string> = {
		default: 'bg-menu border border-theme',
		elevated: 'bg-menu border border-theme shadow-md',
		outlined: 'bg-transparent border-2 border-theme',
		ghost: 'bg-transparent border-transparent hover:bg-menu-hover'
	};

	const isClickable = $derived(interactive || !!onclick);
</script>

<div
	class="data-card rounded-xl p-4 transition-colors {variantClasses[variant]} {isClickable
		? 'cursor-pointer hover:bg-menu-hover'
		: ''} {className}"
	onclick={onclick}
	onkeydown={(e) => {
		if (isClickable && onclick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onclick();
		}
	}}
	role={isClickable ? 'button' : undefined}
	tabindex={isClickable ? 0 : undefined}
>
	<div class="flex items-start gap-3">
		<!-- Icon/Thumbnail -->
		{#if icon}
			<div class="data-card__icon flex-shrink-0">
				{@render icon()}
			</div>
		{/if}

		<!-- Content -->
		<div class="data-card__content flex-1 min-w-0">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0">
					<!-- Title -->
					<Text variant="body" weight="semibold" class="truncate">
						{title}
					</Text>

					<!-- Description -->
					{#if description}
						<Text variant="muted" class="mt-1 line-clamp-2">
							{description}
						</Text>
					{/if}
				</div>

				<!-- Badge -->
				{#if badge}
					<div class="data-card__badge flex-shrink-0">
						{@render badge()}
					</div>
				{/if}
			</div>

			<!-- Metadata -->
			{#if metadata}
				<div class="data-card__metadata mt-2 flex items-center gap-2 text-sm text-theme-secondary">
					{@render metadata()}
				</div>
			{/if}
		</div>

		<!-- Actions -->
		{#if actions}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div class="data-card__actions flex-shrink-0 flex items-center gap-1" onclick={(e) => e.stopPropagation()}>
				{@render actions()}
			</div>
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
