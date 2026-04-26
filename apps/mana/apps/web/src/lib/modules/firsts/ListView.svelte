<!--
  Firsts — Workbench ListView
  Track first-time experiences: dreams (bucket list) and lived moments.
-->
<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { get } from 'svelte/store';
	import { useAllFirsts, useDreams, useLivedFirsts, searchFirsts, groupByPerson } from './queries';
	import { firstsStore } from './stores/firsts.svelte';
	import {
		CATEGORY_COLORS,
		type First,
		type FirstCategory,
		type FirstPriority,
		type WouldRepeat,
	} from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { PushPin, Trash, Archive } from '@mana/shared-icons';

	let { navigate, goBack, params }: ViewProps = $props();

	const CATEGORIES: FirstCategory[] = [
		'culinary',
		'adventure',
		'travel',
		'people',
		'career',
		'creative',
		'nature',
		'culture',
		'health',
		'tech',
		'other',
	];

	type ViewTab = 'timeline' | 'dreams' | 'people';
	let activeTab = $state<ViewTab>('timeline');

	let allFirsts$ = useAllFirsts();
	let allFirsts = $derived(allFirsts$.value);

	let dreams$ = useDreams();
	let dreams = $derived(dreams$.value);

	let lived$ = useLivedFirsts();
	let lived = $derived(lived$.value);

	let searchQuery = $state('');
	let categoryFilter = $state<FirstCategory | null>(null);

	let filtered = $derived(() => {
		let list = activeTab === 'dreams' ? dreams : activeTab === 'people' ? allFirsts : allFirsts;
		if (categoryFilter) list = list.filter((f) => f.category === categoryFilter);
		return searchFirsts(list, searchQuery);
	});

	// ── Quick create ──────────────────────────────────
	let newTitle = $state('');
	let newCategory = $state<FirstCategory>('other');
	let newAsDream = $state(true);

	async function handleQuickCreate(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !newTitle.trim()) return;
		e.preventDefault();
		if (newAsDream) {
			const first = await firstsStore.createDream({
				title: newTitle.trim(),
				category: newCategory,
			});
			newTitle = '';
		} else {
			const first = await firstsStore.createLived({
				title: newTitle.trim(),
				category: newCategory,
			});
			newTitle = '';
			startEdit(first);
		}
	}

	// ── Inline editor ─────────────────────────────────
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editCategory = $state<FirstCategory>('other');
	let editMotivation = $state('');
	let editPriority = $state<FirstPriority | null>(null);
	let editDate = $state('');
	let editNote = $state('');
	let editExpectation = $state('');
	let editReality = $state('');
	let editRating = $state<number | null>(null);
	let editWouldRepeat = $state<WouldRepeat | null>(null);
	let editSharedWith = $state('');

	// ── Dream → Lived conversion ──────────────────────
	let convertingId = $state<string | null>(null);
	let convertDate = $state(new Date().toISOString().slice(0, 10));
	let convertNote = $state('');
	let convertExpectation = $state('');
	let convertReality = $state('');
	let convertRating = $state<number | null>(null);
	let convertWouldRepeat = $state<WouldRepeat | null>(null);
	let convertSharedWith = $state('');

	function startEdit(first: First) {
		if (editingId && editingId !== first.id) saveEdit();
		convertingId = null;
		editingId = first.id;
		editTitle = first.title;
		editCategory = first.category;
		editMotivation = first.motivation ?? '';
		editPriority = first.priority;
		editDate = first.date ?? '';
		editNote = first.note ?? '';
		editExpectation = first.expectation ?? '';
		editReality = first.reality ?? '';
		editRating = first.rating;
		editWouldRepeat = first.wouldRepeat;
		editSharedWith = first.sharedWith ?? '';
	}

	async function saveEdit() {
		if (!editingId) return;
		await firstsStore.updateFirst(editingId, {
			title: editTitle.trim(),
			category: editCategory,
			motivation: editMotivation.trim() || null,
			priority: editPriority,
			date: editDate || null,
			note: editNote.trim() || null,
			expectation: editExpectation.trim() || null,
			reality: editReality.trim() || null,
			rating: editRating,
			wouldRepeat: editWouldRepeat,
			sharedWith: editSharedWith.trim() || null,
		});
		editingId = null;
	}

	function startConvert(first: First) {
		editingId = null;
		convertingId = first.id;
		convertDate = new Date().toISOString().slice(0, 10);
		convertNote = '';
		convertExpectation = '';
		convertReality = '';
		convertRating = null;
		convertWouldRepeat = null;
		convertSharedWith = '';
	}

	async function saveConvert() {
		if (!convertingId) return;
		await firstsStore.markAsLived(convertingId, {
			date: convertDate,
			note: convertNote.trim() || null,
			expectation: convertExpectation.trim() || null,
			reality: convertReality.trim() || null,
			rating: convertRating,
			wouldRepeat: convertWouldRepeat,
			sharedWith: convertSharedWith.trim() || null,
		});
		convertingId = null;
	}

	async function handleDelete(id: string) {
		await firstsStore.deleteFirst(id);
		if (editingId === id) editingId = null;
		if (convertingId === id) convertingId = null;
	}

	// ── People view helpers ───────────────────────────
	let personGroups = $derived(groupByPerson(allFirsts));

	// ── Context menu ──────────────────────────────────
	const ctxMenu = useItemContextMenu<First>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'pin',
						label: ctxMenu.state.target.isPinned
							? $_('firsts.list_view.ctx_unpin')
							: $_('firsts.list_view.ctx_pin'),
						icon: PushPin,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) firstsStore.togglePin(target.id);
						},
					},
					{
						id: 'archive',
						label: $_('firsts.list_view.ctx_archive'),
						icon: Archive,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) firstsStore.archiveFirst(target.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: $_('firsts.list_view.ctx_delete'),
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) handleDelete(target.id);
						},
					},
				]
			: []
	);

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(get(locale) ?? 'de', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
	}

	const RATING_STARS = [1, 2, 3, 4, 5];
</script>

<div class="app-view">
	<!-- Tab bar -->
	<div class="tab-bar">
		<button
			class="tab"
			class:active={activeTab === 'timeline'}
			onclick={() => (activeTab = 'timeline')}
		>
			{$_('firsts.list_view.tab_timeline')}
		</button>
		<button
			class="tab"
			class:active={activeTab === 'dreams'}
			onclick={() => (activeTab = 'dreams')}
		>
			{$_('firsts.list_view.tab_dreams')}
			{#if dreams.length > 0}
				<span class="tab-count">{dreams.length}</span>
			{/if}
		</button>
		<button
			class="tab"
			class:active={activeTab === 'people'}
			onclick={() => (activeTab = 'people')}
		>
			{$_('firsts.list_view.tab_people')}
		</button>
	</div>

	<!-- Quick create -->
	<form onsubmit={(e) => e.preventDefault()} class="quick-add">
		<div class="quick-top">
			<select class="cat-select" bind:value={newCategory}>
				{#each CATEGORIES as cat}
					<option value={cat}>{$_('firsts.categories.' + cat)}</option>
				{/each}
			</select>
			<input
				class="add-input"
				type="text"
				placeholder={newAsDream
					? $_('firsts.list_view.placeholder_dream')
					: $_('firsts.list_view.placeholder_lived')}
				bind:value={newTitle}
				onkeydown={handleQuickCreate}
			/>
		</div>
		<div class="quick-toggle">
			<button class="toggle-btn" class:active={newAsDream} onclick={() => (newAsDream = true)}>
				{$_('firsts.list_view.toggle_dream')}
			</button>
			<button class="toggle-btn" class:active={!newAsDream} onclick={() => (newAsDream = false)}>
				{$_('firsts.list_view.toggle_lived')}
			</button>
		</div>
	</form>

	<!-- Category filter -->
	{#if allFirsts.length > 0}
		<div class="filter-tabs">
			<button
				class="filter-tab"
				class:active={categoryFilter === null}
				onclick={() => (categoryFilter = null)}
			>
				{$_('firsts.list_view.filter_all')}
			</button>
			{#each CATEGORIES as cat}
				<button
					class="filter-tab"
					class:active={categoryFilter === cat}
					style="--cat-color: {CATEGORY_COLORS[cat]}"
					onclick={() => (categoryFilter = categoryFilter === cat ? null : cat)}
				>
					{$_('firsts.categories.' + cat)}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Search -->
	{#if allFirsts.length > 5}
		<input
			class="search-input"
			type="text"
			placeholder={$_('firsts.list_view.placeholder_search')}
			bind:value={searchQuery}
		/>
	{/if}

	<!-- Stats ribbon -->
	{#if allFirsts.length > 0}
		<div class="insights">
			<span class="ins-stat"
				>{$_('firsts.list_view.stat_lived', { values: { count: lived.length } })}</span
			>
			<span class="ins-stat"
				>{$_('firsts.list_view.stat_dreams', { values: { count: dreams.length } })}</span
			>
		</div>
	{/if}

	<!-- ══════ TIMELINE VIEW ══════ -->
	{#if activeTab === 'timeline'}
		<div class="entry-list">
			{#each filtered() as first (first.id)}
				{#if convertingId === first.id}
					<!-- Dream → Lived conversion sheet -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div
						class="entry-card converting"
						onkeydown={(e) => {
							if (e.key === 'Escape') convertingId = null;
						}}
						role="form"
					>
						<div class="convert-header">
							<span class="cat-dot" style="background: {CATEGORY_COLORS[first.category]}"></span>
							<span class="convert-title">{first.title}</span>
						</div>

						<label class="ed-field">
							<span class="ed-label">{$_('firsts.list_view.convert_when')}</span>
							<input type="date" bind:value={convertDate} class="ed-input-sm" />
						</label>

						<label class="ed-field">
							<span class="ed-label">{$_('firsts.list_view.convert_expected_label')}</span>
							<textarea
								class="ed-textarea"
								bind:value={convertExpectation}
								rows="2"
								placeholder={$_('firsts.list_view.placeholder_expected')}
							></textarea>
						</label>

						<label class="ed-field">
							<span class="ed-label">{$_('firsts.list_view.convert_reality_label')}</span>
							<textarea
								class="ed-textarea"
								bind:value={convertReality}
								rows="2"
								placeholder={$_('firsts.list_view.placeholder_reality')}
							></textarea>
						</label>

						<label class="ed-field">
							<span class="ed-label">{$_('firsts.list_view.convert_notes')}</span>
							<textarea
								class="ed-textarea"
								bind:value={convertNote}
								rows="2"
								placeholder={$_('firsts.list_view.placeholder_notes')}
							></textarea>
						</label>

						<label class="ed-field">
							<span class="ed-label">{$_('firsts.list_view.convert_with_whom')}</span>
							<input
								type="text"
								class="ed-input-sm"
								bind:value={convertSharedWith}
								placeholder={$_('firsts.list_view.placeholder_shared_with')}
							/>
						</label>

						<div class="ed-row">
							<div class="rating-picker">
								{#each RATING_STARS as star}
									<button
										class="star-btn"
										class:filled={convertRating !== null && star <= convertRating}
										onclick={() => (convertRating = convertRating === star ? null : star)}
									>
										{convertRating !== null && star <= convertRating ? '\u2605' : '\u2606'}
									</button>
								{/each}
							</div>
							<div class="repeat-picker">
								{#each ['no', 'yes', 'definitely'] as const as opt}
									<button
										class="repeat-btn"
										class:active={convertWouldRepeat === opt}
										onclick={() => (convertWouldRepeat = convertWouldRepeat === opt ? null : opt)}
									>
										{opt === 'no'
											? $_('firsts.list_view.repeat_no')
											: opt === 'yes'
												? $_('firsts.list_view.repeat_yes')
												: $_('firsts.list_view.repeat_definitely')}
									</button>
								{/each}
							</div>
						</div>

						<div class="ed-actions">
							<button class="ed-btn" onclick={() => (convertingId = null)}
								>{$_('firsts.list_view.action_cancel')}</button
							>
							<button class="ed-btn primary" onclick={saveConvert}
								>{$_('firsts.list_view.action_lived')}</button
							>
						</div>
					</div>
				{:else if editingId === first.id}
					<!-- Inline editor -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div
						class="entry-card editing"
						onkeydown={(e) => {
							if (e.key === 'Escape') saveEdit();
						}}
						role="form"
					>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="ed-title"
							type="text"
							bind:value={editTitle}
							placeholder={$_('firsts.list_view.placeholder_title')}
							autofocus
						/>

						<div class="ed-row">
							<select class="cat-select" bind:value={editCategory}>
								{#each CATEGORIES as cat}
									<option value={cat}>{$_('firsts.categories.' + cat)}</option>
								{/each}
							</select>
						</div>

						{#if first.status === 'dream'}
							<textarea
								class="ed-textarea"
								bind:value={editMotivation}
								rows="2"
								placeholder={$_('firsts.list_view.placeholder_motivation')}
							></textarea>
							<div class="ed-row">
								<span class="ed-label">{$_('firsts.list_view.label_priority')}</span>
								<div class="priority-picker">
									{#each [1, 2, 3] as const as p}
										<button
											class="prio-btn"
											class:active={editPriority === p}
											onclick={() => (editPriority = editPriority === p ? null : p)}
										>
											{$_('firsts.priorities.' + p)}
										</button>
									{/each}
								</div>
							</div>
						{:else}
							<label class="ed-field">
								<span class="ed-label">{$_('firsts.list_view.label_date')}</span>
								<input type="date" bind:value={editDate} class="ed-input-sm" />
							</label>
							<textarea
								class="ed-textarea"
								bind:value={editExpectation}
								rows="2"
								placeholder={$_('firsts.list_view.convert_expected_label')}
							></textarea>
							<textarea
								class="ed-textarea"
								bind:value={editReality}
								rows="2"
								placeholder={$_('firsts.list_view.convert_reality_label')}
							></textarea>
							<textarea
								class="ed-textarea"
								bind:value={editNote}
								rows="2"
								placeholder={$_('firsts.list_view.convert_notes')}
							></textarea>
							<input
								type="text"
								class="ed-input-sm"
								bind:value={editSharedWith}
								placeholder={$_('firsts.list_view.placeholder_shared_with_short')}
							/>

							<div class="ed-row">
								<div class="rating-picker">
									{#each RATING_STARS as star}
										<button
											class="star-btn"
											class:filled={editRating !== null && star <= editRating}
											onclick={() => (editRating = editRating === star ? null : star)}
										>
											{editRating !== null && star <= editRating ? '\u2605' : '\u2606'}
										</button>
									{/each}
								</div>
								<div class="repeat-picker">
									{#each ['no', 'yes', 'definitely'] as const as opt}
										<button
											class="repeat-btn"
											class:active={editWouldRepeat === opt}
											onclick={() => (editWouldRepeat = editWouldRepeat === opt ? null : opt)}
										>
											{opt === 'no'
												? $_('firsts.list_view.repeat_no')
												: opt === 'yes'
													? $_('firsts.list_view.repeat_yes')
													: $_('firsts.list_view.repeat_definitely')}
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<div class="ed-actions">
							<button class="ed-btn danger" onclick={() => handleDelete(first.id)}
								>{$_('firsts.list_view.action_delete')}</button
							>
							<button class="ed-btn primary" onclick={saveEdit}
								>{$_('firsts.list_view.action_done')}</button
							>
						</div>
					</div>
				{:else}
					<!-- Entry card -->
					<div
						class="entry-card"
						class:dream={first.status === 'dream'}
						role="button"
						tabindex="0"
						onclick={() => startEdit(first)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								startEdit(first);
							}
						}}
						oncontextmenu={(e) => ctxMenu.open(e, first)}
					>
						<div class="card-header">
							<span class="cat-dot" style="background: {CATEGORY_COLORS[first.category]}"></span>
							<span class="card-title">{first.title}</span>
							{#if first.isPinned}<span class="badge">{'\u{1f4cc}'}</span>{/if}
							{#if first.status === 'lived' && first.rating}
								<span class="card-rating">
									{#each RATING_STARS as star}
										<span class:filled={star <= (first.rating ?? 0)}
											>{star <= (first.rating ?? 0) ? '\u2605' : '\u2606'}</span
										>
									{/each}
								</span>
							{/if}
						</div>

						{#if first.status === 'lived'}
							<div class="card-meta">
								{#if first.date}<span>{formatDate(first.date)}</span>{/if}
								{#if first.sharedWith}
									<span class="dot">{'\u00b7'}</span>
									<span>{first.sharedWith}</span>
								{/if}
								{#if first.wouldRepeat}
									<span class="dot">{'\u00b7'}</span>
									<span class="repeat-badge">
										{first.wouldRepeat === 'definitely'
											? $_('firsts.list_view.repeat_definitely_again')
											: first.wouldRepeat === 'yes'
												? $_('firsts.list_view.repeat_again')
												: $_('firsts.list_view.repeat_once')}
									</span>
								{/if}
							</div>
							{#if first.expectation || first.reality}
								<div class="exp-vs-real">
									{#if first.expectation}
										<div class="exp-line">
											<span class="exp-label">{$_('firsts.list_view.label_before')}</span>
											{first.expectation}
										</div>
									{/if}
									{#if first.reality}
										<div class="exp-line">
											<span class="exp-label">{$_('firsts.list_view.label_after')}</span>
											{first.reality}
										</div>
									{/if}
								</div>
							{/if}
							{#if first.note}
								<p class="card-note">{first.note}</p>
							{/if}
						{:else}
							<!-- Dream card -->
							<div class="card-meta">
								{#if first.priority}
									<span class="prio-badge prio-{first.priority}"
										>{$_('firsts.priorities.' + first.priority)}</span
									>
								{/if}
								{#if first.sharedWith}
									<span class="dot">{'\u00b7'}</span>
									<span>{first.sharedWith}</span>
								{/if}
							</div>
							{#if first.motivation}
								<p class="card-note">{first.motivation}</p>
							{/if}
							<button
								class="convert-btn"
								onclick={(e) => {
									e.stopPropagation();
									startConvert(first);
								}}
							>
								{$_('firsts.list_view.action_lived')}
							</button>
						{/if}

						<span class="cat-label" style="color: {CATEGORY_COLORS[first.category]}">
							{$_('firsts.categories.' + first.category)}
						</span>
					</div>
				{/if}
			{/each}

			{#if filtered().length === 0 && allFirsts.length > 0}
				<p class="empty">{$_('firsts.list_view.empty_no_results')}</p>
			{/if}
		</div>
	{/if}

	<!-- ══════ DREAMS VIEW ══════ -->
	{#if activeTab === 'dreams'}
		<div class="entry-list">
			{#each [3, 2, 1] as prio}
				{@const group = filtered().filter((f) => (f.priority ?? 1) === prio)}
				{#if group.length > 0}
					<div class="month-label">{$_('firsts.priorities.' + prio)}</div>
					{#each group as first (first.id)}
						<div
							class="entry-card dream"
							role="button"
							tabindex="0"
							onclick={() => startEdit(first)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									startEdit(first);
								}
							}}
							oncontextmenu={(e) => ctxMenu.open(e, first)}
						>
							<div class="card-header">
								<span class="cat-dot" style="background: {CATEGORY_COLORS[first.category]}"></span>
								<span class="card-title">{first.title}</span>
							</div>
							{#if first.motivation}
								<p class="card-note">{first.motivation}</p>
							{/if}
							{#if first.sharedWith}
								<div class="card-meta"><span>{first.sharedWith}</span></div>
							{/if}
							<button
								class="convert-btn"
								onclick={(e) => {
									e.stopPropagation();
									startConvert(first);
								}}
							>
								{$_('firsts.list_view.action_lived')}
							</button>
						</div>
					{/each}
				{/if}
			{/each}

			{#if dreams.length === 0}
				<p class="empty">{$_('firsts.list_view.empty_no_dreams')}</p>
			{/if}
		</div>
	{/if}

	<!-- ══════ PEOPLE VIEW ══════ -->
	{#if activeTab === 'people'}
		<div class="entry-list">
			{#each [...personGroups.entries()] as [personKey, firsts] (personKey)}
				<div class="month-label">
					{personKey === '__alone' ? $_('firsts.list_view.people_alone') : personKey}
					<span class="group-count">({firsts.length})</span>
				</div>
				{#each firsts as first (first.id)}
					<div
						class="entry-row"
						role="button"
						tabindex="0"
						onclick={() => startEdit(first)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								startEdit(first);
							}
						}}
						oncontextmenu={(e) => ctxMenu.open(e, first)}
					>
						<span class="cat-dot" style="background: {CATEGORY_COLORS[first.category]}"></span>
						<span class="row-title">{first.title}</span>
						{#if first.status === 'lived' && first.date}
							<span class="row-date">{formatDate(first.date)}</span>
						{:else}
							<span class="row-dream-tag">{$_('firsts.list_view.row_dream_tag')}</span>
						{/if}
					</div>
				{/each}
			{/each}

			{#if allFirsts.length === 0}
				<p class="empty">{$_('firsts.list_view.empty_no_entries')}</p>
			{/if}
		</div>
	{/if}

	{#if allFirsts.length === 0}
		<p class="empty">{$_('firsts.list_view.empty_no_firsts')}</p>
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

	/* ── Tab Bar ───────────────────────────────── */
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

	/* ── Quick Add ─────────────────────────────── */
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

	/* ── Filter Tabs ───────────────────────────── */
	.filter-tabs {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.filter-tab {
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.filter-tab:hover {
		color: var(--cat-color, hsl(var(--color-primary)));
		border-color: var(--cat-color, hsl(var(--color-primary)));
	}
	.filter-tab.active {
		background: var(--cat-color, hsl(var(--color-primary)));
		color: white;
		border-color: var(--cat-color, hsl(var(--color-primary)));
	}

	/* ── Search ────────────────────────────────── */
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

	/* ── Insights ──────────────────────────────── */
	.insights {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.375rem 0.25rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.ins-stat {
		font-weight: 500;
	}

	/* ── Entry List ────────────────────────────── */
	.entry-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.month-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		padding: 0.75rem 0.25rem 0.25rem;
		font-weight: 600;
	}
	.group-count {
		font-weight: 400;
		opacity: 0.7;
	}

	/* ── Entry Cards ───────────────────────────── */
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
	.entry-card.dream {
		border-style: dashed;
		border-color: hsl(var(--color-primary) / 0.3);
	}
	.entry-card.dream:hover {
		border-color: hsl(var(--color-primary) / 0.5);
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
	.card-rating {
		font-size: 0.6875rem;
		color: #f59e0b;
	}
	.card-rating .filled {
		color: #f59e0b;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.card-meta .dot {
		opacity: 0.5;
	}

	.cat-label {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 600;
	}

	.prio-badge {
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.5625rem;
		font-weight: 600;
	}
	.prio-badge.prio-3 {
		background: hsl(0 84% 60% / 0.12);
		color: hsl(0 84% 60%);
	}
	.prio-badge.prio-2 {
		background: hsl(38 92% 50% / 0.12);
		color: hsl(38 92% 50%);
	}
	.prio-badge.prio-1 {
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
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

	/* ── Expectation vs Reality ────────────────── */
	.exp-vs-real {
		padding: 0.375rem 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-primary) / 0.04);
		border-left: 2px solid hsl(var(--color-primary) / 0.3);
	}
	.exp-line {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
	}
	.exp-label {
		font-weight: 600;
		color: hsl(var(--color-foreground));
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.repeat-badge {
		font-size: 0.625rem;
		font-weight: 500;
	}

	/* ── Convert Button ────────────────────────── */
	.convert-btn {
		align-self: flex-end;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.convert-btn:hover {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	/* ── Entry Row (People view) ───────────────── */
	.entry-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.25rem;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.entry-row:hover {
		background: hsl(var(--color-surface-hover));
	}
	.row-title {
		flex: 1;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.row-date {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.row-dream-tag {
		font-size: 0.5625rem;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		border: 1px dashed hsl(var(--color-primary) / 0.4);
		color: hsl(var(--color-primary));
	}

	/* ── Editors / Conversion ──────────────────── */
	.entry-card.editing,
	.entry-card.converting {
		cursor: default;
		border-color: hsl(var(--color-primary) / 0.3);
		background: hsl(var(--color-primary) / 0.03);
		user-select: text;
		-webkit-user-select: text;
		-webkit-touch-callout: default;
	}
	.entry-card.editing:hover,
	.entry-card.converting:hover {
		background: hsl(var(--color-primary) / 0.03);
	}
	.convert-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.convert-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.ed-title {
		width: 100%;
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0;
		outline: none;
	}
	.ed-field {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.ed-label {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}
	.ed-input-sm {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		font-family: inherit;
	}
	.ed-input-sm:focus {
		border-color: hsl(var(--color-primary));
	}
	.ed-textarea {
		width: 100%;
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		padding: 0.25rem 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
	}
	.ed-textarea:focus {
		border-color: hsl(var(--color-primary));
	}
	.ed-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.rating-picker {
		display: flex;
		gap: 0.125rem;
	}
	.star-btn {
		background: transparent;
		border: none;
		font-size: 1.125rem;
		cursor: pointer;
		color: hsl(var(--color-border));
		padding: 0;
		line-height: 1;
	}
	.star-btn.filled {
		color: #f59e0b;
	}
	.repeat-picker {
		display: flex;
		gap: 0.25rem;
	}
	.repeat-btn {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.repeat-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.priority-picker {
		display: flex;
		gap: 0.25rem;
	}
	.prio-btn {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.prio-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
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
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s;
	}
	.ed-btn:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.ed-btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.ed-btn.primary:hover {
		filter: brightness(0.9);
	}
	.ed-btn.danger:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.08);
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	@media (max-width: 640px) {
		.app-view {
			padding: 0.75rem;
		}
		.entry-card {
			min-height: 44px;
		}
	}
</style>
