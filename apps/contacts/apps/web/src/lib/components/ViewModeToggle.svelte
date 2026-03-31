<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { viewModeStore, type ViewMode } from '$lib/stores/view-mode.svelte';
	import { SquaresFour, SortAscending } from '@manacore/shared-icons';

	const modes: { id: ViewMode; icon: string; label: string }[] = [
		{ id: 'alphabet', icon: 'alphabet', label: 'views.alphabet' },
		{ id: 'grid', icon: 'grid', label: 'views.grid' },
	];
</script>

<div class="view-mode-toggle">
	{#each modes as mode}
		<button
			type="button"
			class="view-mode-btn"
			class:active={viewModeStore.mode === mode.id}
			onclick={() => viewModeStore.setMode(mode.id)}
			title={$_(mode.label)}
		>
			{#if mode.icon === 'grid'}
				<SquaresFour size={20} />
			{:else if mode.icon === 'alphabet'}
				<SortAscending size={20} />
			{/if}
		</button>
	{/each}
</div>

<style>
	.view-mode-toggle {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background-color: hsl(var(--muted));
		border-radius: var(--radius-lg);
	}

	.view-mode-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		color: hsl(var(--muted-foreground));
		transition: all var(--transition-fast);
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.view-mode-btn:hover {
		color: hsl(var(--foreground));
		background-color: hsl(var(--background) / 0.5);
	}

	.view-mode-btn.active {
		color: hsl(var(--primary));
		background-color: hsl(var(--background));
		box-shadow: var(--shadow-sm);
	}
</style>
