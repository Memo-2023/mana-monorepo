<!--
  Lasts — Workbench ListView (M2)

  Renders status-tabbed list of the active Space's lasts. Quick-Add bar
  at the top creates suspected or confirmed entries directly. Cards link
  to the DetailView route for editing + lifecycle transitions.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { PushPin, Trash, Archive } from '@mana/shared-icons';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { onMount } from 'svelte';
	import { useAllLasts, useInboxLasts, searchLasts } from './queries';
	import { lastsStore } from './stores/items.svelte';
	import { lastsSettings } from './stores/settings.svelte';
	import DueBanner from './components/DueBanner.svelte';
	import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_LABELS } from './types';
	import type { Last, LastCategory, LastStatus } from './types';
	import { MILESTONE_CATEGORIES } from '$lib/data/milestones/categories';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	type ViewTab = 'all' | LastStatus;

	let activeTab = $state<ViewTab>('all');
	let searchQuery = $state('');

	let lasts$ = useAllLasts();
	let lasts = $derived(lasts$.value);

	let inbox$ = useInboxLasts();
	let inboxCount = $derived(inbox$.value.length);

	onMount(() => {
		lastsSettings.initialize();
	});

	// Counts per tab
	let counts = $derived({
		all: lasts.length,
		suspected: lasts.filter((l) => l.status === 'suspected').length,
		confirmed: lasts.filter((l) => l.status === 'confirmed').length,
		reclaimed: lasts.filter((l) => l.status === 'reclaimed').length,
	});

	let filtered = $derived.by(() => {
		let list = activeTab === 'all' ? lasts : lasts.filter((l) => l.status === activeTab);
		return searchLasts(list, searchQuery);
	});

	// ── Quick create ───────────────────────────────
	let newTitle = $state('');
	let newCategory = $state<LastCategory>('other');
	let newAsConfirmed = $state(false);

	async function handleQuickCreate(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !newTitle.trim()) return;
		e.preventDefault();
		const title = newTitle.trim();
		const created = newAsConfirmed
			? await lastsStore.createConfirmed({ title, category: newCategory })
			: await lastsStore.createSuspected({ title, category: newCategory });
		newTitle = '';
		// Open the just-created entry so the user can immediately reflect.
		goto(`/lasts/entry/${created.id}`);
	}

	function openEntry(id: string) {
		goto(`/lasts/entry/${id}`);
	}

	// ── Context menu ───────────────────────────────
	const ctxMenu = useItemContextMenu<Last>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'pin',
						label: ctxMenu.state.target.isPinned
							? $_('lasts.actions.unpin')
							: $_('lasts.actions.pin'),
						icon: PushPin,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) lastsStore.togglePin(target.id);
						},
					},
					{
						id: 'archive',
						label: $_('lasts.actions.archive'),
						icon: Archive,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) lastsStore.archiveLast(target.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: $_('lasts.actions.delete'),
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) lastsStore.deleteLast(target.id);
						},
					},
				]
			: []
	);

	function formatDate(iso: string | null): string {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
	}
</script>

<div class="app-view">
	<!-- In-app reminders banner (anniversary / recognition / inbox-notify) -->
	<DueBanner {lasts} {inboxCount} />

	<!-- Tab bar -->
	<div class="tab-bar">
		{#each ['all', 'suspected', 'confirmed', 'reclaimed'] as const as tab}
			<button class="tab" class:active={activeTab === tab} onclick={() => (activeTab = tab)}>
				{$_(`lasts.tabs.${tab}`)}
				{#if counts[tab] > 0}
					<span class="tab-count">{counts[tab]}</span>
				{/if}
			</button>
		{/each}
		<a class="inbox-link" href="/lasts/inbox">
			{$_('lasts.tabs.inbox')}
			{#if inboxCount > 0}
				<span class="inbox-count">{inboxCount}</span>
			{/if}
		</a>
		<a class="inbox-link" href="/milestones" title={$_('milestones.timeline.title')}>
			{$_('milestones.timeline.title')}
		</a>
		<a class="inbox-link settings-link" href="/lasts/settings" title={$_('lasts.settings.title')}
			>⚙</a
		>
	</div>

	<!-- Quick create -->
	<form onsubmit={(e) => e.preventDefault()} class="quick-add">
		<div class="quick-top">
			<select class="cat-select" bind:value={newCategory}>
				{#each MILESTONE_CATEGORIES as cat}
					<option value={cat}>{CATEGORY_LABELS[cat].de}</option>
				{/each}
			</select>
			<input
				class="add-input"
				type="text"
				placeholder={$_('lasts.quickAdd.placeholder')}
				bind:value={newTitle}
				onkeydown={handleQuickCreate}
			/>
		</div>
		<div class="quick-toggle">
			<button
				class="toggle-btn"
				class:active={!newAsConfirmed}
				onclick={() => (newAsConfirmed = false)}
			>
				{$_('lasts.quickAdd.modeSuspected')}
			</button>
			<button
				class="toggle-btn"
				class:active={newAsConfirmed}
				onclick={() => (newAsConfirmed = true)}
			>
				{$_('lasts.quickAdd.modeConfirmed')}
			</button>
		</div>
	</form>

	<!-- Search -->
	{#if lasts.length > 5}
		<input
			class="search-input"
			type="text"
			placeholder={$_('lasts.list.searchPlaceholder')}
			bind:value={searchQuery}
		/>
	{/if}

	<!-- Entry list -->
	{#if lasts.length === 0}
		<p class="empty">{$_('lasts.list.emptyAll')}</p>
	{:else if filtered.length === 0}
		<p class="empty">{$_('lasts.list.emptyTab')}</p>
	{:else}
		<ul class="entry-list">
			{#each filtered as last (last.id)}
				<li>
					<div
						class="entry-card"
						class:reclaimed={last.status === 'reclaimed'}
						role="button"
						tabindex="0"
						onclick={() => openEntry(last.id)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								openEntry(last.id);
							}
						}}
						oncontextmenu={(e) => ctxMenu.open(e, last)}
					>
						<div class="card-header">
							<span class="cat-dot" style="background: {CATEGORY_COLORS[last.category]}"></span>
							<span class="card-title">{last.title}</span>
							{#if last.isPinned}<span class="badge">{'\u{1f4cc}'}</span>{/if}
							<span class="status-pill" data-status={last.status}>
								{STATUS_LABELS[last.status].de}
							</span>
						</div>
						<div class="card-meta">
							{#if last.date}<span>{formatDate(last.date)}</span>{/if}
							<span class="cat-label" style="color: {CATEGORY_COLORS[last.category]}">
								{CATEGORY_LABELS[last.category].de}
							</span>
						</div>
						{#if last.meaning}
							<p class="card-note">{last.meaning}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
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

	/* ── Tab Bar ─────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		padding-bottom: 0.25rem;
	}
	.tab {
		padding: 0.375rem 0.75rem;
		border: none;
		background: transparent;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.15s;
	}
	.tab:hover {
		color: hsl(var(--color-foreground));
	}
	.tab.active {
		color: hsl(var(--color-primary));
		border-bottom-color: hsl(var(--color-primary));
	}
	.tab-count {
		font-size: 0.625rem;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		margin-left: 0.25rem;
	}

	.inbox-link {
		margin-left: auto;
		padding: 0.375rem 0.625rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
		transition: all 0.15s;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.inbox-link:hover {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-surface-hover));
	}
	.inbox-link.settings-link {
		margin-left: 0;
		font-size: 0.875rem;
	}
	.inbox-count {
		font-size: 0.5625rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-weight: 700;
	}

	/* ── Quick Add ───────────────────────────── */
	.quick-add {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
	}
	.quick-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.cat-select {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground));
		padding: 0.125rem 0.25rem;
		outline: none;
	}
	.add-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.add-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.quick-toggle {
		display: flex;
		gap: 0.25rem;
	}
	.toggle-btn {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.toggle-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}

	/* ── Search ──────────────────────────────── */
	.search-input {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.search-input:focus {
		border-color: hsl(var(--color-primary));
	}

	/* ── Entry List ──────────────────────────── */
	.entry-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.entry-card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		cursor: pointer;
		transition: all 0.15s;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}
	.entry-card:hover {
		background: hsl(var(--color-surface-hover));
	}
	.entry-card.reclaimed {
		opacity: 0.55;
		border-style: dashed;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.cat-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.card-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.badge {
		font-size: 0.625rem;
	}
	.status-pill {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 600;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
	}
	.status-pill[data-status='confirmed'] {
		border-color: hsl(var(--color-primary) / 0.4);
		color: hsl(var(--color-primary));
	}
	.status-pill[data-status='reclaimed'] {
		border-style: dashed;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.cat-label {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 600;
		margin-left: auto;
	}

	.card-note {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
