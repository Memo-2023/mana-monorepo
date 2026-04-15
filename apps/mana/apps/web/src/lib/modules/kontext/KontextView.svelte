<!--
  Kontext — Singleton Markdown Document.
  View/Edit toggle, debounced autosave, Cmd/Ctrl+E switches mode.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import { useKontextDoc } from './queries';
	import { kontextStore } from './stores/kontext.svelte';
	import { PencilSimple, Eye, LinkSimple, X, NotePencil, Trash } from '@mana/shared-icons';
	import { crawlUrlViaApi, type CrawlMode } from './api';
	import { requireAuth } from '$lib/auth/require-auth.svelte';
	import { notesStore } from '$lib/modules/notes/stores/notes.svelte';
	import { notesSelectionStore } from '$lib/modules/notes/stores/selection.svelte';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';

	let noteSaving = $state(false);
	let noteSaved = $state(false);
	let noteError = $state<string | null>(null);

	const PLACEHOLDER = 'Was soll Mana über dich wissen?';
	const SAVE_DEBOUNCE_MS = 500;

	let urlPanelOpen = $state(false);
	let importUrl = $state('');
	let importMode = $state<CrawlMode>('single');
	let importSummarize = $state(false);
	let importing = $state(false);
	let importPhase = $state<'idle' | 'crawling' | 'summarizing' | 'appending'>('idle');
	let importElapsed = $state(0);
	let importError = $state<string | null>(null);

	let importPhases = $derived.by(() => {
		const steps: Array<{ key: 'crawling' | 'summarizing' | 'appending'; label: string }> = [
			{
				key: 'crawling',
				label: importMode === 'deep' ? 'Website crawlen (bis 20 Seiten)' : 'Seite laden',
			},
			...(importSummarize ? [{ key: 'summarizing' as const, label: 'Mit KI zusammenfassen' }] : []),
			{ key: 'appending', label: 'In Kontext anhängen' },
		];
		const order = steps.map((s) => s.key);
		const currentIdx = order.indexOf(importPhase as never);
		return steps.map((s, i) => ({
			key: s.key,
			label: s.label,
			active: currentIdx === i,
			done: currentIdx > i,
		}));
	});

	let doc$ = useKontextDoc();
	let doc = $derived(doc$.value);

	let mode = $state<'view' | 'edit'>('view');
	let draft = $state('');
	let saveState = $state<'idle' | 'pending' | 'saved'>('idle');
	let initialized = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let savedTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		void kontextStore.ensureDoc();
	});

	// Seed the draft from the live doc once (or when switching into edit
	// mode and the content changed externally while we weren't editing).
	$effect(() => {
		if (!doc) return;
		if (!initialized) {
			draft = doc.content;
			initialized = true;
			if (!doc.content) mode = 'edit';
		}
	});

	function scheduleSave() {
		saveState = 'pending';
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(flush, SAVE_DEBOUNCE_MS);
	}

	async function flush() {
		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = null;
		}
		const next = draft;
		if (doc && next === doc.content) {
			saveState = 'idle';
			return;
		}
		await kontextStore.setContent(next);
		saveState = 'saved';
		if (savedTimer) clearTimeout(savedTimer);
		savedTimer = setTimeout(() => {
			if (saveState === 'saved') saveState = 'idle';
		}, 1500);
	}

	async function toggleMode() {
		if (mode === 'edit') {
			await flush();
			mode = 'view';
		} else {
			if (doc) draft = doc.content;
			mode = 'edit';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
			e.preventDefault();
			void toggleMode();
		}
	}

	function closeUrlPanel() {
		if (importing) return;
		urlPanelOpen = false;
		importUrl = '';
		importMode = 'single';
		importSummarize = false;
		importPhase = 'idle';
		importElapsed = 0;
		importError = null;
	}

	async function handleImport(e: Event) {
		e.preventDefault();
		const trimmed = importUrl.trim();
		if (!trimmed) return;
		const ok = await requireAuth({
			feature: 'kontext-url-import',
			reason:
				'Das Crawlen einer Web-Seite läuft serverseitig (robots.txt, Rate-Limits, optionale KI-Zusammenfassung) und erfordert ein Mana-Konto.',
		});
		if (!ok) return;
		importing = true;
		importError = null;
		importPhase = 'crawling';
		importElapsed = 0;
		const started = performance.now();
		const tick = setInterval(() => {
			importElapsed = Math.floor((performance.now() - started) / 1000);
		}, 250);
		// The backend does crawl + (optional) LLM summary in one call,
		// so we can't observe phase transitions from the wire. Advance
		// the visual phase optimistically based on typical durations.
		// Single-page crawl: ~2-4s. Deep: up to 30s. LLM summary: 5-15s.
		let phaseTimer: ReturnType<typeof setTimeout> | null = null;
		if (importSummarize) {
			const crawlBudgetMs = importMode === 'deep' ? 25_000 : 4_000;
			phaseTimer = setTimeout(() => {
				if (importing) importPhase = 'summarizing';
			}, crawlBudgetMs);
		}
		try {
			const result = await crawlUrlViaApi({
				url: trimmed,
				mode: importMode,
				summarize: importSummarize,
			});
			if (phaseTimer) clearTimeout(phaseTimer);
			importPhase = 'appending';
			const header = `## ${result.title}\n\n_Quelle: ${result.sourceUrl}_\n\n`;
			await kontextStore.appendContent(header + result.content);
			closeUrlPanel();
		} catch (err) {
			importError = err instanceof Error ? err.message : 'import failed';
		} finally {
			if (phaseTimer) clearTimeout(phaseTimer);
			clearInterval(tick);
			importing = false;
		}
	}

	function extractTitle(md: string): string {
		const firstLine = md
			.trim()
			.split('\n')
			.find((l) => l.trim());
		if (!firstLine) return `Kontext vom ${new Date().toLocaleDateString('de-DE')}`;
		const stripped = firstLine.replace(/^#{1,6}\s*/, '').trim();
		return stripped.slice(0, 80) || `Kontext vom ${new Date().toLocaleDateString('de-DE')}`;
	}

	async function handleSaveAsNote() {
		const source = (doc?.content ?? '').trim();
		if (!source || noteSaving) return;
		const ok = await requireAuth({
			feature: 'kontext-to-note',
			reason:
				'Notizen werden verschlüsselt in deinem Konto gespeichert und über Geräte synchronisiert.',
		});
		if (!ok) return;
		noteSaving = true;
		noteError = null;
		try {
			const note = await notesStore.createNote({
				title: extractTitle(source),
				content: source,
			});
			notesSelectionStore.focusNote(note.id);
			await workbenchScenesStore.addAppAfter('notes', 'kontext');
			// Let the new Notes card mount in the carousel, then scroll.
			setTimeout(() => {
				const el = document.querySelector('[data-page-id="notes"]');
				el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
			}, 150);
			noteSaved = true;
		} catch (err) {
			noteError = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
		} finally {
			noteSaving = false;
		}
	}

	async function handleClearKontext() {
		await kontextStore.setContent('');
		draft = '';
		noteSaved = false;
	}

	let renderedHtml = $derived.by(() => {
		const source = doc?.content ?? '';
		if (!source.trim()) return '';
		try {
			return marked.parse(source, { async: false }) as string;
		} catch {
			return '';
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-view">
	<header class="bar">
		<div class="status">
			{#if saveState === 'pending'}
				<span class="status-text">Speichert…</span>
			{:else if saveState === 'saved'}
				<span class="status-text saved">Gespeichert</span>
			{/if}
		</div>
		<div class="actions">
			<button
				class="mode-btn"
				class:active={urlPanelOpen}
				onclick={() => (urlPanelOpen ? closeUrlPanel() : (urlPanelOpen = true))}
				title="Web-Seite crawlen und anhängen"
			>
				<LinkSimple size={14} />
				<span>Aus URL</span>
			</button>
			<button class="mode-btn" onclick={toggleMode} title="Cmd/Ctrl + E">
				{#if mode === 'view'}
					<PencilSimple size={14} />
					<span>Bearbeiten</span>
				{:else}
					<Eye size={14} />
					<span>Ansicht</span>
				{/if}
			</button>
		</div>
	</header>

	{#if urlPanelOpen}
		<form class="url-panel" onsubmit={handleImport}>
			<div class="url-row">
				<input
					type="url"
					bind:value={importUrl}
					required
					placeholder="https://example.com/article"
					disabled={importing}
					class="url-input"
				/>
				<button type="submit" disabled={importing || !importUrl.trim()} class="url-submit">
					{#if importing}
						{#if importPhase === 'crawling'}Crawle…{:else if importPhase === 'summarizing'}Fasse
							zusammen…{:else}Speichere…{/if}
					{:else}
						Einfügen
					{/if}
				</button>
				<button
					type="button"
					onclick={closeUrlPanel}
					disabled={importing}
					class="url-close"
					title="Schließen"
				>
					<X size={14} />
				</button>
			</div>
			<div class="url-opts">
				<label class:disabled={importing}>
					<input type="radio" bind:group={importMode} value="single" disabled={importing} />
					Nur diese Seite
				</label>
				<label class:disabled={importing}>
					<input type="radio" bind:group={importMode} value="deep" disabled={importing} />
					Ganze Website (max. 20)
				</label>
				<span class="url-sep">·</span>
				<label class:disabled={importing}>
					<input type="checkbox" bind:checked={importSummarize} disabled={importing} />
					Mit KI zusammenfassen
				</label>
			</div>
			{#if importing || importPhase !== 'idle'}
				<ol class="phase-list" aria-live="polite">
					{#each importPhases as phase (phase.key)}
						<li class="phase" class:active={phase.active} class:done={phase.done}>
							<span class="phase-dot" aria-hidden="true">
								{#if phase.done}
									✓
								{:else if phase.active}
									<span class="phase-spinner"></span>
								{:else}
									·
								{/if}
							</span>
							<span class="phase-label">{phase.label}</span>
							{#if phase.active}
								<span class="phase-elapsed">{importElapsed}s</span>
							{/if}
						</li>
					{/each}
				</ol>
			{/if}
			{#if importError}
				<p class="url-error">{importError}</p>
			{/if}
		</form>
	{/if}

	{#if mode === 'edit'}
		<textarea
			class="editor"
			bind:value={draft}
			oninput={scheduleSave}
			onblur={flush}
			placeholder={PLACEHOLDER}
		></textarea>
	{:else if renderedHtml}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<article class="prose">{@html renderedHtml}</article>
	{:else}
		<button class="empty" onclick={() => (mode = 'edit')}>
			<span>{PLACEHOLDER}</span>
			<span class="hint">Klicken zum Bearbeiten</span>
		</button>
	{/if}

	{#if doc?.content?.trim()}
		<footer class="footer">
			{#if noteSaved}
				<button class="footer-btn ghost" onclick={handleClearKontext} title="Kontext leeren">
					<Trash size={14} />
					<span>Inhalt löschen</span>
				</button>
			{/if}
			<button
				class="footer-btn primary"
				onclick={handleSaveAsNote}
				disabled={noteSaving}
				title="Aktuellen Kontext als Notiz kopieren"
			>
				<NotePencil size={14} />
				<span
					>{noteSaving
						? 'Speichert…'
						: noteSaved
							? 'Als Notiz gespeichert ✓'
							: 'Als Notiz speichern'}</span
				>
			</button>
			{#if noteError}
				<p class="footer-error">{noteError}</p>
			{/if}
		</footer>
	{/if}
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		height: 100%;
		min-height: 0;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.status {
		min-height: 1rem;
	}

	.actions {
		display: flex;
		gap: 0.375rem;
	}
	.status-text {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.status-text.saved {
		color: hsl(var(--color-success, var(--color-primary)));
	}

	.mode-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.mode-btn:hover {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-ring));
	}
	.mode-btn.active {
		background: hsl(var(--color-primary) / 0.12);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.url-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.35);
	}
	.url-row {
		display: flex;
		align-items: stretch;
		gap: 0.375rem;
	}
	.url-input {
		flex: 1;
		min-width: 0;
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
	}
	.url-input:focus {
		border-color: hsl(var(--color-ring));
	}
	.url-submit {
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}
	.url-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.url-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.url-close:hover:not(:disabled) {
		color: hsl(var(--color-foreground));
		border-color: hsl(var(--color-ring));
	}
	.url-opts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.url-opts label {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		cursor: pointer;
	}
	.url-opts label.disabled {
		opacity: 0.5;
	}
	.url-sep {
		opacity: 0.4;
	}
	.phase-list {
		list-style: none;
		margin: 0;
		padding: 0.25rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.phase {
		display: grid;
		grid-template-columns: 1rem 1fr auto;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		transition: color 0.15s;
	}
	.phase.active {
		color: hsl(var(--color-primary));
		font-weight: 500;
	}
	.phase.done {
		color: hsl(var(--color-success, var(--color-primary)));
	}
	.phase-dot {
		width: 1rem;
		height: 1rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
	}
	.phase-spinner {
		width: 0.75rem;
		height: 0.75rem;
		border: 1.5px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: phase-spin 0.8s linear infinite;
	}
	@keyframes phase-spin {
		to {
			transform: rotate(360deg);
		}
	}
	.phase-elapsed {
		font-variant-numeric: tabular-nums;
		font-size: 0.6875rem;
		opacity: 0.7;
	}
	.url-error {
		margin: 0;
		font-size: 0.6875rem;
		color: hsl(var(--color-destructive, 0 84% 60%));
	}

	.editor {
		flex: 1;
		min-height: 0;
		width: 100%;
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		padding: 0.75rem 0.875rem;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
		font-size: 0.8125rem;
		line-height: 1.55;
		color: hsl(var(--color-foreground));
		resize: none;
		outline: none;
	}
	.editor:focus {
		border-color: hsl(var(--color-ring));
	}
	.editor::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		background: transparent;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.5rem;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		cursor: text;
	}
	.empty:hover {
		border-color: hsl(var(--color-ring));
		color: hsl(var(--color-foreground));
	}
	.empty .hint {
		font-size: 0.6875rem;
		opacity: 0.75;
	}

	.prose {
		flex: 1;
		overflow-y: auto;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		line-height: 1.6;
		padding-right: 0.25rem;
	}
	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3),
	.prose :global(h4) {
		margin: 1.25em 0 0.5em;
		font-weight: 600;
		line-height: 1.3;
	}
	.prose :global(h1) {
		font-size: 1.375rem;
	}
	.prose :global(h2) {
		font-size: 1.15rem;
	}
	.prose :global(h3) {
		font-size: 1rem;
	}
	.prose :global(p) {
		margin: 0.5em 0;
	}
	.prose :global(ul),
	.prose :global(ol) {
		margin: 0.5em 0;
		padding-left: 1.25rem;
	}
	.prose :global(li) {
		margin: 0.125em 0;
	}
	.prose :global(code) {
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
		font-size: 0.8125em;
		padding: 0.1em 0.35em;
		border-radius: 0.25rem;
		background: hsl(var(--color-muted) / 0.5);
	}
	.prose :global(pre) {
		padding: 0.75rem 0.875rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.5);
		overflow-x: auto;
		font-size: 0.8125em;
		line-height: 1.5;
	}
	.prose :global(pre code) {
		background: transparent;
		padding: 0;
	}
	.prose :global(blockquote) {
		margin: 0.75em 0;
		padding: 0.25em 0.75em;
		border-left: 3px solid hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
	}
	.prose :global(a) {
		color: hsl(var(--color-primary));
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.prose :global(hr) {
		border: none;
		border-top: 1px solid hsl(var(--color-border));
		margin: 1.25em 0;
	}
	.prose :global(strong) {
		font-weight: 600;
	}

	.footer {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding-top: 0.5rem;
		border-top: 1px solid hsl(var(--color-border) / 0.6);
	}
	.footer-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.footer-btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.footer-btn.primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
	.footer-btn.primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.footer-btn.ghost {
		background: transparent;
		border-color: hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
	}
	.footer-btn.ghost:hover {
		color: hsl(var(--color-destructive, 0 84% 60%));
		border-color: hsl(var(--color-destructive, 0 84% 60%) / 0.5);
	}
	.footer-error {
		margin: 0;
		font-size: 0.6875rem;
		color: hsl(var(--color-destructive, 0 84% 60%));
	}
</style>
