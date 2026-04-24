<!--
  Editable textarea bound to the draft's current version.
  Saves with a short debounce so every keystroke doesn't hit Dexie; on
  blur it force-flushes any pending edit. The word-count is computed
  locally for live feedback and re-derived on save.
-->
<script lang="ts">
	import { draftsStore } from '../stores/drafts.svelte';
	import type { DraftVersion } from '../types';

	let {
		version,
		targetWords = null,
		onchange,
	}: {
		version: DraftVersion;
		targetWords?: number | null;
		onchange?: (content: string) => void;
	} = $props();

	// Snapshot id so we reset local state when the active version flips
	// (e.g. after "Restore this version" on the history panel).
	/* svelte-ignore state_referenced_locally */
	let lastVersionId = $state<string>(version.id);
	/* svelte-ignore state_referenced_locally */
	let text = $state<string>(version.content);

	$effect(() => {
		if (version.id !== lastVersionId) {
			lastVersionId = version.id;
			text = version.content;
		}
	});

	const wordCount = $derived.by(() => {
		const trimmed = text.trim();
		return trimmed ? trimmed.split(/\s+/).length : 0;
	});

	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let pending = $state(false);

	function queueSave(next: string) {
		if (saveTimer) clearTimeout(saveTimer);
		pending = true;
		saveTimer = setTimeout(async () => {
			saveTimer = null;
			await draftsStore.updateVersionContent(version.id, next);
			pending = false;
		}, 500);
	}

	function handleInput() {
		onchange?.(text);
		queueSave(text);
	}

	async function flush() {
		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = null;
			await draftsStore.updateVersionContent(version.id, text);
			pending = false;
		}
	}
</script>

<div class="editor">
	<textarea
		bind:value={text}
		oninput={handleInput}
		onblur={flush}
		placeholder="Hier schreibst du (oder die KI). Leer lassen für Generate."
		spellcheck="true"
	></textarea>
	<footer>
		<span>
			{wordCount} Wörter{#if targetWords}
				<span class="target"> / Ziel ~{targetWords}</span>
			{/if}
		</span>
		<span class="status" aria-live="polite">
			{#if pending}
				Speichert…
			{:else}
				Gespeichert
			{/if}
		</span>
	</footer>
</div>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	textarea {
		width: 100%;
		min-height: 50vh;
		padding: 1rem 1.25rem;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
		font-size: 1.05rem;
		line-height: 1.6;
		color: inherit;
		resize: vertical;
	}
	textarea:focus {
		outline: 2px solid #0ea5e9;
		outline-offset: 1px;
		border-color: transparent;
	}
	footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.target {
		opacity: 0.7;
	}
	.status {
		font-style: italic;
	}
</style>
