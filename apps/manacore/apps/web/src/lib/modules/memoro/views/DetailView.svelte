<!--
  Memoro — DetailView (inline editable overlay)
  Memo details with transcript, pin toggle, auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { memosStore } from '../stores/memos.svelte';
	import { toastStore } from '@manacore/shared-ui/toast';
	import { Trash, PushPin } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalMemo, ProcessingStatus } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let memoId = $derived(params.memoId as string);

	let memo = $state<LocalMemo | null>(null);
	let confirmDelete = $state(false);

	// Edit fields
	let editTitle = $state('');
	let editIntro = $state('');
	let editLanguage = $state('');

	let focused = $state(false);

	$effect(() => {
		memoId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalMemo>('memos').get(memoId)).subscribe((val) => {
			memo = val ?? null;
			if (val && !focused) {
				editTitle = val.title ?? '';
				editIntro = val.intro ?? '';
				editLanguage = val.language ?? '';
			}
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await memosStore.update(memoId, {
			title: editTitle.trim() || null,
			intro: editIntro.trim() || null,
			language: editLanguage.trim() || null,
		});
	}

	async function togglePin() {
		if (!memo) return;
		if (memo.isPinned) {
			await memosStore.unpin(memoId);
		} else {
			await memosStore.pin(memoId);
		}
	}

	async function deleteMemo() {
		const id = memoId;
		await memosStore.delete(id);
		goBack();
		toastStore.undo('Memo gelöscht', () => {
			db.table('memos').update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
		});
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

<div class="detail-view">
	{#if !memo}
		<p class="empty">Memo nicht gefunden</p>
	{:else}
		<!-- Title + Pin -->
		<div class="title-row">
			<input
				class="title-input"
				bind:value={editTitle}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Titel..."
			/>
			<button class="pin-btn" class:pinned={memo.isPinned} onclick={togglePin}>
				<PushPin size={16} />
			</button>
		</div>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Status</span>
				<span class="status-badge" style="color: {statusColors[memo.processingStatus]}">
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
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="z.B. de"
				/>
			</div>
		</div>

		<!-- Intro -->
		<div class="section">
			<span class="section-label">Zusammenfassung</span>
			<textarea
				class="description-input"
				bind:value={editIntro}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Zusammenfassung hinzufuegen..."
				rows={2}
			></textarea>
		</div>

		<!-- Transcript (read-only) -->
		{#if memo.transcript}
			<div class="section">
				<span class="section-label">Transkript</span>
				<div class="transcript">{memo.transcript}</div>
			</div>
		{/if}

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(memo.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if memo.updatedAt}
				<span>Bearbeitet: {new Date(memo.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Memo wirklich loeschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteMemo}>Loeschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Loeschen
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
	.title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.title-input {
		flex: 1;
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0;
	}
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.pin-btn {
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.125rem;
		flex-shrink: 0;
		transition: color 0.15s;
	}
	.pin-btn:hover {
		color: #6b7280;
	}
	.pin-btn.pinned {
		color: #f59e0b;
	}
	:global(.dark) .pin-btn:hover {
		color: #e5e7eb;
	}
	.properties {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
	}
	.prop-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.prop-value {
		font-size: 0.8125rem;
		color: #374151;
	}
	:global(.dark) .prop-value {
		color: #e5e7eb;
	}
	.status-badge {
		font-size: 0.8125rem;
		font-weight: 500;
	}
	.prop-input {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
	}
	.prop-input:hover,
	.prop-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .prop-input {
		color: #e5e7eb;
	}
	:global(.dark) .prop-input:hover,
	:global(.dark) .prop-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.description-input {
		font-size: 0.8125rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: transparent;
		color: #374151;
		padding: 0.5rem;
		outline: none;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	.description-input:hover,
	.description-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.description-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .description-input {
		color: #f3f4f6;
	}
	:global(.dark) .description-input:hover,
	:global(.dark) .description-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .description-input::placeholder {
		color: #4b5563;
	}
	.transcript {
		font-size: 0.8125rem;
		color: #374151;
		padding: 0.5rem;
		border-radius: 0.375rem;
		background: rgba(0, 0, 0, 0.02);
		border: 1px solid rgba(0, 0, 0, 0.04);
		white-space: pre-wrap;
		max-height: 12rem;
		overflow-y: auto;
		line-height: 1.5;
	}
	:global(.dark) .transcript {
		color: #e5e7eb;
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.06);
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .meta {
		border-color: rgba(255, 255, 255, 0.06);
	}
	.danger-zone {
		padding-top: 0.5rem;
	}
	.confirm-text {
		font-size: 0.8125rem;
		color: #ef4444;
		margin: 0 0 0.5rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	.action-btn.danger {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}
	.action-btn.danger-subtle {
		color: #ef4444;
		border-color: transparent;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}
</style>
