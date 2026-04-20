<!--
  Editor — Tiptap 3 Svelte wrapper for the broadcast content editor.

  Minimal toolbar (bold/italic/heading/list/link) plus image upload via
  mana-media. The HTML that comes out of getHTML() is the user's input
  only — the send pipeline wraps it in the full email template (header,
  footer, unsubscribe link) on M4.

  Two-way bind on `content` (Tiptap JSON). Parent persists this via
  broadcastCampaignsStore.updateContent; we don't save here.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import { Link } from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import { uploadLogo } from '$lib/modules/invoices/pdf/logo';

	interface Props {
		content: { tiptap: object; html?: string; plainText?: string };
		placeholder?: string;
	}

	let {
		content = $bindable({ tiptap: { type: 'doc', content: [{ type: 'paragraph' }] } }),
		placeholder = 'Schreib deinen Newsletter …',
	}: Props = $props();

	let editorEl: HTMLElement | undefined = $state();
	let editor: Editor | null = null;
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let linkUrl = $state('');
	let showLinkInput = $state(false);

	// Reactive toolbar state — updated from the editor's transactions.
	let isBold = $state(false);
	let isItalic = $state(false);
	let isH1 = $state(false);
	let isH2 = $state(false);
	let isBulletList = $state(false);
	let isOrderedList = $state(false);
	let isLink = $state(false);

	function syncToolbar() {
		if (!editor) return;
		isBold = editor.isActive('bold');
		isItalic = editor.isActive('italic');
		isH1 = editor.isActive('heading', { level: 1 });
		isH2 = editor.isActive('heading', { level: 2 });
		isBulletList = editor.isActive('bulletList');
		isOrderedList = editor.isActive('orderedList');
		isLink = editor.isActive('link');
	}

	onMount(() => {
		editor = new Editor({
			element: editorEl,
			extensions: [
				StarterKit,
				Image.configure({ inline: false }),
				Link.configure({
					openOnClick: false, // users click to edit, not navigate away
					autolink: true,
				}),
				Placeholder.configure({ placeholder }),
			],
			content: content.tiptap,
			onUpdate: ({ editor: e }) => {
				content = {
					tiptap: e.getJSON(),
					html: e.getHTML(),
					plainText: e.getText(),
				};
				syncToolbar();
			},
			onSelectionUpdate: syncToolbar,
			onTransaction: syncToolbar,
		});
	});

	onDestroy(() => {
		editor?.destroy();
		editor = null;
	});

	// ─── Toolbar actions ─────────────────────────────────

	function cmd<T>(fn: (chain: ReturnType<NonNullable<typeof editor>['chain']>) => T) {
		if (!editor) return;
		fn(editor.chain().focus());
	}

	function toggleBold() {
		cmd((c) => c.toggleBold().run());
	}
	function toggleItalic() {
		cmd((c) => c.toggleItalic().run());
	}
	function toggleH1() {
		cmd((c) => c.toggleHeading({ level: 1 }).run());
	}
	function toggleH2() {
		cmd((c) => c.toggleHeading({ level: 2 }).run());
	}
	function toggleBullet() {
		cmd((c) => c.toggleBulletList().run());
	}
	function toggleOrdered() {
		cmd((c) => c.toggleOrderedList().run());
	}

	function openLinkPrompt() {
		if (!editor) return;
		const existing = (editor.getAttributes('link') as { href?: string }).href ?? '';
		linkUrl = existing;
		showLinkInput = true;
	}

	function applyLink() {
		if (!editor) return;
		const url = linkUrl.trim();
		if (!url) {
			editor.chain().focus().unsetLink().run();
		} else {
			// Basic normalisation: bare domain → https://
			const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
			editor.chain().focus().extendMarkRange('link').setLink({ href: normalised }).run();
		}
		showLinkInput = false;
		linkUrl = '';
	}

	async function onImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !editor) return;
		uploading = true;
		uploadError = null;
		try {
			// Reuse invoices' logo uploader — it's the same mana-media /upload
			// endpoint with a different `app` tag. Acceptable pragmatic reuse
			// until we extract a shared `uploadMedia(file, app)` helper.
			const mediaId = await uploadLogo(file);
			const url = `${getMediaUrl()}/api/v1/media/${mediaId}/file/large`;
			editor.chain().focus().setImage({ src: url, alt: file.name }).run();
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	let imageInput: HTMLInputElement | undefined = $state();

	function getMediaUrl(): string {
		if (typeof window !== 'undefined') {
			const fromWindow = (window as unknown as { __PUBLIC_MANA_MEDIA_URL__?: string })
				.__PUBLIC_MANA_MEDIA_URL__;
			if (fromWindow) return fromWindow;
		}
		return import.meta.env.PUBLIC_MANA_MEDIA_URL || 'http://localhost:3015';
	}
</script>

<div class="editor-wrap">
	<div class="toolbar" role="toolbar" aria-label="Formatierung">
		<button type="button" class="tb" class:on={isBold} onclick={toggleBold} title="Fett (⌘B)">
			<strong>B</strong>
		</button>
		<button type="button" class="tb" class:on={isItalic} onclick={toggleItalic} title="Kursiv (⌘I)">
			<em>I</em>
		</button>
		<span class="divider"></span>
		<button type="button" class="tb" class:on={isH1} onclick={toggleH1} title="Überschrift 1">
			H1
		</button>
		<button type="button" class="tb" class:on={isH2} onclick={toggleH2} title="Überschrift 2">
			H2
		</button>
		<span class="divider"></span>
		<button type="button" class="tb" class:on={isBulletList} onclick={toggleBullet} title="Liste">
			• Liste
		</button>
		<button
			type="button"
			class="tb"
			class:on={isOrderedList}
			onclick={toggleOrdered}
			title="Nummerierte Liste"
		>
			1. Liste
		</button>
		<span class="divider"></span>
		<button type="button" class="tb" class:on={isLink} onclick={openLinkPrompt} title="Link">
			🔗
		</button>
		<button
			type="button"
			class="tb"
			onclick={() => imageInput?.click()}
			disabled={uploading}
			title="Bild hochladen"
		>
			{uploading ? '…' : '🖼'}
		</button>
		<input
			bind:this={imageInput}
			type="file"
			accept="image/png,image/jpeg,image/gif"
			hidden
			onchange={onImageSelect}
		/>
	</div>

	{#if showLinkInput}
		<div class="link-bar">
			<input
				type="url"
				placeholder="https://…"
				bind:value={linkUrl}
				onkeydown={(e) => e.key === 'Enter' && applyLink()}
			/>
			<button type="button" class="btn-sm" onclick={applyLink}>Setzen</button>
			<button
				type="button"
				class="btn-sm btn-sm-muted"
				onclick={() => {
					showLinkInput = false;
					linkUrl = '';
				}}
			>
				Abbrechen
			</button>
		</div>
	{/if}

	{#if uploadError}
		<div class="error">{uploadError}</div>
	{/if}

	<div class="prose" bind:this={editorEl}></div>
</div>

<style>
	.editor-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.toolbar {
		display: flex;
		gap: 0.25rem;
		align-items: center;
		padding: 0.4rem 0.5rem;
		background: var(--color-surface-muted, #f8fafc);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem 0.4rem 0 0;
		flex-wrap: wrap;
	}

	.divider {
		width: 1px;
		height: 1.25rem;
		background: var(--color-border, #e2e8f0);
		margin: 0 0.15rem;
	}

	.tb {
		padding: 0.3rem 0.55rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.3rem;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.tb:hover {
		background: white;
		border-color: var(--color-border, #e2e8f0);
	}

	.tb.on {
		background: #e0e7ff;
		border-color: #c7d2fe;
		color: #3730a3;
	}

	.tb:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.link-bar {
		display: flex;
		gap: 0.4rem;
		padding: 0.4rem 0.5rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-top: 0;
	}

	.link-bar input {
		flex: 1;
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.3rem;
		font-size: 0.9rem;
	}

	.btn-sm {
		padding: 0.35rem 0.75rem;
		background: #6366f1;
		color: white;
		border: 0;
		border-radius: 0.3rem;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.btn-sm-muted {
		background: white;
		color: var(--color-text-muted, #64748b);
		border: 1px solid var(--color-border, #e2e8f0);
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.5rem 0.75rem;
		border-radius: 0.4rem;
		font-size: 0.85rem;
	}

	.prose {
		min-height: 240px;
		padding: 0.75rem 1rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0 0 0.4rem 0.4rem;
		font-size: 0.95rem;
		line-height: 1.55;
	}

	/* Tiptap ProseMirror internals — style the generated DOM. */
	.prose :global(.ProseMirror) {
		outline: none;
		min-height: 220px;
	}

	.prose :global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: var(--color-text-muted, #94a3b8);
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	.prose :global(.ProseMirror h1) {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 1rem 0 0.5rem;
	}

	.prose :global(.ProseMirror h2) {
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0.8rem 0 0.4rem;
	}

	.prose :global(.ProseMirror ul),
	.prose :global(.ProseMirror ol) {
		padding-left: 1.5rem;
	}

	.prose :global(.ProseMirror a) {
		color: #6366f1;
		text-decoration: underline;
	}

	.prose :global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.3rem;
		margin: 0.5rem 0;
	}
</style>
