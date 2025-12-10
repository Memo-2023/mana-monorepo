<script lang="ts">
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
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
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
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.8);
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .storypoint-btn {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		color: #e5e7eb;
	}

	.storypoint-btn:hover {
		border-color: #8b5cf6;
	}

	.storypoint-btn.selected {
		background: rgba(139, 92, 246, 0.15);
		border-color: #8b5cf6;
		color: #8b5cf6;
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
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		cursor: pointer;
		transition: all 0.15s;
	}

	.storypoint-clear:hover {
		background: rgba(239, 68, 68, 0.2);
	}
</style>
