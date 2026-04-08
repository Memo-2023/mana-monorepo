<script lang="ts" generics="T">
	/**
	 * BaseListView — shared scaffolding for module ListView components.
	 *
	 * Encodes the workbench convention every Mana module's ListView shares:
	 *   wrapper padding → optional stats header → scrollable item region → empty state.
	 *
	 * Per-item rendering and data fetching stay with the consumer:
	 *   - Pass `items` (already filtered & decrypted via queries.ts).
	 *   - Provide an `item` snippet that renders one row.
	 *   - Provide an optional `header` snippet for stat counts or filters.
	 *
	 * @example
	 * ```svelte
	 * <BaseListView items={sorted} getKey={(q) => q.id} emptyTitle="Keine Fragen">
	 *   {#snippet header()}
	 *     <span>{questions.length} Fragen</span>
	 *   {/snippet}
	 *   {#snippet item(question)}
	 *     <button onclick={() => navigate('detail', { id: question.id })}>
	 *       {question.title}
	 *     </button>
	 *   {/snippet}
	 * </BaseListView>
	 * ```
	 */
	import type { Snippet } from 'svelte';
	import { EmptyState } from '../molecules';

	interface Props<TItem> {
		/** Items to render. Should already be filtered (deletedAt) and decrypted. */
		items: TItem[];
		/** Stable key extractor for the {#each} block. */
		getKey: (item: TItem) => string | number;
		/** Snippet that renders a single item row. */
		item: Snippet<[TItem, number]>;
		/** Optional header snippet (e.g. stat counts, filters). */
		header?: Snippet;
		/** Optional snippet rendered above the items but inside the scroll area. */
		listHeader?: Snippet;
		/** Optional snippet rendered at the very top, outside the scroll area (toolbar, voice bar, ...). */
		toolbar?: Snippet;
		/** Empty-state title. */
		emptyTitle?: string;
		/** Empty-state message. */
		emptyMessage?: string;
		/** Custom empty-state icon snippet. */
		emptyIcon?: Snippet;
		/** Override the entire empty area. */
		empty?: Snippet;
		/** Optional outer class override. */
		class?: string;
		/** Optional class for the inner scroll/list area. Use this to switch to grid, etc. */
		listClass?: string;
	}

	let {
		items,
		getKey,
		item,
		header,
		listHeader,
		toolbar,
		emptyTitle = 'Nichts hier',
		emptyMessage,
		emptyIcon,
		empty,
		class: className = '',
		listClass = '',
	}: Props<T> = $props();
</script>

<div class="flex h-full flex-col gap-3 p-3 sm:p-4 {className}">
	{#if toolbar}
		{@render toolbar()}
	{/if}

	{#if header}
		<div class="flex gap-3 text-xs text-white/40">
			{@render header()}
		</div>
	{/if}

	<div class="flex-1 overflow-auto {listClass}">
		{#if listHeader}
			{@render listHeader()}
		{/if}

		{#each items as entry, i (getKey(entry))}
			{@render item(entry, i)}
		{/each}

		{#if items.length === 0}
			{#if empty}
				{@render empty()}
			{:else}
				<EmptyState variant="compact" title={emptyTitle} message={emptyMessage} icon={emptyIcon} />
			{/if}
		{/if}
	</div>
</div>
