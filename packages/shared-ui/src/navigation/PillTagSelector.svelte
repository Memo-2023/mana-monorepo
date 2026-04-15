<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tag, X, Plus, CaretDown } from '@mana/shared-icons';

	export interface TagItem {
		id: string;
		name: string;
		color: string;
	}

	interface Props {
		/** Available tags */
		tags: TagItem[];
		/** Currently selected tag IDs */
		selectedIds: string[];
		/** Called when a tag is toggled */
		onToggle: (tagId: string) => void;
		/** Called when selection is cleared */
		onClear: () => void;
		/** Called when "New Tag" is clicked */
		onCreate?: () => void;
		/** Loading state */
		loading?: boolean;
		/** Dropdown direction */
		direction?: 'up' | 'down';
		/** Label for the selector button */
		label?: string;
	}

	let {
		tags,
		selectedIds,
		onToggle,
		onClear,
		onCreate,
		loading = false,
		direction = 'up',
		label = 'Tags',
	}: Props = $props();

	let isOpen = $state(false);
	let triggerButton: HTMLButtonElement;
	let dropdownPosition = $state({ top: 0, left: 0 });

	// Count selected tags
	const selectedCount = $derived(selectedIds.length);
	const hasSelection = $derived(selectedCount > 0);

	// Get display label based on selection
	const displayLabel = $derived(
		hasSelection ? `${selectedCount} ${selectedCount === 1 ? 'Tag' : 'Tags'}` : label
	);

	function toggle() {
		if (triggerButton) {
			const rect = triggerButton.getBoundingClientRect();
			if (direction === 'down') {
				dropdownPosition = {
					top: rect.bottom + 8,
					left: rect.left,
				};
			} else {
				dropdownPosition = {
					top: rect.top - 8,
					left: rect.left,
				};
			}
		}
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}

	function handleTagClick(tagId: string) {
		onToggle(tagId);
	}

	function handleClearClick() {
		onClear();
		close();
	}

	function handleCreateClick() {
		onCreate?.();
		close();
	}

	function isSelected(tagId: string): boolean {
		return selectedIds.includes(tagId);
	}
</script>

<div class="pill-tag-selector">
	<!-- Trigger Button -->
	<button
		bind:this={triggerButton}
		onclick={toggle}
		class="pill glass-pill trigger-button"
		class:has-selection={hasSelection}
	>
		<Tag size={16} weight={hasSelection ? 'fill' : 'regular'} />
		<span class="pill-label">{displayLabel}</span>
		<CaretDown size={12} class={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
	</button>

	{#if isOpen}
		<!-- Backdrop -->
		<button
			class="menu-backdrop"
			onclick={close}
			onkeydown={(e) => e.key === 'Escape' && close()}
			aria-label="Close dropdown"
		></button>

		<!-- Dropdown panel -->
		<div
			class="dropdown-panel"
			class:panel-up={direction === 'up'}
			class:panel-down={direction === 'down'}
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		>
			{#if loading}
				<div class="loading-state">Lädt...</div>
			{:else if tags.length === 0}
				<div class="empty-state">
					<span>Keine Tags vorhanden</span>
					{#if onCreate}
						<button class="create-link" onclick={handleCreateClick}>
							<Plus size={14} weight="bold" />
							<span>Erstellen</span>
						</button>
					{/if}
				</div>
			{:else}
				<!-- Tag grid -->
				<div class="tag-grid">
					{#each tags as tag (tag.id)}
						<button
							class="tag-pill"
							class:selected={isSelected(tag.id)}
							onclick={() => handleTagClick(tag.id)}
							style="--tag-color: {tag.color || '#3b82f6'}"
						>
							<span class="tag-dot"></span>
							<span class="tag-name">{tag.name}</span>
						</button>
					{/each}
				</div>

				<!-- Footer with actions -->
				<div class="dropdown-footer">
					{#if hasSelection}
						<button class="footer-btn clear-btn" onclick={handleClearClick}>
							<X size={14} weight="bold" />
							<span>Löschen</span>
						</button>
					{/if}
					{#if onCreate}
						<button class="footer-btn create-btn" onclick={handleCreateClick}>
							<Plus size={14} weight="bold" />
							<span>Neuer Tag</span>
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.pill-tag-selector {
		position: relative;
		z-index: 1;
	}

	.pill-tag-selector:has(.dropdown-panel) {
		z-index: 10000;
	}

	.trigger-button {
		position: relative;
		z-index: 10;
	}

	/* Base pill styles */
	.pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	/* Solid theme-tokened pill (formerly the "glass" frosted pill). */
	.glass-pill {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		box-shadow:
			0 1px 2px hsl(0 0% 0% / 0.05),
			0 2px 6px hsl(0 0% 0% / 0.04);
		color: hsl(var(--color-foreground));
	}

	.glass-pill:hover {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-border-strong, var(--color-border)));
		box-shadow:
			0 6px 12px hsl(0 0% 0% / 0.08),
			0 2px 4px hsl(0 0% 0% / 0.05);
	}

	/* Active selection state */
	.trigger-button.has-selection {
		background: color-mix(in srgb, var(--pill-primary-color, #3b82f6) 15%, white 85%);
		border-color: color-mix(in srgb, var(--pill-primary-color, #3b82f6) 25%, transparent 75%);
	}

	:global(.dark) .trigger-button.has-selection {
		background: color-mix(in srgb, var(--pill-primary-color, #3b82f6) 25%, transparent 75%);
		border-color: color-mix(in srgb, var(--pill-primary-color, #3b82f6) 35%, transparent 65%);
	}

	:global(.chevron-icon) {
		transition: transform 0.2s;
		margin-left: 0.125rem;
	}

	:global(.chevron-icon.rotated) {
		transform: rotate(180deg);
	}

	.pill-label {
		display: inline;
	}

	/* Backdrop */
	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: transparent;
		border: none;
		cursor: default;
	}

	/* Dropdown panel */
	.dropdown-panel {
		position: fixed;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		z-index: 9999;
		min-width: 200px;
		max-width: 320px;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.1),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
		animation: panelIn 0.15s ease-out forwards;
	}

	:global(.dark) .dropdown-panel {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.panel-up {
		transform: translateY(-100%);
	}

	.panel-down {
		transform: translateY(0);
	}

	@keyframes panelIn {
		from {
			opacity: 0;
			transform: translateY(-100%) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(-100%) scale(1);
		}
	}

	.panel-down {
		animation-name: panelInDown;
	}

	@keyframes panelInDown {
		from {
			opacity: 0;
			transform: translateY(0) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Tag grid */
	.tag-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.8);
		color: #374151;
		transition: all 0.15s ease;
	}

	:global(.dark) .tag-pill {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.tag-pill:hover {
		transform: scale(1.05);
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .tag-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.tag-pill.selected {
		background: var(--tag-color) !important;
		border-color: var(--tag-color) !important;
		color: white;
	}

	.tag-pill.selected .tag-dot {
		background-color: white;
	}

	.tag-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--tag-color);
		flex-shrink: 0;
	}

	.tag-name {
		white-space: nowrap;
	}

	/* Footer */
	.dropdown-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .dropdown-footer {
		border-top-color: rgba(255, 255, 255, 0.15);
	}

	.footer-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		background: transparent;
		color: #6b7280;
		transition: all 0.15s ease;
	}

	:global(.dark) .footer-btn {
		color: #9ca3af;
	}

	.footer-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .footer-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.clear-btn {
		color: #ef4444;
	}

	.clear-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	:global(.dark) .clear-btn {
		color: #f87171;
	}

	:global(.dark) .clear-btn:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
	}

	.create-btn {
		color: #3b82f6;
	}

	.create-btn:hover {
		background: rgba(59, 130, 246, 0.1);
		color: #2563eb;
	}

	:global(.dark) .create-btn {
		color: #60a5fa;
	}

	:global(.dark) .create-btn:hover {
		background: rgba(59, 130, 246, 0.15);
		color: #93c5fd;
	}

	/* Loading and empty states */
	.loading-state,
	.empty-state {
		padding: 1rem;
		text-align: center;
		font-size: 0.875rem;
		color: #6b7280;
	}

	:global(.dark) .loading-state,
	:global(.dark) .empty-state {
		color: #9ca3af;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.create-link {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #3b82f6;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.create-link:hover {
		background: rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .create-link {
		color: #60a5fa;
	}

	:global(.dark) .create-link:hover {
		background: rgba(59, 130, 246, 0.15);
	}
</style>
