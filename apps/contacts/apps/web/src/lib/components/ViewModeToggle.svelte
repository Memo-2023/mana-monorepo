<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { viewModeStore, type ViewMode } from '$lib/stores/view-mode.svelte';

	const modes: { id: ViewMode; icon: string; label: string }[] = [
		{ id: 'list', icon: 'list', label: 'views.list' },
		{ id: 'grid', icon: 'grid', label: 'views.grid' },
		{ id: 'alphabet', icon: 'alphabet', label: 'views.alphabet' },
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
			{#if mode.icon === 'list'}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			{:else if mode.icon === 'grid'}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
					/>
				</svg>
			{:else if mode.icon === 'alphabet'}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
					/>
				</svg>
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
