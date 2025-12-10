<script lang="ts">
	import { labelsStore } from '$lib/stores/labels.svelte';

	interface Props {
		selectedIds: string[];
		onChange: (ids: string[]) => void;
	}

	let { selectedIds, onChange }: Props = $props();

	let showDropdown = $state(false);

	function toggleLabel(labelId: string) {
		if (selectedIds.includes(labelId)) {
			onChange(selectedIds.filter((id) => id !== labelId));
		} else {
			onChange([...selectedIds, labelId]);
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

<div class="label-selector">
	<button type="button" class="label-trigger" onclick={handleTriggerClick}>
		{#if selectedIds.length === 0}
			<span class="text-muted">Labels auswählen...</span>
		{:else}
			<div class="selected-labels">
				{#each selectedIds.slice(0, 3) as labelId}
					{@const label = labelsStore.getById(labelId)}
					{#if label}
						<span class="label-tag" style="--label-color: {label.color}">
							{label.name}
						</span>
					{/if}
				{/each}
				{#if selectedIds.length > 3}
					<span class="label-more">+{selectedIds.length - 3}</span>
				{/if}
			</div>
		{/if}
		<svg class="dropdown-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if showDropdown}
		<div class="label-dropdown" onclick={(e) => e.stopPropagation()} role="listbox">
			{#each labelsStore.labels as label}
				<button
					type="button"
					class="label-option"
					class:selected={selectedIds.includes(label.id)}
					onclick={() => toggleLabel(label.id)}
					role="option"
					aria-selected={selectedIds.includes(label.id)}
				>
					<span class="label-dot" style="background-color: {label.color}"></span>
					<span class="label-name">{label.name}</span>
					{#if selectedIds.includes(label.id)}
						<svg class="check-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{/if}
				</button>
			{/each}
			{#if labelsStore.labels.length === 0}
				<div class="no-labels">Keine Labels vorhanden</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.label-selector {
		position: relative;
	}

	.label-trigger {
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

	:global(.dark) .label-trigger {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.label-trigger:hover {
		border-color: rgba(0, 0, 0, 0.25);
	}

	.text-muted {
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.selected-labels {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.label-tag {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--label-color) 15%, transparent);
		color: var(--label-color);
		font-weight: 500;
	}

	.label-more {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.dropdown-arrow {
		width: 1rem;
		height: 1rem;
		color: #9ca3af;
	}

	.label-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		max-height: 200px;
		overflow-y: auto;
		padding: 0.375rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	:global(.dark) .label-dropdown {
		background: rgba(40, 40, 40, 0.95);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.label-option {
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

	.label-option:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .label-option:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.label-option.selected {
		background: rgba(139, 92, 246, 0.1);
	}

	.label-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.label-name {
		flex: 1;
		font-size: 0.875rem;
		color: #374151;
	}

	:global(.dark) .label-name {
		color: #e5e7eb;
	}

	.check-icon {
		width: 1rem;
		height: 1rem;
		color: #8b5cf6;
	}

	.no-labels {
		padding: 0.75rem;
		text-align: center;
		font-size: 0.875rem;
		color: #9ca3af;
	}
</style>
