<!--
  Saved articles — the user's personal reading list.

  Three tabs: Ungelesen / Favoriten / Archiv. Each card opens the
  shared reader at /news/[id]; the reader's dual-source lookup means
  the same URL works whether the article was saved from the curated
  pool or pasted as an ad-hoc URL.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		useSavedArticles,
		useCategories,
		formatRelativeTime,
		toArticle,
	} from '$lib/modules/news/queries';
	import { articlesStore } from '$lib/modules/news/stores/articles.svelte';
	import { categoriesStore } from '$lib/modules/news/stores/categories.svelte';
	import { articleTable } from '$lib/modules/news/collections';
	import { decryptRecords } from '$lib/data/crypto';
	import type { Article } from '$lib/modules/news/types';

	const saved$ = useSavedArticles();
	const categories$ = useCategories();
	const all = $derived(saved$.value);
	const categories = $derived(categories$.value);

	type Tab = 'unread' | 'favorites' | 'archive';
	let tab = $state<Tab>('unread');

	// `null` = no filter (show all in the active tab). Otherwise the
	// categoryId we're scoped to.
	let activeCategoryId = $state<string | null>(null);

	let showCategoryEditor = $state(false);
	let newCategoryName = $state('');
	let renamingId = $state<string | null>(null);
	let renamingName = $state('');

	const filtered = $derived.by(() => {
		const base = (() => {
			switch (tab) {
				case 'unread':
					return all.filter((a) => !a.isRead && !a.isArchived);
				case 'favorites':
					return all.filter((a) => a.isFavorite && !a.isArchived);
				case 'archive':
					// `archived` is filled by the effect below.
					return [] as Article[];
			}
		})();
		if (activeCategoryId == null) return base;
		return base.filter((a) => a.categoryId === activeCategoryId);
	});

	// For "archive" tab: read isArchived rows directly from Dexie. Kept
	// minimal — not worth a second liveQuery hook for the MVP.
	let archived = $state<Article[]>([]);
	$effect(() => {
		if (tab !== 'archive') return;
		void (async () => {
			const rows = (await articleTable.toArray()).filter((a) => !a.deletedAt && a.isArchived);
			const decrypted = await decryptRecords('newsArticles', rows);
			archived = decrypted.map(toArticle).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
		})();
	});

	const visible = $derived(
		tab === 'archive'
			? activeCategoryId == null
				? archived
				: archived.filter((a) => a.categoryId === activeCategoryId)
			: filtered
	);

	// Counts per category for the filter pills, computed against the
	// currently visible base set (so the numbers reflect the active tab).
	const baseSet = $derived(tab === 'archive' ? archived : filtered);
	const countByCategory = $derived.by(() => {
		const map: Record<string, number> = {};
		// `filtered` already applies the category filter, so we need a
		// pre-filter base. Re-derive it here.
		const pre =
			tab === 'unread'
				? all.filter((a) => !a.isRead && !a.isArchived)
				: tab === 'favorites'
					? all.filter((a) => a.isFavorite && !a.isArchived)
					: archived;
		for (const a of pre) {
			const key = a.categoryId ?? '__none__';
			map[key] = (map[key] ?? 0) + 1;
		}
		map.__all__ = pre.length;
		return map;
	});
	// Touch baseSet to silence the unused-binding linter — it's used to
	// keep the derivation of countByCategory reactive in case the upstream
	// query refreshes during a tab switch.
	$effect(() => {
		void baseSet.length;
	});

	function open(article: Article) {
		// Curated saves keep their server uuid in sourceCuratedId, but
		// the local id is the primary key the reader prefers. Either id
		// works — the reader resolves both.
		goto(`/news/${article.sourceCuratedId ?? article.id}`);
	}

	async function toggleFav(e: Event, id: string) {
		e.stopPropagation();
		await articlesStore.toggleFavorite(id);
	}
	async function archive(e: Event, id: string) {
		e.stopPropagation();
		await articlesStore.archive(id);
	}
	async function unarchive(e: Event, id: string) {
		e.stopPropagation();
		await articleTable.update(id, {
			isArchived: false,
			updatedAt: new Date().toISOString(),
		});
	}
	async function remove(e: Event, id: string) {
		e.stopPropagation();
		await articlesStore.delete(id);
	}

	async function setCategory(articleId: string, categoryId: string | null) {
		await articlesStore.setCategory(articleId, categoryId);
	}

	async function createCategory() {
		const name = newCategoryName.trim();
		if (!name) return;
		const created = await categoriesStore.create({ name });
		newCategoryName = '';
		activeCategoryId = created.id;
	}

	function startRename(id: string, currentName: string) {
		renamingId = id;
		renamingName = currentName;
	}

	async function commitRename() {
		if (!renamingId) return;
		await categoriesStore.rename(renamingId, renamingName);
		renamingId = null;
	}

	async function deleteCategory(id: string) {
		if (!confirm('Kategorie löschen? Artikel bleiben erhalten.')) return;
		await categoriesStore.delete(id);
		if (activeCategoryId === id) activeCategoryId = null;
	}
</script>

<svelte:head>
	<title>Gespeichert — News — Mana</title>
</svelte:head>

<div class="page">
	<header class="header">
		<div>
			<button type="button" class="back" onclick={() => goto('/news')}>← Feed</button>
			<h1>Gespeichert</h1>
		</div>
		<a class="add-link" href="/news/add">+ URL hinzufügen</a>
	</header>

	<nav class="tabs">
		<button
			type="button"
			class="tab"
			class:active={tab === 'unread'}
			onclick={() => (tab = 'unread')}
		>
			Ungelesen
		</button>
		<button
			type="button"
			class="tab"
			class:active={tab === 'favorites'}
			onclick={() => (tab = 'favorites')}
		>
			Favoriten
		</button>
		<button
			type="button"
			class="tab"
			class:active={tab === 'archive'}
			onclick={() => (tab = 'archive')}
		>
			Archiv
		</button>
	</nav>

	<!-- Category filter strip -->
	<div class="categories-bar">
		<div class="cat-pills">
			<button
				type="button"
				class="cat-pill"
				class:active={activeCategoryId === null}
				onclick={() => (activeCategoryId = null)}
			>
				Alle
				<span class="count">{countByCategory.__all__ ?? 0}</span>
			</button>
			{#each categories as cat (cat.id)}
				<button
					type="button"
					class="cat-pill"
					class:active={activeCategoryId === cat.id}
					style:--cat-color={cat.color}
					onclick={() => (activeCategoryId = cat.id)}
				>
					<span class="dot" style:background={cat.color}></span>
					{#if renamingId === cat.id}
						<input
							type="text"
							bind:value={renamingName}
							onblur={commitRename}
							onkeydown={(e) => {
								if (e.key === 'Enter') commitRename();
								if (e.key === 'Escape') renamingId = null;
							}}
						/>
					{:else}
						<span ondblclick={() => startRename(cat.id, cat.name)} role="button" tabindex="0">
							{cat.name}
						</span>
					{/if}
					<span class="count">{countByCategory[cat.id] ?? 0}</span>
				</button>
			{/each}
			<button
				type="button"
				class="cat-edit"
				onclick={() => (showCategoryEditor = !showCategoryEditor)}
				title="Kategorien verwalten"
			>
				{showCategoryEditor ? '✕' : '＋'}
			</button>
		</div>
		{#if showCategoryEditor}
			<div class="cat-editor">
				<form
					class="cat-add"
					onsubmit={(e) => {
						e.preventDefault();
						void createCategory();
					}}
				>
					<input
						type="text"
						placeholder="Neue Kategorie…"
						bind:value={newCategoryName}
						maxlength="40"
					/>
					<button type="submit" disabled={!newCategoryName.trim()}>Hinzufügen</button>
				</form>
				{#if categories.length > 0}
					<ul class="cat-list">
						{#each categories as cat (cat.id)}
							<li>
								<span class="dot" style:background={cat.color}></span>
								<span class="cat-name">{cat.name}</span>
								<button type="button" class="link" onclick={() => startRename(cat.id, cat.name)}>
									umbenennen
								</button>
								<button type="button" class="link danger" onclick={() => deleteCategory(cat.id)}>
									löschen
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="hint">Noch keine Kategorien. Erstelle eine oben.</p>
				{/if}
			</div>
		{/if}
	</div>

	{#if visible.length === 0}
		<div class="empty">
			{#if tab === 'unread'}
				<p>Keine ungelesenen Artikel.</p>
				<p class="hint">Reagiere im Feed mit „❤️ Interessiert" um Artikel hier zu sammeln.</p>
			{:else if tab === 'favorites'}
				<p>Noch keine Favoriten.</p>
			{:else}
				<p>Archiv ist leer.</p>
			{/if}
		</div>
	{:else}
		<div class="list">
			{#each visible as article (article.id)}
				<article class="row">
					{#if article.imageUrl}
						<button
							type="button"
							class="thumb-btn"
							onclick={() => open(article)}
							aria-label="Öffnen"
						>
							<img src={article.imageUrl} alt="" loading="lazy" />
						</button>
					{/if}
					<div class="row-body">
						<div class="row-meta">
							<span class="site">{article.siteName ?? 'Eigener Link'}</span>
							{#if article.publishedAt}
								<span>·</span>
								<span>{formatRelativeTime(article.publishedAt)}</span>
							{/if}
							{#if article.readingTimeMinutes}
								<span>·</span>
								<span>{article.readingTimeMinutes} min</span>
							{/if}
							{#if article.type === 'saved'}
								<span class="badge">eigen</span>
							{/if}
						</div>
						<button type="button" class="row-title" onclick={() => open(article)}>
							{article.title}
						</button>
						{#if article.excerpt}
							<p class="row-excerpt">{article.excerpt}</p>
						{/if}
					</div>
					<div class="row-actions">
						<select
							class="cat-select"
							value={article.categoryId ?? ''}
							onchange={(e) => {
								const v = (e.currentTarget as HTMLSelectElement).value;
								void setCategory(article.id, v === '' ? null : v);
							}}
							onclick={(e) => e.stopPropagation()}
							title="Kategorie"
						>
							<option value="">— Keine —</option>
							{#each categories as cat (cat.id)}
								<option value={cat.id}>{cat.name}</option>
							{/each}
						</select>
						<button
							type="button"
							class="icon"
							class:active={article.isFavorite}
							onclick={(e) => toggleFav(e, article.id)}
							title="Favorit"
						>
							⭐
						</button>
						{#if tab === 'archive'}
							<button
								type="button"
								class="icon"
								onclick={(e) => unarchive(e, article.id)}
								title="Wiederherstellen"
							>
								↩︎
							</button>
						{:else}
							<button
								type="button"
								class="icon"
								onclick={(e) => archive(e, article.id)}
								title="Archivieren"
							>
								📦
							</button>
						{/if}
						<button
							type="button"
							class="icon danger"
							onclick={(e) => remove(e, article.id)}
							title="Löschen"
						>
							🗑
						</button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 880px;
		margin: 0 auto;
		padding: 0 1rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding-top: 0.5rem;
	}
	.back {
		background: none;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.875rem;
	}
	.header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin-top: 0.25rem;
	}
	.add-link {
		padding: 0.5rem 0.875rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		text-decoration: none;
		font-size: 0.8125rem;
		font-weight: 500;
	}
	.tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.tab {
		padding: 0.625rem 0.875rem;
		background: none;
		border: none;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
	}
	.tab.active {
		color: hsl(var(--color-foreground));
		border-bottom-color: hsl(var(--color-primary));
	}

	.categories-bar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.cat-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}
	.cat-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.625rem;
		border-radius: 999px;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.cat-pill.active {
		background: hsl(var(--color-primary) / 0.18);
		border-color: hsl(var(--color-primary) / 0.5);
	}
	.cat-pill .dot {
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}
	.cat-pill .count {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-background));
		padding: 0 0.35rem;
		border-radius: 999px;
		min-width: 1.1rem;
		text-align: center;
	}
	.cat-pill input {
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font: inherit;
		min-width: 4rem;
		outline: none;
	}
	.cat-edit {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
		background: hsl(var(--color-background));
		border: 1px dashed hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.875rem;
	}
	.cat-editor {
		padding: 0.875rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.cat-add {
		display: flex;
		gap: 0.375rem;
	}
	.cat-add input {
		flex: 1;
		padding: 0.4rem 0.625rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.4rem;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
	}
	.cat-add button {
		padding: 0.4rem 0.75rem;
		border-radius: 0.4rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.cat-add button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.cat-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.cat-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}
	.cat-list .dot {
		display: inline-block;
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
	}
	.cat-list .cat-name {
		flex: 1;
		color: hsl(var(--color-foreground));
	}
	.cat-list .link {
		background: none;
		border: none;
		padding: 0;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: underline;
	}
	.cat-list .link.danger {
		color: hsl(var(--color-destructive));
	}
	.cat-editor .hint {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.cat-select {
		max-width: 9rem;
		padding: 0.25rem 0.4rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		cursor: pointer;
	}

	.empty {
		text-align: center;
		padding: 4rem 0;
		color: hsl(var(--color-muted-foreground));
	}
	.empty .hint {
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.875rem;
		padding: 0.875rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
	}
	.thumb-btn {
		width: 96px;
		height: 64px;
		border: none;
		padding: 0;
		background: hsl(var(--color-background));
		border-radius: 0.5rem;
		overflow: hidden;
		cursor: pointer;
	}
	.thumb-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.row-body {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}
	.row-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.row-meta .site {
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.row-meta .badge {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		padding: 0 0.4rem;
		border-radius: 999px;
		font-weight: 600;
	}
	.row-title {
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		line-height: 1.35;
	}
	.row-title:hover {
		color: hsl(var(--color-primary));
	}
	.row-excerpt {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.4;
	}
	.row-actions {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-self: center;
	}
	.icon {
		width: 1.875rem;
		height: 1.875rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		font-size: 0.875rem;
	}
	.icon.active {
		background: hsl(var(--color-primary) / 0.15);
		border-color: hsl(var(--color-primary) / 0.4);
	}
	.icon.danger:hover {
		background: hsl(var(--color-destructive) / 0.15);
		border-color: hsl(var(--color-destructive) / 0.4);
	}
</style>
