<!--
  HighlightsView — Sammelansicht über alle Highlights.

  Gruppiert die chronologisch sortierten Highlights pro Artikel
  (gleiche Reihenfolge, die useAllHighlights liefert) und rendert sie
  mit Farb-Akzent + optionaler Notiz. "Export" kopiert die Sammlung
  als Markdown in die Zwischenablage; "Download" speichert sie als
  .md-Datei.

  Klick auf ein Highlight oder auf den Artikel-Header springt zurück
  in den Reader.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAllHighlights, type HighlightWithArticle } from '../queries';
	import { renderHighlightsMarkdown } from '../lib/markdown-export';

	const rows$ = useAllHighlights();
	const rows = $derived(rows$.value);

	interface Group {
		articleId: string;
		article: HighlightWithArticle['article'];
		highlights: HighlightWithArticle['highlight'][];
	}

	const groups = $derived.by<Group[]>(() => {
		const out: Group[] = [];
		let current: Group | null = null;
		for (const row of rows) {
			if (!current || current.articleId !== row.article.id) {
				current = {
					articleId: row.article.id,
					article: row.article,
					highlights: [row.highlight],
				};
				out.push(current);
			} else {
				current.highlights.push(row.highlight);
			}
		}
		return out;
	});

	let exportLabel = $state('Als Markdown kopieren');

	async function copyMarkdown() {
		const md = renderHighlightsMarkdown(rows);
		try {
			await navigator.clipboard.writeText(md);
			exportLabel = 'Kopiert ✓';
			setTimeout(() => (exportLabel = 'Als Markdown kopieren'), 1500);
		} catch {
			exportLabel = 'Fehler — bitte manuell';
		}
	}

	function downloadMarkdown() {
		const md = renderHighlightsMarkdown(rows);
		const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `mana-highlights-${new Date().toISOString().slice(0, 10)}.md`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Highlights — Artikel — Mana</title>
</svelte:head>

<div class="highlights-view">
	{#if rows.length > 0}
		<div class="actions">
			<button type="button" class="ghost" onclick={copyMarkdown}>{exportLabel}</button>
			<button type="button" class="ghost" onclick={downloadMarkdown}>Als .md herunterladen</button>
		</div>
	{/if}

	{#if rows$.loading}
		<p class="muted center">Lädt…</p>
	{:else if groups.length === 0}
		<div class="empty">
			<p class="empty-headline">Noch keine Highlights.</p>
			<p class="empty-sub">
				Markier eine Textstelle in einem gespeicherten Artikel — sie erscheint hier automatisch.
			</p>
		</div>
	{:else}
		<div class="groups">
			{#each groups as group (group.articleId)}
				<section class="group">
					<header class="group-header">
						<button
							type="button"
							class="article-link"
							onclick={() => goto(`/articles/${group.articleId}`)}
							title="Artikel öffnen"
						>
							<span class="title">{group.article.title}</span>
							{#if group.article.siteName}
								<span class="site">{group.article.siteName}</span>
							{/if}
						</button>
					</header>
					<ul class="hl-list">
						{#each group.highlights as h (h.id)}
							<li class="hl hl-{h.color}">
								<button
									type="button"
									class="hl-text"
									onclick={() => goto(`/articles/${group.articleId}`)}
									title="Im Artikel öffnen"
								>
									„{h.text}"
								</button>
								{#if h.note}
									<p class="hl-note">{h.note}</p>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.highlights-view {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.ghost {
		font: inherit;
		padding: 0.45rem 0.85rem;
		border-radius: 0.5rem;
		cursor: pointer;
		background: transparent;
		color: inherit;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
	}
	.ghost:hover {
		border-color: var(--color-border-strong, rgba(0, 0, 0, 0.3));
	}
	.actions {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.muted {
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
	.muted.center {
		text-align: center;
		margin-top: 2rem;
	}
	.empty {
		margin-top: 2.5rem;
		padding: 2rem;
		text-align: center;
		border: 1px dashed var(--color-border, rgba(0, 0, 0, 0.15));
		border-radius: 0.75rem;
	}
	.empty-headline {
		margin: 0 0 0.5rem 0;
		font-weight: 600;
	}
	.empty-sub {
		margin: 0 0 1.25rem 0;
		color: var(--color-text-muted, #64748b);
	}
	.groups {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.article-link {
		font: inherit;
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		text-align: left;
		padding: 0.2rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.article-link:hover .title {
		color: #f97316;
	}
	.title {
		font-weight: 600;
		font-size: 1.05rem;
	}
	.site {
		font-size: 0.78rem;
		color: var(--color-text-muted, #64748b);
	}
	.hl-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.hl {
		padding: 0.5rem 0.75rem;
		border-radius: 0.45rem;
		border-left: 3px solid transparent;
	}
	.hl-yellow {
		background: color-mix(in srgb, #fde68a 60%, transparent);
		border-left-color: #f59e0b;
	}
	.hl-green {
		background: color-mix(in srgb, #bbf7d0 60%, transparent);
		border-left-color: #10b981;
	}
	.hl-blue {
		background: color-mix(in srgb, #bfdbfe 60%, transparent);
		border-left-color: #3b82f6;
	}
	.hl-pink {
		background: color-mix(in srgb, #fbcfe8 60%, transparent);
		border-left-color: #ec4899;
	}
	.hl-text {
		font: inherit;
		background: transparent;
		border: none;
		color: inherit;
		text-align: left;
		cursor: pointer;
		padding: 0;
		line-height: 1.5;
	}
	.hl-note {
		margin: 0.4rem 0 0 0;
		font-size: 0.88rem;
		color: var(--color-text-muted, #334155);
		font-style: italic;
	}
</style>
