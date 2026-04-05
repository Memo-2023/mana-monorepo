<script lang="ts">
	import { X, Plus, CornersOut, ArrowLineUp } from '@mana/shared-icons';
	import type { MinimizedPage } from './types';

	interface Props {
		pages: MinimizedPage[];
		onRestore: (pageId: string) => void;
		onRemove: (pageId: string) => void;
		onMaximize?: (pageId: string) => void;
		onAdd: () => void;
	}

	let { pages, onRestore, onRemove, onMaximize, onAdd }: Props = $props();
</script>

{#if pages.length > 0}
	<div class="minimized-tabs">
		{#each pages as pg (pg.id)}
			<div
				class="minimized-tab"
				role="button"
				tabindex="0"
				onclick={() => onRestore(pg.id)}
				onkeydown={(e) => e.key === 'Enter' && onRestore(pg.id)}
			>
				<span class="minimized-tab-dot" style="background-color: {pg.color}"></span>
				<span class="minimized-tab-title">{pg.title}</span>
				<div class="minimized-tab-actions">
					<button
						class="minimized-tab-btn"
						onclick={(e) => {
							e.stopPropagation();
							onRestore(pg.id);
						}}
						title="Wiederherstellen"
					>
						<ArrowLineUp size={12} />
					</button>
					{#if onMaximize}
						<button
							class="minimized-tab-btn"
							onclick={(e) => {
								e.stopPropagation();
								onMaximize(pg.id);
							}}
							title="Maximieren"
						>
							<CornersOut size={12} />
						</button>
					{/if}
					<button
						class="minimized-tab-btn"
						onclick={(e) => {
							e.stopPropagation();
							onRemove(pg.id);
						}}
						title="Schließen"
					>
						<X size={12} />
					</button>
				</div>
			</div>
		{/each}
		<button class="minimized-tab-add" onclick={onAdd} title="Neue Seite hinzufügen">
			<Plus size={14} />
		</button>
	</div>
{/if}

<style>
	.minimized-tabs {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.3rem 0.5rem;
		background: var(--color-surface-elevated, #fffef5);
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
		border-radius: 0.625rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		overflow-x: auto;
		scrollbar-width: none;
		width: fit-content;
	}
	:global(.dark) .minimized-tabs {
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
	}
	.minimized-tabs::-webkit-scrollbar {
		display: none;
	}

	.minimized-tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 0.3rem;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
		font-family: inherit;
	}
	.minimized-tab:hover {
		background: rgba(0, 0, 0, 0.05);
	}
	:global(.dark) .minimized-tab:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.minimized-tab-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.minimized-tab-title {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-muted-foreground, #6b7280);
	}

	.minimized-tab-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.minimized-tab-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground, #d1d5db);
		border-radius: 0.25rem;
		cursor: pointer;
		padding: 0;
		transition: all 0.15s;
		opacity: 0.5;
	}
	.minimized-tab-btn:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .minimized-tab-btn:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.minimized-tab-add {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 0.3rem;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground, #9ca3af);
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
		opacity: 0.6;
	}
	.minimized-tab-add:hover {
		opacity: 1;
		color: var(--color-primary, #8b5cf6);
	}
</style>
