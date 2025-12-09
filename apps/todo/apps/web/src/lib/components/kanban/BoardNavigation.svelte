<script lang="ts">
	import type { KanbanBoard } from '@todo/shared';

	interface Props {
		boards: KanbanBoard[];
		currentBoardId: string | null;
		loading?: boolean;
		position?: 'top' | 'bottom';
		onSelectBoard: (boardId: string) => void;
		onCreateBoard: () => void;
	}

	let {
		boards,
		currentBoardId,
		loading = false,
		position = 'top',
		onSelectBoard,
		onCreateBoard,
	}: Props = $props();
</script>

<div class="board-nav-container" class:position-bottom={position === 'bottom'}>
	<div class="board-nav">
		<!-- Create Board Button -->
		<button
			type="button"
			class="board-pill create-pill"
			onclick={onCreateBoard}
			title="Neues Board erstellen"
			disabled={loading}
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		<!-- Board Pills -->
		<div class="board-pills-scroll">
			{#each boards as board (board.id)}
				<button
					type="button"
					class="board-pill"
					class:active={currentBoardId === board.id}
					onclick={() => onSelectBoard(board.id)}
					disabled={loading}
					style="--board-color: {board.color}"
				>
					{#if board.isGlobal}
						<svg
							class="h-4 w-4 mr-1.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{:else if board.icon}
						<span class="mr-1.5">{board.icon}</span>
					{:else}
						<span class="board-color-dot mr-1.5" style="background-color: {board.color}"></span>
					{/if}
					<span class="board-name">{board.name}</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.board-nav-container {
		padding: 0 1rem;
		margin-bottom: 0.75rem;
	}

	/* Bottom position styles */
	.board-nav-container.position-bottom {
		position: fixed;
		bottom: 70px; /* Above PillNav */
		left: 0;
		right: 0;
		margin-bottom: 0;
		padding: 0.5rem 1rem;
		z-index: 40;
		background: linear-gradient(to top, var(--background) 0%, transparent 100%);
		padding-bottom: 0.75rem;
	}

	@media (min-width: 640px) {
		.board-nav-container {
			padding: 0 1.5rem;
		}
		.board-nav-container.position-bottom {
			padding: 0.5rem 1.5rem;
			padding-bottom: 0.75rem;
		}
	}

	@media (min-width: 1024px) {
		.board-nav-container {
			padding: 0 2rem;
		}
		.board-nav-container.position-bottom {
			padding: 0.5rem 2rem;
			padding-bottom: 0.75rem;
		}
	}

	.board-nav {
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

	:global(.dark) .board-nav {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.position-bottom .board-nav {
		box-shadow:
			0 -4px 6px -1px rgba(0, 0, 0, 0.07),
			0 -2px 4px -1px rgba(0, 0, 0, 0.04),
			0 4px 6px -1px rgba(0, 0, 0, 0.07),
			0 2px 4px -1px rgba(0, 0, 0, 0.04);
	}

	.board-pills-scroll {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		overflow-x: auto;
		scroll-behavior: smooth;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.board-pills-scroll::-webkit-scrollbar {
		display: none;
	}

	.board-pill {
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

	.board-pill:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .board-pill {
		color: #9ca3af;
	}

	:global(.dark) .board-pill:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
		color: #f3f4f6;
	}

	.board-pill.active {
		background: var(--board-color, #8b5cf6);
		color: white;
		box-shadow:
			0 2px 4px -1px rgba(0, 0, 0, 0.15),
			0 1px 2px -1px rgba(0, 0, 0, 0.1);
	}

	.board-pill.active:hover:not(:disabled) {
		filter: brightness(1.1);
		color: white;
	}

	:global(.dark) .board-pill.active {
		background: var(--board-color, #8b5cf6);
		color: white;
	}

	.board-pill:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.create-pill {
		background: rgba(139, 92, 246, 0.1);
		color: #8b5cf6;
		padding: 0.5rem;
	}

	.create-pill:hover:not(:disabled) {
		background: rgba(139, 92, 246, 0.2);
		color: #7c3aed;
	}

	:global(.dark) .create-pill {
		background: rgba(139, 92, 246, 0.2);
		color: #a78bfa;
	}

	:global(.dark) .create-pill:hover:not(:disabled) {
		background: rgba(139, 92, 246, 0.3);
		color: #c4b5fd;
	}

	.board-color-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.board-name {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
