<!--
  Picker for the Companion page carousel — shows every page that isn't
  currently open and lets the user add it. Mirrors the PagePicker
  pattern from the todo module.
-->
<script lang="ts">
	import { ALL_COMPANION_PAGE_IDS, COMPANION_PAGE_META } from './page-meta';
	import type { CompanionPageId } from '../stores/workbench-settings.svelte';

	interface Props {
		openIds: CompanionPageId[];
		onPick: (id: CompanionPageId) => void;
		onClose: () => void;
	}

	let { openIds, onPick, onClose }: Props = $props();

	const availableIds = $derived(ALL_COMPANION_PAGE_IDS.filter((id) => !openIds.includes(id)));
</script>

<div class="picker">
	<header class="head">
		<span class="title">Page öffnen</span>
		<button type="button" onclick={onClose} aria-label="Schließen">×</button>
	</header>

	{#if availableIds.length === 0}
		<p class="empty">Alle Pages sind bereits geöffnet.</p>
	{:else}
		<ul>
			{#each availableIds as id (id)}
				{@const m = COMPANION_PAGE_META[id]}
				<li>
					<button type="button" class="row" onclick={() => onPick(id)} style="--accent: {m.color};">
						<span class="icon"><m.icon size={16} weight="bold" /></span>
						<span class="body">
							<span class="t">{m.title}</span>
							<span class="d">{m.description}</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.picker {
		width: 320px;
		padding: 0.5rem;
		background: hsl(var(--color-card));
		border: 2px solid hsl(0 0% 0% / 0.12);
		border-radius: 1.25rem;
		align-self: stretch;
		min-height: 60vh;
		display: flex;
		flex-direction: column;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0.5rem 0.75rem;
	}
	.title {
		font-weight: 600;
		font-size: 0.875rem;
	}
	.head button {
		border: none;
		background: none;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
	}
	.empty {
		padding: 1rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		overflow-y: auto;
	}
	.row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem;
		align-items: start;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface));
		text-align: left;
		cursor: pointer;
		font: inherit;
		color: hsl(var(--color-foreground));
	}
	.row:hover {
		border-color: var(--accent, hsl(var(--color-primary)));
		background: color-mix(
			in oklab,
			var(--accent, hsl(var(--color-primary))) 8%,
			hsl(var(--color-surface))
		);
	}
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: color-mix(in oklab, var(--accent, hsl(var(--color-primary))) 14%, transparent);
		color: var(--accent, hsl(var(--color-primary)));
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.t {
		font-weight: 600;
		font-size: 0.875rem;
	}
	.d {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
