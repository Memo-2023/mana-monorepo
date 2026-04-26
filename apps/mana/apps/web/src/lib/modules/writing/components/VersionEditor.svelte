<!--
  Editable textarea bound to the draft's current version.
  Saves with a short debounce so every keystroke doesn't hit Dexie; on
  blur it force-flushes any pending edit. The word-count is computed
  locally for live feedback and re-derived on save.

  Selection tracking (M6): the textarea reports its selection range via
  onselect whenever the user drags or keyboard-selects, and accepts
  external content swaps (after a selection-refinement apply, or a
  version restore) via the `forceContent` prop.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { draftsStore } from '../stores/drafts.svelte';
	import type { DraftVersion } from '../types';

	export interface EditorSelection {
		start: number;
		end: number;
		text: string;
	}

	let {
		version,
		targetWords = null,
		forceContent = null,
		onchange,
		onselect,
	}: {
		version: DraftVersion;
		targetWords?: number | null;
		/**
		 * Setting this to a non-null string causes the editor to replace
		 * its local text with it the next time the value changes. Used by
		 * the detail view after a refinement apply or a version restore,
		 * where the Dexie update alone wouldn't re-sync the local text
		 * (the debouncing layer owns it until the version id flips).
		 */
		forceContent?: string | null;
		onchange?: (content: string) => void;
		onselect?: (selection: EditorSelection | null) => void;
	} = $props();

	// Snapshot id so we reset local state when the active version flips
	// (e.g. after "Restore this version" on the history panel).
	/* svelte-ignore state_referenced_locally */
	let lastVersionId = $state<string>(version.id);
	/* svelte-ignore state_referenced_locally */
	let text = $state<string>(version.content);

	let textarea = $state<HTMLTextAreaElement | null>(null);

	$effect(() => {
		if (version.id !== lastVersionId) {
			lastVersionId = version.id;
			text = version.content;
		}
	});

	// External-content swaps (refinement apply / programmatic replace).
	// Tracked via a nonce prop so the effect re-fires even if two applies
	// in a row happen to produce the same string.
	let lastForceSeen = $state<string | null>(null);
	$effect(() => {
		if (forceContent === null) return;
		if (forceContent === lastForceSeen) return;
		lastForceSeen = forceContent;
		text = forceContent;
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

	function captureSelection() {
		if (!textarea) return;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		if (start === end) {
			onselect?.(null);
			return;
		}
		onselect?.({
			start,
			end,
			text: text.slice(start, end),
		});
	}
</script>

<div class="editor">
	<textarea
		bind:this={textarea}
		bind:value={text}
		oninput={handleInput}
		onblur={flush}
		onselect={captureSelection}
		onmouseup={captureSelection}
		onkeyup={captureSelection}
		placeholder={$_('writing.version_editor.placeholder')}
		spellcheck="true"
	></textarea>
	<footer>
		<span>
			{$_('writing.version_editor.word_count', {
				values: { count: wordCount },
			})}{#if targetWords}<span class="target"
					>{$_('writing.version_editor.target_words', { values: { words: targetWords } })}</span
				>{/if}
		</span>
		<span class="status" aria-live="polite">
			{#if pending}
				{$_('writing.version_editor.saving')}
			{:else}
				{$_('writing.version_editor.saved')}
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
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
		font-size: 1.05rem;
		line-height: 1.6;
		color: inherit;
		resize: vertical;
	}
	textarea:focus {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		border-color: transparent;
	}
	footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.target {
		opacity: 0.7;
	}
	.status {
		font-style: italic;
	}
</style>
