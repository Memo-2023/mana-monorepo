<!--
  Kontext — Singleton Markdown Document.
  View/Edit toggle, debounced autosave, Cmd/Ctrl+E switches mode.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import { useKontextDoc } from './queries';
	import { kontextStore } from './stores/kontext.svelte';
	import { PencilSimple, Eye } from '@mana/shared-icons';

	const PLACEHOLDER = 'Was soll Mana über dich wissen?';
	const SAVE_DEBOUNCE_MS = 500;

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
		<button class="mode-btn" onclick={toggleMode} title="Cmd/Ctrl + E">
			{#if mode === 'view'}
				<PencilSimple size={14} />
				<span>Bearbeiten</span>
			{:else}
				<Eye size={14} />
				<span>Ansicht</span>
			{/if}
		</button>
	</header>

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
</style>
