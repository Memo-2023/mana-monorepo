<!--
  ExportMenu — drop-down next to the Generate/Checkpoint buttons in the
  DetailView. Four M10 actions:
    - Markdown kopieren
    - .md herunterladen
    - Drucken / PDF (uses the browser's native print dialog)
    - Als Artikel speichern → hand-off to the articles module

  The heavy lifting lives in utils/export.ts + the stores; this
  component is just the menu surface + confirmation toasts.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { articlesStore } from '$lib/modules/articles/stores/articles.svelte';
	import { draftsStore } from '../stores/drafts.svelte';
	import {
		draftToMarkdown,
		draftToPlainText,
		downloadFile,
		fileStem,
		copyTextToClipboard,
	} from '../utils/export';
	import type { Draft, DraftVersion } from '../types';

	let {
		draft,
		currentVersion,
	}: {
		draft: Draft;
		currentVersion: DraftVersion | null;
	} = $props();

	let open = $state(false);
	let feedback = $state<string | null>(null);
	let feedbackTimer: ReturnType<typeof setTimeout> | null = null;
	let busy = $state(false);

	function flash(msg: string) {
		feedback = msg;
		if (feedbackTimer) clearTimeout(feedbackTimer);
		feedbackTimer = setTimeout(() => (feedback = null), 2200);
	}

	async function copyMd() {
		const ok = await copyTextToClipboard(draftToMarkdown(draft, currentVersion));
		flash(
			ok ? $_('writing.export_menu.toast_md_copied') : $_('writing.export_menu.toast_copy_failed')
		);
		open = false;
	}

	async function copyPlain() {
		const ok = await copyTextToClipboard(draftToPlainText(draft, currentVersion));
		flash(
			ok ? $_('writing.export_menu.toast_text_copied') : $_('writing.export_menu.toast_copy_failed')
		);
		open = false;
	}

	function downloadMd() {
		downloadFile(
			`${fileStem(draft.title)}.md`,
			draftToMarkdown(draft, currentVersion),
			'text/markdown;charset=utf-8'
		);
		flash($_('writing.export_menu.toast_downloaded'));
		open = false;
	}

	function printDraft() {
		open = false;
		if (typeof window !== 'undefined') window.print();
	}

	async function saveAsArticle() {
		if (busy) return;
		busy = true;
		try {
			const content = currentVersion?.content ?? '';
			const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
			// `internal://` scheme avoids colliding with real URLs in the
			// articles module's dedupe path while still giving the row a
			// unique originalUrl — the format `internal://writing/<id>`
			// doubles as a back-reference to the source draft.
			const article = await articlesStore.saveFromExtracted({
				originalUrl: `internal://writing/${draft.id}`,
				title: draft.title || draft.briefing.topic || $_('writing.detail_view.untitled_fallback'),
				excerpt: content.slice(0, 240).trim() || null,
				content,
				htmlContent: content, // no HTML body yet — the articles reader handles plain text fine
				author: null,
				siteName: $_('writing.export_menu.site_name'),
				wordCount,
				readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
			});
			await draftsStore.recordPublish(draft.id, 'articles', article.id);
			flash($_('writing.export_menu.toast_saved_article'));
			open = false;
			// Give the toast a moment before navigating away.
			setTimeout(() => goto(`/articles/${article.id}`), 600);
		} catch (err) {
			flash(err instanceof Error ? err.message : String(err));
		} finally {
			busy = false;
		}
	}
</script>

<div class="menu">
	<button
		type="button"
		class="trigger"
		class:active={open}
		onclick={() => (open = !open)}
		aria-expanded={open}
		title={$_('writing.export_menu.title')}
	>
		{$_('writing.export_menu.trigger')}
	</button>
	{#if open}
		<div class="dropdown" role="menu">
			<button type="button" role="menuitem" onclick={copyMd} disabled={busy}>
				{$_('writing.export_menu.copy_md')}
			</button>
			<button type="button" role="menuitem" onclick={copyPlain} disabled={busy}>
				{$_('writing.export_menu.copy_text')}
			</button>
			<button type="button" role="menuitem" onclick={downloadMd} disabled={busy}>
				{$_('writing.export_menu.download_md')}
			</button>
			<button type="button" role="menuitem" onclick={printDraft} disabled={busy}>
				{$_('writing.export_menu.print_pdf')}
			</button>
			<hr />
			<button type="button" role="menuitem" onclick={saveAsArticle} disabled={busy}>
				{$_('writing.export_menu.save_as_article')}
			</button>
		</div>
	{/if}
	{#if feedback}
		<span class="toast" role="status" aria-live="polite">{feedback}</span>
	{/if}
</div>

<style>
	.menu {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.trigger {
		padding: 0.4rem 0.8rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: inherit;
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
	}
	.trigger:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.trigger.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.dropdown {
		position: absolute;
		top: calc(100% + 0.3rem);
		right: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		min-width: 14rem;
		padding: 0.3rem;
		border-radius: 0.55rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
	}
	.dropdown button {
		text-align: left;
		padding: 0.45rem 0.7rem;
		border-radius: 0.4rem;
		border: none;
		background: transparent;
		color: inherit;
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
	}
	.dropdown button:hover:not(:disabled) {
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}
	.dropdown button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.dropdown hr {
		margin: 0.2rem 0.1rem;
		border: none;
		border-top: 1px solid hsl(var(--color-border));
	}
	.toast {
		font-size: 0.8rem;
		color: hsl(var(--color-primary));
		white-space: nowrap;
	}
</style>
