<!--
  Memoro — DetailView (inline editable overlay)
  Memo details with transcript, pin toggle, auto-save on blur.
-->
<script lang="ts">
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { memosStore } from '../stores/memos.svelte';
	import { PushPin } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalMemo, ProcessingStatus } from '../types';

	let { params, goBack }: ViewProps = $props();
	let memoId = $derived(params.memoId as string);

	let editTitle = $state('');
	let editIntro = $state('');
	let editLanguage = $state('');

	const detail = useDetailEntity<LocalMemo>({
		id: () => memoId,
		table: 'memos',
		onLoad: (val) => {
			editTitle = val.title ?? '';
			editIntro = val.intro ?? '';
			editLanguage = val.language ?? '';
		},
	});

	async function saveField() {
		detail.blur();
		await memosStore.update(memoId, {
			title: editTitle.trim() || null,
			intro: editIntro.trim() || null,
			language: editLanguage.trim() || null,
		});
	}

	async function togglePin() {
		const memo = detail.entity;
		if (!memo) return;
		if (memo.isPinned) {
			await memosStore.unpin(memoId);
		} else {
			await memosStore.pin(memoId);
		}
	}

	function formatDuration(ms: number | null): string {
		if (!ms) return '--:--';
		const sec = Math.round(ms / 1000);
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	const statusLabels: Record<ProcessingStatus, string> = {
		pending: 'Ausstehend',
		processing: 'Wird verarbeitet',
		completed: 'Fertig',
		failed: 'Fehlgeschlagen',
	};

	const statusColors: Record<ProcessingStatus, string> = {
		pending: '#eab308',
		processing: '#3b82f6',
		completed: '#22c55e',
		failed: '#ef4444',
	};
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Memo nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Memo wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Memo gelöscht',
			delete: () => memosStore.delete(memoId),
			goBack,
		})}
>
	{#snippet body(memo)}
		<div class="title-row">
			<input
				class="title-input"
				bind:value={editTitle}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Titel..."
			/>
			<button class="pin-btn" class:pinned={memo.isPinned} onclick={togglePin}>
				<PushPin size={16} />
			</button>
		</div>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Status</span>
				<span class="prop-value" style="color: {statusColors[memo.processingStatus]}">
					{statusLabels[memo.processingStatus]}
				</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Dauer</span>
				<span class="prop-value">{formatDuration(memo.audioDurationMs)}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Sprache</span>
				<input
					class="prop-input"
					bind:value={editLanguage}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="z.B. de"
				/>
			</div>
		</div>

		<div class="section">
			<span class="section-label">Zusammenfassung</span>
			<textarea
				class="description-input"
				bind:value={editIntro}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Zusammenfassung hinzufügen..."
				rows={2}
			></textarea>
		</div>

		{#if memo.transcript}
			<div class="section">
				<span class="section-label">Transkript</span>
				<div class="transcript">{memo.transcript}</div>
			</div>
		{/if}

		<div class="meta">
			<span>Erstellt: {new Date(memo.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if memo.updatedAt}
				<span>Bearbeitet: {new Date(memo.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.pin-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.125rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
		transition:
			color 0.15s,
			transform 0.15s;
	}
	.pin-btn:hover {
		color: hsl(var(--color-muted-foreground));
	}
	.pin-btn.pinned {
		color: hsl(var(--color-warning));
	}
	.transcript {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
		padding: 0.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-surface-hover));
		white-space: pre-wrap;
		max-height: 12rem;
		overflow-y: auto;
	}
</style>
