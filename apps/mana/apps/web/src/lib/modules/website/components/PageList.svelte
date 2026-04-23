<script lang="ts">
	import { goto } from '$app/navigation';
	import { pagesStore, InvalidPathError, DuplicatePathError } from '../stores/pages.svelte';
	import type { WebsitePage } from '../types';

	interface Props {
		siteId: string;
		pages: WebsitePage[];
		activePageId: string;
	}

	let { siteId, pages, activePageId }: Props = $props();

	let showAdd = $state(false);
	let draftPath = $state('');
	let draftTitle = $state('');
	let addError = $state<string | null>(null);

	function startAdd() {
		draftPath = '/';
		draftTitle = '';
		addError = null;
		showAdd = true;
	}

	async function submitAdd() {
		addError = null;
		try {
			const page = await pagesStore.createPage({
				siteId,
				path: draftPath,
				title: draftTitle || 'Ohne Titel',
			});
			showAdd = false;
			await goto(`/website/${siteId}/edit/${page.id}`);
		} catch (err) {
			if (err instanceof InvalidPathError) addError = err.message;
			else if (err instanceof DuplicatePathError) addError = err.message;
			else addError = err instanceof Error ? err.message : String(err);
		}
	}

	async function deletePageById(pageId: string, ev: Event) {
		ev.preventDefault();
		ev.stopPropagation();
		if (pages.length <= 1) {
			alert('Mindestens eine Seite muss bestehen bleiben.');
			return;
		}
		if (!confirm('Seite wirklich löschen?')) return;
		await pagesStore.deletePage(pageId);
		// If the active page was deleted, navigate to another one.
		if (pageId === activePageId) {
			const next = pages.find((p) => p.id !== pageId);
			if (next) await goto(`/website/${siteId}/edit/${next.id}`);
		}
	}
</script>

<div class="wb-pages">
	<div class="wb-pages__header">
		<p class="wb-pages__label">Seiten</p>
		<button class="wb-pages__add" onclick={startAdd} title="Neue Seite">+</button>
	</div>

	<ul class="wb-pages__list">
		{#each pages as p (p.id)}
			<li>
				<a
					class="wb-pages__item"
					class:wb-pages__item--active={p.id === activePageId}
					href="/website/{siteId}/edit/{p.id}"
				>
					<div>
						<span class="wb-pages__title">{p.title}</span>
						<span class="wb-pages__path">{p.path}</span>
					</div>
					<button
						class="wb-pages__delete"
						onclick={(e) => deletePageById(p.id, e)}
						title="Seite löschen">×</button
					>
				</a>
			</li>
		{/each}
	</ul>

	{#if showAdd}
		<div class="wb-pages__form">
			<label class="wb-field">
				<span>Titel</span>
				<!-- svelte-ignore a11y_autofocus — inline add-page form; modal-style focus is expected -->
				<input
					type="text"
					value={draftTitle}
					oninput={(e) => (draftTitle = e.currentTarget.value)}
					placeholder="Über uns"
					autofocus
				/>
			</label>
			<label class="wb-field">
				<span>Pfad</span>
				<input
					type="text"
					value={draftPath}
					oninput={(e) => (draftPath = e.currentTarget.value.toLowerCase())}
					placeholder="/ueber-uns"
				/>
			</label>
			{#if addError}
				<p class="wb-error">{addError}</p>
			{/if}
			<div class="wb-pages__form-actions">
				<button class="wb-btn wb-btn--ghost" onclick={() => (showAdd = false)}>Abbrechen</button>
				<button class="wb-btn wb-btn--primary" onclick={submitAdd}>Anlegen</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.wb-pages {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-pages__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.wb-pages__label {
		margin: 0;
		font-size: 0.7rem;
		font-weight: 500;
		opacity: 0.6;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.wb-pages__add {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: inherit;
		padding: 0 0.5rem;
		font-size: 1rem;
		line-height: 1.5;
		border-radius: 0.375rem;
		cursor: pointer;
	}
	.wb-pages__add:hover {
		background: rgba(99, 102, 241, 0.15);
	}
	.wb-pages__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-pages__item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.625rem;
		border-radius: 0.375rem;
		text-decoration: none;
		color: inherit;
		transition: background 0.12s;
	}
	.wb-pages__item:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.wb-pages__item--active {
		background: rgba(99, 102, 241, 0.2);
	}
	.wb-pages__title {
		display: block;
		font-size: 0.875rem;
	}
	.wb-pages__path {
		display: block;
		font-size: 0.7rem;
		opacity: 0.55;
		font-family: ui-monospace, monospace;
		margin-top: 0.1rem;
	}
	.wb-pages__delete {
		background: transparent;
		border: none;
		color: inherit;
		opacity: 0;
		cursor: pointer;
		font-size: 1rem;
		padding: 0 0.25rem;
		transition: opacity 0.12s;
	}
	.wb-pages__item:hover .wb-pages__delete {
		opacity: 0.5;
	}
	.wb-pages__delete:hover {
		opacity: 1 !important;
		color: rgb(248, 113, 113);
	}
	.wb-pages__form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
	}
	.wb-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-field > span {
		font-size: 0.7rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-field input {
		padding: 0.4rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(0, 0, 0, 0.2);
		color: inherit;
		font-size: 0.8125rem;
	}
	.wb-pages__form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.wb-btn {
		padding: 0.35rem 0.75rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
	}
	.wb-btn--ghost {
		background: transparent;
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.9);
		color: white;
	}
	.wb-error {
		margin: 0;
		font-size: 0.75rem;
		color: rgb(248, 113, 113);
	}
</style>
