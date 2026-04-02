<script lang="ts">
	import { onMount } from 'svelte';
	import type { Document, DocumentType } from '$lib/types';
	import { markdownToHtml } from '$lib/utils/markdown';
	import { countWords } from '$lib/utils/text';
	import { EDITOR_CONFIG } from '$lib/config/editor';
	import {
		Eye,
		PencilSimple,
		FileText,
		Notebook,
		Lightning,
		FloppyDisk,
		Tag,
	} from '@manacore/shared-icons';
	import MentionInput from './MentionInput.svelte';
	import VersionNavigator from './VersionNavigator.svelte';

	interface Props {
		document: Document;
		saving: boolean;
		onSave: (updates: Partial<Document>) => void;
		onTypeChange: (type: DocumentType) => void;
		onTagsSave: (tags: string[]) => void;
	}

	let { document: doc, saving, onSave, onTypeChange, onTagsSave }: Props = $props();

	let title = $state(doc.title);
	let content = $state(doc.content || '');
	let mode = $state<'edit' | 'preview'>('edit');
	let showTags = $state(false);
	let tagInput = $state('');
	let tags = $state<string[]>(doc.metadata?.tags || []);
	let lastSavedAt = $state<Date | null>(null);
	let hasUnsavedChanges = $state(false);
	let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

	let wordCount = $derived(countWords(content));

	// Process @mentions for preview: @[Title](id) → styled link
	let processedHtml = $derived(() => {
		let html = markdownToHtml(content);
		// Replace @[Title](uuid) with styled mention spans
		html = html.replace(
			/@\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="/documents/$2" class="mention-link">@$1</a>'
		);
		return html;
	});

	function scheduleAutoSave() {
		hasUnsavedChanges = true;
		if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
		autoSaveTimeout = setTimeout(() => {
			save();
		}, EDITOR_CONFIG.AUTO_SAVE_DELAY);
	}

	function save() {
		if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
		onSave({ title, content });
		lastSavedAt = new Date();
		hasUnsavedChanges = false;
	}

	function handleTitleInput(e: Event) {
		title = (e.target as HTMLInputElement).value;
		scheduleAutoSave();
	}

	function handleContentChange(newValue: string) {
		content = newValue;
		scheduleAutoSave();
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			save();
		}
		if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
			e.preventDefault();
			mode = mode === 'edit' ? 'preview' : 'edit';
		}
	}

	function addTag() {
		const tag = tagInput.trim();
		if (tag && !tags.includes(tag)) {
			tags = [...tags, tag];
			tagInput = '';
			onTagsSave(tags);
		}
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
		onTagsSave(tags);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
			if (hasUnsavedChanges) {
				onSave({ title, content });
			}
		};
	});

	$effect(() => {
		title = doc.title;
		content = doc.content || '';
		tags = doc.metadata?.tags || [];
	});
</script>

<div class="editor-container">
	<!-- Toolbar -->
	<div
		class="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border bg-card rounded-t-xl"
	>
		<div class="flex items-center gap-2">
			<!-- Type selector -->
			<div class="flex gap-1">
				{#each [{ type: 'text' as DocumentType, icon: FileText, label: 'Text' }, { type: 'context' as DocumentType, icon: Notebook, label: 'Kontext' }, { type: 'prompt' as DocumentType, icon: Lightning, label: 'Prompt' }] as item}
					<button
						class="px-2 py-1 text-xs rounded-md transition-colors"
						class:bg-primary={doc.type === item.type}
						class:text-primary-foreground={doc.type === item.type}
						class:text-muted-foreground={doc.type !== item.type}
						class:hover:bg-muted={doc.type !== item.type}
						onclick={() => onTypeChange(item.type)}
					>
						<item.icon size={14} class="inline mr-1" />
						{item.label}
					</button>
				{/each}
			</div>

			<div class="w-px h-6 bg-border"></div>

			<button
				class="px-2 py-1 text-xs rounded-md text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"
				onclick={() => (mode = mode === 'edit' ? 'preview' : 'edit')}
			>
				{#if mode === 'edit'}
					<Eye size={14} /> Vorschau
				{:else}
					<PencilSimple size={14} /> Bearbeiten
				{/if}
			</button>

			<button
				class="px-2 py-1 text-xs rounded-md text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"
				onclick={() => (showTags = !showTags)}
			>
				<Tag size={14} /> Tags
			</button>
		</div>

		<div class="flex items-center gap-3 text-xs text-muted-foreground">
			<!-- Version navigator -->
			<VersionNavigator documentId={doc.id} />

			<span>{wordCount} Wörter</span>
			{#if saving}
				<span class="text-amber-500">Speichert...</span>
			{:else if hasUnsavedChanges}
				<span class="text-amber-500">Ungespeichert</span>
			{:else if lastSavedAt}
				<span class="text-green-500">Gespeichert</span>
			{/if}
			<button
				onclick={save}
				class="p-1 rounded hover:bg-muted transition-colors"
				title="Speichern (Ctrl+S)"
			>
				<FloppyDisk size={16} />
			</button>
		</div>
	</div>

	<!-- Tags section -->
	{#if showTags}
		<div class="p-3 border-b border-border bg-card/50">
			<div class="flex flex-wrap items-center gap-2">
				{#each tags as tag}
					<span
						class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-muted text-foreground"
					>
						{tag}
						<button onclick={() => removeTag(tag)} class="hover:text-destructive">×</button>
					</span>
				{/each}
				<input
					type="text"
					bind:value={tagInput}
					onkeydown={handleTagKeydown}
					placeholder="Tag hinzufügen..."
					class="text-xs bg-transparent outline-none w-32 text-foreground placeholder:text-muted-foreground"
				/>
			</div>
		</div>
	{/if}

	<!-- Title -->
	<div class="p-4 pb-0">
		<input
			type="text"
			value={title}
			oninput={handleTitleInput}
			placeholder="Titel..."
			class="w-full text-2xl font-bold bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
		/>
	</div>

	<!-- Content -->
	<div class="p-4 flex-1">
		{#if mode === 'edit'}
			<MentionInput
				value={content}
				placeholder="Schreibe in Markdown... Tippe @ um Dokumente zu referenzieren."
				onInput={handleContentChange}
			/>
		{:else}
			<div class="prose prose-sm dark:prose-invert max-w-none">
				{@html processedHtml()}
			</div>
		{/if}
	</div>

	<!-- Mention hint -->
	{#if mode === 'edit'}
		<div class="px-4 pb-2 text-xs text-muted-foreground">
			Tipp: Tippe <kbd class="px-1 py-0.5 rounded bg-muted font-mono">@</kbd> um andere Dokumente zu
			referenzieren
		</div>
	{/if}
</div>

<style>
	.editor-container {
		display: flex;
		flex-direction: column;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--card));
		min-height: 600px;
	}

	.prose :global(h1) {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	.prose :global(h2) {
		font-size: 1.4rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}
	.prose :global(h3) {
		font-size: 1.15rem;
		font-weight: 600;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}
	.prose :global(blockquote) {
		border-left: 3px solid hsl(var(--primary));
		padding-left: 1rem;
		margin: 1rem 0;
		color: hsl(var(--muted-foreground));
	}
	.prose :global(code) {
		background: hsl(var(--muted));
		padding: 0.15rem 0.3rem;
		border-radius: 0.25rem;
		font-size: 0.85em;
	}
	.prose :global(pre) {
		background: hsl(var(--muted));
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}
	.prose :global(pre code) {
		background: none;
		padding: 0;
	}
	.prose :global(a) {
		color: hsl(var(--primary));
		text-decoration: underline;
	}
	.prose :global(li) {
		margin-left: 1.5rem;
		list-style-type: disc;
	}
	.prose :global(hr) {
		border-color: hsl(var(--border));
		margin: 1.5rem 0;
	}
	.prose :global(.mention-link) {
		background: hsl(var(--primary) / 0.1);
		padding: 0.1rem 0.3rem;
		border-radius: 0.25rem;
		text-decoration: none;
		font-weight: 500;
	}
</style>
