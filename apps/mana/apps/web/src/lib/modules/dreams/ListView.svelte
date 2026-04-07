<!--
  Dreams — Workbench ListView
  Quick capture, inline edit, mood + lucid + symbol affordances.
-->
<script lang="ts">
	import {
		computeInsights,
		formatDreamDate,
		groupByMonth,
		searchDreams,
		useAllDreams,
	} from './queries';
	import { dreamsStore } from './stores/dreams.svelte';
	import { MOOD_COLORS, MOOD_LABELS, type Dream, type DreamMood } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { PencilSimple, PushPin, Trash } from '@mana/shared-icons';

	let { navigate, goBack, params }: ViewProps = $props();

	let dreams$ = useAllDreams();
	let dreams = $derived(dreams$.value);

	let searchQuery = $state('');
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');
	let editSymbols = $state('');
	let editMood = $state<DreamMood | null>(null);
	let editIsLucid = $state(false);
	let newTitle = $state('');

	let filtered = $derived(searchDreams(dreams, searchQuery));
	let grouped = $derived(groupByMonth(filtered));
	let insights = $derived(computeInsights(dreams));

	async function handleQuickCreate(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !newTitle.trim()) return;
		e.preventDefault();
		const dream = await dreamsStore.createDream({ title: newTitle.trim() });
		newTitle = '';
		startEdit(dream);
	}

	function startEdit(dream: Dream) {
		if (editingId && editingId !== dream.id) saveEdit();
		editingId = dream.id;
		editTitle = dream.title ?? '';
		editContent = dream.content;
		editSymbols = (dream.symbols ?? []).join(', ');
		editMood = dream.mood;
		editIsLucid = dream.isLucid;
	}

	async function saveEdit() {
		if (!editingId) return;
		const symbols = editSymbols
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		await dreamsStore.updateDream(editingId, {
			title: editTitle.trim() || null,
			content: editContent,
			symbols,
			mood: editMood,
			isLucid: editIsLucid,
		});
		editingId = null;
	}

	async function handleDelete(id: string) {
		await dreamsStore.deleteDream(id);
		if (editingId === id) editingId = null;
	}

	// Context menu
	let ctxMenu = $state<{ visible: boolean; x: number; y: number; dream: Dream | null }>({
		visible: false,
		x: 0,
		y: 0,
		dream: null,
	});

	function handleItemContextMenu(e: MouseEvent, dream: Dream) {
		e.preventDefault();
		ctxMenu = { visible: true, x: e.clientX, y: e.clientY, dream };
	}

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.dream
			? [
					{
						id: 'edit',
						label: 'Bearbeiten',
						icon: PencilSimple,
						action: () => {
							if (ctxMenu.dream) startEdit(ctxMenu.dream);
						},
					},
					{
						id: 'pin',
						label: ctxMenu.dream.isPinned ? 'Lösen' : 'Pinnen',
						icon: PushPin,
						action: () => {
							if (ctxMenu.dream) dreamsStore.togglePin(ctxMenu.dream.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							if (ctxMenu.dream) handleDelete(ctxMenu.dream.id);
						},
					},
				]
			: []
	);

	const MOODS: DreamMood[] = ['angenehm', 'neutral', 'unangenehm', 'albtraum'];
</script>

<div class="app-view">
	<!-- Quick create -->
	<form onsubmit={(e) => e.preventDefault()} class="quick-add">
		<span class="add-icon">&#x1f319;</span>
		<input
			class="add-input"
			type="text"
			placeholder="Was hast du geträumt? (Enter)"
			bind:value={newTitle}
			onkeydown={handleQuickCreate}
		/>
	</form>

	<!-- Insights ribbon -->
	{#if insights.total > 0}
		<div class="insights">
			<span class="ins-stat">{insights.total} Träume</span>
			{#if insights.lucidCount > 0}
				<span class="ins-stat">&#x2728; {insights.lucidCount} Klarträume</span>
			{/if}
			{#each insights.topSymbols as sym}
				<span class="ins-symbol">{sym.name} · {sym.count}</span>
			{/each}
		</div>
	{/if}

	<!-- Search -->
	{#if dreams.length > 5}
		<input
			class="search-input"
			type="text"
			placeholder="Träume durchsuchen..."
			bind:value={searchQuery}
		/>
	{/if}

	<!-- Dream list -->
	<div class="dream-list">
		{#each grouped as group (group.label)}
			<div class="month-label">{group.label}</div>
			{#each group.dreams as dream (dream.id)}
				{#if editingId === dream.id}
					<!-- Inline editor -->
					<div
						class="dream-item editing"
						onkeydown={(e) => {
							if (e.key === 'Escape') saveEdit();
						}}
					>
						<input
							class="ed-title"
							type="text"
							bind:value={editTitle}
							placeholder="Titel (optional)..."
							autofocus
						/>
						<textarea
							class="ed-content"
							bind:value={editContent}
							placeholder="Erzähl mir den Traum..."
							rows="5"
						></textarea>
						<input
							class="ed-symbols"
							type="text"
							bind:value={editSymbols}
							placeholder="Symbole (Komma-getrennt): Wasser, Fliegen, Tür"
						/>

						<div class="ed-row">
							<div class="mood-picker">
								{#each MOODS as mood}
									<button
										class="mood-btn"
										class:active={editMood === mood}
										style="--mood-color: {MOOD_COLORS[mood]}"
										onclick={() => (editMood = editMood === mood ? null : mood)}
										title={MOOD_LABELS[mood]}
									>
										<span class="mood-dot"></span>
										{MOOD_LABELS[mood]}
									</button>
								{/each}
							</div>
							<label class="lucid-toggle">
								<input type="checkbox" bind:checked={editIsLucid} />
								&#x2728; Klartraum
							</label>
						</div>

						<div class="ed-actions">
							<button class="ed-btn danger" onclick={() => handleDelete(dream.id)}>Löschen</button>
							<button class="ed-btn primary" onclick={saveEdit}>Fertig</button>
						</div>
					</div>
				{:else}
					<!-- Dream row -->
					<button
						class="dream-item"
						onclick={() => startEdit(dream)}
						oncontextmenu={(e) => handleItemContextMenu(e, dream)}
					>
						{#if dream.mood}
							<span class="mood-dot-row" style="background: {MOOD_COLORS[dream.mood]}"></span>
						{:else}
							<span class="mood-dot-row empty"></span>
						{/if}

						<div class="dream-content">
							<div class="dream-top">
								<span class="dream-title">{dream.title || 'Traum ohne Titel'}</span>
								{#if dream.isLucid}<span class="badge lucid">&#x2728;</span>{/if}
								{#if dream.isPinned}<span class="badge">&#x1f4cc;</span>{/if}
								{#if dream.isPrivate}<span class="badge">&#x1f512;</span>{/if}
							</div>
							{#if dream.content}
								<p class="dream-preview">{dream.content.split('\n')[0]}</p>
							{/if}
							<div class="dream-meta">
								<span>{formatDreamDate(dream.dreamDate)}</span>
								{#if dream.symbols.length > 0}
									<span class="dot">·</span>
									<span class="symbols">{dream.symbols.slice(0, 3).join(' · ')}</span>
								{/if}
							</div>
						</div>
					</button>
				{/if}
			{/each}
		{/each}

		{#if filtered.length === 0 && dreams.length > 0}
			<p class="empty">Keine Treffer</p>
		{/if}
	</div>

	{#if dreams.length === 0}
		<p class="empty">Tippe oben, um deinen ersten Traum festzuhalten.</p>
	{/if}

	<ContextMenu
		visible={ctxMenu.visible}
		x={ctxMenu.x}
		y={ctxMenu.y}
		items={ctxMenuItems}
		onClose={() => (ctxMenu = { ...ctxMenu, visible: false, dream: null })}
	/>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1rem;
		height: 100%;
	}

	/* ── Quick Add ─────────────────────────────── */
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
	}
	:global(.dark) .quick-add {
		border-color: rgba(255, 255, 255, 0.08);
	}
	.add-icon {
		font-size: 0.875rem;
	}
	.add-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: #374151;
	}
	.add-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .add-input {
		color: #f3f4f6;
	}
	:global(.dark) .add-input::placeholder {
		color: #4b5563;
	}

	/* ── Insights ──────────────────────────────── */
	.insights {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.375rem 0.25rem;
		font-size: 0.6875rem;
		color: #9ca3af;
	}
	.ins-stat {
		font-weight: 500;
	}
	.ins-symbol {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: rgba(99, 102, 241, 0.08);
		color: #6366f1;
	}

	/* ── Search ────────────────────────────────── */
	.search-input {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.75rem;
		color: #374151;
		outline: none;
	}
	.search-input:focus {
		border-color: #6366f1;
	}
	:global(.dark) .search-input {
		border-color: rgba(255, 255, 255, 0.08);
		color: #f3f4f6;
	}

	/* ── Dream List ────────────────────────────── */
	.dream-list {
		flex: 1;
		overflow-y: auto;
	}

	.month-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #c0bfba;
		padding: 0.75rem 0.25rem 0.25rem;
		font-weight: 600;
	}
	:global(.dark) .month-label {
		color: #4b5563;
	}

	.dream-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.25rem;
		border: none;
		background: transparent;
		text-align: left;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.dream-item:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	:global(.dark) .dream-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.mood-dot-row {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
		margin-top: 0.4375rem;
	}
	.mood-dot-row.empty {
		background: rgba(0, 0, 0, 0.08);
	}
	:global(.dark) .mood-dot-row.empty {
		background: rgba(255, 255, 255, 0.08);
	}

	.dream-content {
		min-width: 0;
		flex: 1;
	}

	.dream-top {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.dream-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dark) .dream-title {
		color: #e5e7eb;
	}

	.badge {
		font-size: 0.625rem;
	}

	.dream-preview {
		font-size: 0.6875rem;
		color: #9ca3af;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dream-meta {
		display: flex;
		gap: 0.25rem;
		font-size: 0.625rem;
		color: #c0bfba;
		margin-top: 0.125rem;
	}
	.dream-meta .symbols {
		color: #6366f1;
	}
	.dream-meta .dot {
		opacity: 0.5;
	}
	:global(.dark) .dream-meta {
		color: #4b5563;
	}

	/* ── Inline Editor ─────────────────────────── */
	.dream-item.editing {
		cursor: default;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.625rem;
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 0.375rem;
		background: rgba(99, 102, 241, 0.03);
	}
	.dream-item.editing:hover {
		background: rgba(99, 102, 241, 0.03);
	}
	:global(.dark) .dream-item.editing {
		border-color: rgba(99, 102, 241, 0.4);
		background: rgba(99, 102, 241, 0.06);
	}

	.ed-title {
		width: 100%;
		background: transparent;
		border: none;
		color: #374151;
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0;
		outline: none;
	}
	:global(.dark) .ed-title {
		color: #f3f4f6;
	}

	.ed-content {
		width: 100%;
		background: transparent;
		border: none;
		color: #374151;
		font-size: 0.75rem;
		padding: 0;
		outline: none;
		resize: vertical;
		min-height: 4rem;
		font-family: inherit;
		line-height: 1.5;
	}
	:global(.dark) .ed-content {
		color: #e5e7eb;
	}

	.ed-symbols {
		width: 100%;
		background: transparent;
		border: none;
		border-top: 1px dashed rgba(0, 0, 0, 0.08);
		padding: 0.25rem 0 0;
		font-size: 0.6875rem;
		color: #6366f1;
		outline: none;
	}
	.ed-symbols::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .ed-symbols {
		border-top-color: rgba(255, 255, 255, 0.08);
	}

	.ed-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.mood-picker {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.mood-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.625rem;
		color: #9ca3af;
		cursor: pointer;
	}
	.mood-btn .mood-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: var(--mood-color);
	}
	.mood-btn.active {
		border-color: var(--mood-color);
		color: var(--mood-color);
		background: color-mix(in srgb, var(--mood-color) 10%, transparent);
	}

	.lucid-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		cursor: pointer;
	}

	.ed-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
	}

	.ed-btn {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		background: transparent;
		color: #9ca3af;
		transition: all 0.15s;
	}
	.ed-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	:global(.dark) .ed-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}
	.ed-btn.primary {
		background: #6366f1;
		color: white;
	}
	.ed-btn.primary:hover {
		background: #5558e6;
	}
	.ed-btn.danger:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	@media (max-width: 640px) {
		.app-view {
			padding: 0.75rem;
		}
		.dream-item {
			min-height: 44px;
		}
	}
</style>
