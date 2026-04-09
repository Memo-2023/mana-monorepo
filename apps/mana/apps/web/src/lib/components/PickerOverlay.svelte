<!--
  PickerOverlay — shared shell for the workbench page-/app-/option-picker
  panels (AppPagePicker, ContactPagePicker, todo PagePicker, …).

  Encodes the slide-in cream-paper card with header (title + close), list
  area with auto-dividers, empty state, and optional footer slot. The
  per-row content is provided via the `item` snippet.

  All inner classes (`.picker-option`, `.option-icon`, `.option-text`,
  `.option-title`, `.option-desc`, `.divider`) are exported as `:global`
  so consumer snippets can use them without redefining the styles.
-->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { X } from '@mana/shared-icons';

	interface Props<TItem> {
		title: string;
		items: TItem[];
		onClose: () => void;
		item: Snippet<[TItem, number]>;
		/** Optional snippet rendered between the header and the list
		 *  (e.g. a search input). */
		subheader?: Snippet;
		/** Optional snippet rendered after the items (e.g. "create custom" button). */
		footer?: Snippet;
		emptyLabel?: string;
		/** CSS width for the panel; default 320px. */
		width?: string;
	}

	let {
		title,
		items,
		onClose,
		item,
		subheader,
		footer,
		emptyLabel = 'Keine Einträge',
		width = '320px',
	}: Props<T> = $props();
</script>

<div class="picker" style="--picker-width: {width};">
	<div class="picker-header">
		<h3 class="picker-title">{title}</h3>
		<button class="close-btn" onclick={onClose} title={$_('common.close')}>
			<X size={16} />
		</button>
	</div>
	{#if subheader}
		<div class="picker-subheader">
			{@render subheader()}
		</div>
	{/if}
	<div class="picker-list">
		{#each items as entry, i}
			{#if i > 0}<div class="divider"></div>{/if}
			{@render item(entry, i)}
		{/each}
		{#if footer}
			{#if items.length > 0}<div class="divider"></div>{/if}
			{@render footer()}
		{:else if items.length === 0}
			<div class="empty-state"><p>{emptyLabel}</p></div>
		{/if}
	</div>
</div>

<style>
	.picker {
		flex: 0 0 auto;
		width: min(var(--picker-width), 85vw);
		min-height: 60vh;
		max-height: 80vh;
		background: hsl(var(--color-card));
		border-radius: 0.375rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		animation: slideIn 0.25s ease-out;
	}
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		flex-shrink: 0;
	}
	.picker-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 0.375rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.close-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.picker-subheader {
		padding: 0 1rem 0.5rem;
		flex-shrink: 0;
	}

	.picker-list {
		flex: 1;
		overflow-y: auto;
		padding: 0 0.5rem 0.75rem;
	}

	/* Divider between rows — used by both auto-render above and consumer snippets. */
	:global(.picker .divider) {
		height: 1px;
		background: hsl(var(--color-muted));
		margin: 0 0.5rem;
	}
	/* Standard option button — consumers use these classes inside the item snippet. */
	:global(.picker .picker-option) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 0.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: background 0.15s;
		text-align: left;
	}
	:global(.picker .picker-option:hover) {
		background: hsl(var(--color-surface-hover));
	}
	:global(.picker .option-icon) {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 0.5rem;
		background: color-mix(in srgb, currentColor 10%, transparent);
	}

	:global(.picker .option-text) {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}
	:global(.picker .option-title) {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	:global(.picker .option-desc) {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
	}
	.empty-state p {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
