<script lang="ts">
	import { getContext } from 'svelte';
	import type { Tag } from '@manacore/shared-tags';
	import { CaretDown, Check } from '@manacore/shared-icons';

	const tagsCtx: { readonly value: Tag[] } = getContext('tags');

	interface Props {
		selectedIds: string[];
		onChange: (ids: string[]) => void;
	}

	let { selectedIds, onChange }: Props = $props();

	let showDropdown = $state(false);

	function toggleTag(tagId: string) {
		if (selectedIds.includes(tagId)) {
			onChange(selectedIds.filter((id) => id !== tagId));
		} else {
			onChange([...selectedIds, tagId]);
		}
	}

	function handleTriggerClick(e: MouseEvent) {
		e.stopPropagation();
		showDropdown = !showDropdown;
	}

	function handleWindowClick() {
		showDropdown = false;
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="tag-selector">
	<button type="button" class="tag-trigger" onclick={handleTriggerClick}>
		{#if selectedIds.length === 0}
			<span class="text-muted">Tags auswählen...</span>
		{:else}
			<div class="selected-tags">
				{#each selectedIds.slice(0, 3) as tagId}
					{@const tag = tagsCtx.value.find((t) => t.id === tagId)}
					{#if tag}
						<span class="tag-chip" style="--tag-color: {tag.color}">
							{tag.name}
						</span>
					{/if}
				{/each}
				{#if selectedIds.length > 3}
					<span class="tag-more">+{selectedIds.length - 3}</span>
				{/if}
			</div>
		{/if}
		<CaretDown size={20} class="dropdown-arrow" />
	</button>

	{#if showDropdown}
		<div class="tag-dropdown" onclick={(e) => e.stopPropagation()} role="listbox">
			{#each tagsCtx.value as tag}
				<button
					type="button"
					class="tag-option"
					class:selected={selectedIds.includes(tag.id)}
					onclick={() => toggleTag(tag.id)}
					role="option"
					aria-selected={selectedIds.includes(tag.id)}
				>
					<span class="tag-dot" style="background-color: {tag.color}"></span>
					<span class="tag-name">{tag.name}</span>
					{#if selectedIds.includes(tag.id)}
						<Check size={20} class="check-icon" />
					{/if}
				</button>
			{/each}
			{#if tagsCtx.value.length === 0}
				<div class="no-tags">Keine Tags vorhanden</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.tag-selector {
		position: relative;
	}

	.tag-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.875rem;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .tag-trigger {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.tag-trigger:hover {
		border-color: rgba(0, 0, 0, 0.25);
	}

	.text-muted {
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.selected-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.tag-chip {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--tag-color) 15%, transparent);
		color: var(--tag-color);
		font-weight: 500;
	}

	.tag-more {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.dropdown-arrow {
		width: 1rem;
		height: 1rem;
		color: #9ca3af;
	}

	.tag-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		max-height: 200px;
		overflow-y: auto;
		padding: 0.375rem;
		border-radius: 0.75rem;
		background: var(--color-surface-elevated-3);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-xl);
		z-index: 10;
	}

	.tag-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
	}

	.tag-option:hover {
		background: var(--color-surface-hover);
	}

	.tag-option.selected {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
	}

	.tag-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.tag-name {
		flex: 1;
		font-size: 0.875rem;
		color: var(--color-foreground);
	}

	.check-icon {
		width: 1rem;
		height: 1rem;
		color: var(--color-primary);
	}

	.no-tags {
		padding: 0.75rem;
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}
</style>
