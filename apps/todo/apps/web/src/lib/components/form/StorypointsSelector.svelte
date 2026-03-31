<script lang="ts">
	import { X } from '@manacore/shared-icons';

	interface Props {
		value: number | null;
		onChange: (value: number | null) => void;
	}

	let { value, onChange }: Props = $props();

	// Fibonacci sequence for story points
	const options = [1, 2, 3, 5, 8, 13, 21];

	function handleSelect(sp: number) {
		onChange(value === sp ? null : sp);
	}

	function handleClear() {
		onChange(null);
	}
</script>

<div class="storypoint-buttons">
	{#each options as sp}
		<button
			type="button"
			class="storypoint-btn"
			class:selected={value === sp}
			onclick={() => handleSelect(sp)}
		>
			{sp}
		</button>
	{/each}
	{#if value !== null}
		<button type="button" class="storypoint-clear" onclick={handleClear} title="Zurücksetzen">
			<X size={16} />
		</button>
	{/if}
</div>

<style>
	.storypoint-buttons {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.storypoint-btn {
		min-width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 9999px;
		background: var(--color-surface);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 0.15s;
	}

	.storypoint-btn:hover {
		border-color: var(--color-primary);
	}

	.storypoint-btn.selected {
		background: color-mix(in srgb, var(--color-primary) 15%, transparent);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.storypoint-clear {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--color-error) 10%, transparent);
		color: var(--color-error);
		cursor: pointer;
		transition: all 0.15s;
	}

	.storypoint-clear:hover {
		background: color-mix(in srgb, var(--color-error) 20%, transparent);
	}
</style>
