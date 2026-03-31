<script lang="ts">
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { articleCollection } from '$lib/data/local-store';
	import type { LocalArticle } from '$lib/data/local-store';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from 'svelte-sonner';
	import { Archive, Trash } from '@manacore/shared-icons';

	const NEWS_SERVER = import.meta.env.PUBLIC_NEWS_SERVER_URL || 'http://localhost:3071';

	const savedArticles = useLiveQuery(() =>
		articleCollection.getAll({ sourceOrigin: 'user_saved' })
	);

	let saveUrl = $state('');
	let saving = $state(false);
	let showArchived = $state(false);

	let filteredArticles = $derived.by(() => {
		const all = savedArticles.value ?? [];
		return showArchived ? all : all.filter((a) => !a.isArchived);
	});

	async function saveFromUrl() {
		if (!saveUrl) return;
		saving = true;
		try {
			const token = authStore.isAuthenticated ? await authStore.getValidToken() : null;
			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			if (token) headers['Authorization'] = `Bearer ${token}`;

			const res = await fetch(`${NEWS_SERVER}/api/v1/extract/preview`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ url: saveUrl }),
			});

			if (!res.ok) throw new Error('Extraction failed');
			const extracted = await res.json();

			await articleCollection.insert({
				id: crypto.randomUUID(),
				type: 'saved',
				sourceOrigin: 'user_saved',
				title: extracted.title,
				content: extracted.content,
				htmlContent: extracted.htmlContent,
				excerpt: extracted.excerpt,
				originalUrl: saveUrl,
				author: extracted.byline,
				siteName: extracted.siteName,
				wordCount: extracted.wordCount,
				readingTimeMinutes: extracted.readingTimeMinutes,
				isArchived: false,
			});

			toast.success(`"${extracted.title}" gespeichert`);
			saveUrl = '';
		} catch {
			toast.error('Artikel konnte nicht extrahiert werden');
		}
		saving = false;
	}

	async function toggleArchive(article: LocalArticle) {
		await articleCollection.update(article.id, { isArchived: !article.isArchived });
		toast.success(article.isArchived ? 'Wiederhergestellt' : 'Archiviert');
	}

	async function deleteArticle(article: LocalArticle) {
		if (!confirm(`"${article.title}" löschen?`)) return;
		await articleCollection.delete(article.id);
		toast.success('Gelöscht');
	}
</script>

<div class="mx-auto max-w-4xl">
	<h1 class="mb-6 text-3xl font-bold">Gespeicherte Artikel</h1>

	<!-- Save URL Form -->
	<div class="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
		<div class="flex gap-3">
			<input
				type="url"
				bind:value={saveUrl}
				placeholder="https://example.com/article — URL einfügen und speichern"
				class="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
				onkeydown={(e) => e.key === 'Enter' && saveFromUrl()}
			/>
			<button
				onclick={saveFromUrl}
				disabled={!saveUrl || saving}
				class="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
			>
				{saving ? 'Wird gespeichert...' : 'Speichern'}
			</button>
		</div>
	</div>

	<!-- Filter -->
	<div class="mb-4">
		<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
			<input type="checkbox" bind:checked={showArchived} class="rounded" />
			Archivierte anzeigen
		</label>
	</div>

	<!-- Articles List -->
	{#if savedArticles.loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="h-20 animate-pulse rounded-xl bg-gray-800"></div>
			{/each}
		</div>
	{:else if filteredArticles.length === 0}
		<div class="rounded-xl border-2 border-dashed border-gray-700 p-12 text-center">
			<p class="text-lg font-medium text-gray-400">Noch keine gespeicherten Artikel</p>
			<p class="mt-1 text-sm text-gray-500">
				Füge eine URL oben ein oder nutze die Browser-Extension.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredArticles as article (article.id)}
				<div
					class="group rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all hover:border-gray-700 {article.isArchived
						? 'opacity-60'
						: ''}"
				>
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="truncate font-semibold text-gray-100">{article.title}</h3>
							{#if article.excerpt}
								<p class="mt-1 line-clamp-2 text-sm text-gray-400">{article.excerpt}</p>
							{/if}
							<div class="mt-2 flex items-center gap-3 text-xs text-gray-500">
								{#if article.siteName}
									<span>{article.siteName}</span>
								{/if}
								{#if article.readingTimeMinutes}
									<span>{article.readingTimeMinutes} Min.</span>
								{/if}
								{#if article.originalUrl}
									<a
										href={article.originalUrl}
										target="_blank"
										class="text-emerald-500 hover:underline">Original</a
									>
								{/if}
							</div>
						</div>
						<div class="ml-4 flex items-center gap-1">
							<button
								onclick={() => toggleArchive(article)}
								class="rounded-lg p-2 text-gray-500 opacity-0 transition-all hover:bg-gray-800 hover:text-gray-300 group-hover:opacity-100"
								title={article.isArchived ? 'Wiederherstellen' : 'Archivieren'}
							>
								<Archive size={16} />
							</button>
							<button
								onclick={() => deleteArticle(article)}
								class="rounded-lg p-2 text-gray-500 opacity-0 transition-all hover:bg-gray-800 hover:text-red-400 group-hover:opacity-100"
								title="Löschen"
							>
								<Trash size={16} />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
