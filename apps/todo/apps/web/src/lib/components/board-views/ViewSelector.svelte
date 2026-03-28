<script lang="ts">
	import type { LocalBoardView } from '$lib/data/local-store';

	interface Props {
		views: LocalBoardView[];
		activeViewId: string | null;
		onSelect: (viewId: string) => void;
	}

	let { views, activeViewId, onSelect }: Props = $props();

	// Map icon names to simple SVG representations
	const iconMap: Record<string, string> = {
		columns: 'M9 4h6v16H9zM3 4h4v16H3zM17 4h4v16h-4z',
		'grid-four': 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
		flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
		folders: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
		calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
	};
</script>

<div class="view-selector-container">
	<div class="view-selector">
		<div class="view-pills-scroll">
			{#each views as view (view.id)}
				<button
					type="button"
					class="view-pill"
					class:active={activeViewId === view.id}
					onclick={() => onSelect(view.id)}
				>
					{#if view.icon && iconMap[view.icon]}
						<svg
							class="h-4 w-4 mr-1.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d={iconMap[view.icon]} />
						</svg>
					{:else if view.icon}
						<span class="mr-1.5 text-sm">{view.icon}</span>
					{/if}
					<span class="view-name">{view.name}</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.view-selector-container {
		padding: 0 1rem;
		margin-bottom: 0.75rem;
	}

	@media (min-width: 640px) {
		.view-selector-container {
			padding: 0 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.view-selector-container {
			padding: 0 2rem;
		}
	}

	.view-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		/* Glass-Pill container */
		background: rgba(255, 255, 255, 0.65);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 9999px;
		padding: 0.375rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.07),
			0 2px 4px -1px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .view-selector {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.view-pills-scroll {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		overflow-x: auto;
		scroll-behavior: smooth;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.view-pills-scroll::-webkit-scrollbar {
		display: none;
	}

	.view-pill {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.view-pill:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .view-pill {
		color: #9ca3af;
	}

	:global(.dark) .view-pill:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #f3f4f6;
	}

	.view-pill.active {
		background: #8b5cf6;
		color: white;
		box-shadow:
			0 2px 4px -1px rgba(0, 0, 0, 0.15),
			0 1px 2px -1px rgba(0, 0, 0, 0.1);
	}

	.view-pill.active:hover {
		filter: brightness(1.1);
		color: white;
	}

	:global(.dark) .view-pill.active {
		background: #8b5cf6;
		color: white;
	}

	.view-name {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
