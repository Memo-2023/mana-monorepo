<!--
  AddUrlForm — paste URL → preview → save.

  Flow:
    1. User pastes (or types) a URL, OR the page is opened with a URL
       pre-filled via query string (?url=… / ?text=… / ?title=…). The
       Web Share Target + bookmarklet both land here that way.
    2. On "Vorschau abrufen": check scope-local dedupe first; if found,
       offer "öffnen" instead of re-extracting (saves one round-trip).
       Otherwise call /api/v1/articles/extract and render the preview.
    3. On "Speichern": the already-extracted payload is persisted via
       articlesStore.saveFromExtracted — no second server call.
    4. Navigate into the new article so the user lands directly in the
       reader view.

  Pre-filled URLs auto-trigger the preview on mount so the three-click
  "share from browser → saved" flow really is three clicks: share →
  pick Mana → hit "In Leseliste speichern".
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { articlesStore } from '../stores/articles.svelte';
	import { extractArticle, type ExtractedArticle } from '../api';
	import type { Article } from '../types';

	let url = $state('');
	let preview = $state<ExtractedArticle | null>(null);
	let duplicate = $state<Article | null>(null);
	let loading = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	// a11y: don't use the `autofocus` attribute — route the focus through a
	// use:action so screen-readers announce the page first and the focus
	// happens deliberately after mount.
	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}

	/**
	 * Extract the first URL-shaped token from a string — some share
	 * senders (Chrome Android, WhatsApp) stuff the URL into the `text`
	 * slot instead of `url`, often prefixed with the page title.
	 */
	function firstUrl(text: string): string {
		const m = text.match(/https?:\/\/\S+/i);
		return m ? m[0] : '';
	}

	onMount(() => {
		const params = $page.url.searchParams;
		const fromUrl = params.get('url')?.trim() ?? '';
		const fromText = params.get('text')?.trim() ?? '';
		const candidate = fromUrl || firstUrl(fromText);
		if (candidate) {
			url = candidate;
			// Fire-and-forget — the handler is idempotent enough that a
			// stray second click does no harm.
			void handlePreview();
		}
	});

	function reset() {
		preview = null;
		duplicate = null;
		error = null;
	}

	async function handlePreview() {
		reset();
		const trimmed = url.trim();
		if (!trimmed) {
			error = 'Bitte eine URL einfügen.';
			return;
		}
		try {
			new URL(trimmed);
		} catch {
			error = 'Das sieht nicht nach einer gültigen URL aus.';
			return;
		}

		loading = true;
		try {
			const alreadySaved = await articlesStore.findByUrl(trimmed);
			if (alreadySaved) {
				duplicate = alreadySaved;
				return;
			}
			preview = await extractArticle(trimmed);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Extraktion fehlgeschlagen.';
		} finally {
			loading = false;
		}
	}

	async function handleSave() {
		if (!preview) return;
		saving = true;
		try {
			const saved = await articlesStore.saveFromExtracted(preview);
			goto(`/articles/${saved.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Speichern fehlgeschlagen.';
			saving = false;
		}
	}
</script>

<div class="add-shell">
	<header class="header">
		<h1>Artikel speichern</h1>
		<p class="subtitle">URL einfügen, Vorschau prüfen, speichern.</p>
	</header>

	<div class="input-row">
		<input
			type="url"
			class="url-input"
			bind:value={url}
			placeholder="https://…"
			onkeydown={(e) => {
				if (e.key === 'Enter') handlePreview();
			}}
			use:focusOnMount
		/>
		<button type="button" class="primary" disabled={loading} onclick={handlePreview}>
			{loading ? 'Lädt…' : 'Vorschau abrufen'}
		</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if duplicate}
		<div class="duplicate">
			<p class="dup-headline">Den hast du schon gespeichert.</p>
			<p class="dup-title">{duplicate.title}</p>
			<div class="dup-actions">
				<button type="button" class="primary" onclick={() => goto(`/articles/${duplicate!.id}`)}>
					Zum gespeicherten Artikel
				</button>
				<button type="button" class="secondary" onclick={reset}>Andere URL</button>
			</div>
		</div>
	{/if}

	{#if preview}
		<article class="preview">
			<h2 class="preview-title">{preview.title}</h2>
			<div class="preview-meta">
				{#if preview.siteName}<span>{preview.siteName}</span>{/if}
				{#if preview.author}<span>· {preview.author}</span>{/if}
				{#if preview.readingTimeMinutes}<span>· {preview.readingTimeMinutes} min</span>{/if}
				{#if preview.wordCount}<span>· {preview.wordCount} Wörter</span>{/if}
			</div>
			{#if preview.excerpt}
				<p class="preview-excerpt">{preview.excerpt}</p>
			{/if}
			<div class="preview-actions">
				<button type="button" class="primary" disabled={saving} onclick={handleSave}>
					{saving ? 'Speichere…' : 'In Leseliste speichern'}
				</button>
				<button type="button" class="secondary" onclick={reset} disabled={saving}>
					Abbrechen
				</button>
			</div>
		</article>
	{/if}
</div>

<style>
	.add-shell {
		max-width: 720px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.header {
		margin-bottom: 1.25rem;
	}
	.header h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.6rem;
	}
	.subtitle {
		color: var(--color-text-muted, #64748b);
		margin: 0;
		font-size: 0.95rem;
	}
	.input-row {
		display: flex;
		gap: 0.55rem;
		margin-bottom: 0.9rem;
	}
	.url-input {
		flex: 1;
		padding: 0.6rem 0.85rem;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
		background: var(--color-surface, transparent);
		font: inherit;
		color: inherit;
	}
	.url-input:focus {
		outline: 2px solid #f97316;
		outline-offset: 1px;
		border-color: transparent;
	}
	button {
		padding: 0.55rem 1rem;
		border-radius: 0.55rem;
		font: inherit;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
	}
	button:disabled {
		opacity: 0.6;
		cursor: progress;
	}
	.primary {
		background: #f97316;
		color: white;
		border-color: #f97316;
	}
	.primary:hover:not(:disabled) {
		background: #ea580c;
		border-color: #ea580c;
	}
	.secondary {
		background: transparent;
		color: inherit;
		border-color: var(--color-border, rgba(0, 0, 0, 0.15));
	}
	.secondary:hover:not(:disabled) {
		border-color: var(--color-border-strong, rgba(0, 0, 0, 0.3));
	}
	.error {
		padding: 0.55rem 0.85rem;
		border-radius: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		font-size: 0.9rem;
	}
	.preview,
	.duplicate {
		margin-top: 1rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		border-radius: 0.75rem;
		background: color-mix(in srgb, #f97316 3%, transparent);
	}
	.preview-title {
		margin: 0 0 0.4rem 0;
		font-size: 1.2rem;
		line-height: 1.35;
	}
	.preview-meta {
		font-size: 0.82rem;
		color: var(--color-text-muted, #64748b);
		margin-bottom: 0.7rem;
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.preview-excerpt {
		margin: 0 0 1rem 0;
		line-height: 1.55;
	}
	.preview-actions,
	.dup-actions {
		display: flex;
		gap: 0.5rem;
	}
	.dup-headline {
		margin: 0 0 0.3rem 0;
		font-weight: 600;
	}
	.dup-title {
		margin: 0 0 0.9rem 0;
		color: var(--color-text-muted, #64748b);
	}
</style>
