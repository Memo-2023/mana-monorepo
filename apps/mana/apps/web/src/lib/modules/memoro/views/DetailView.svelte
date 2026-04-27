<!--
  Memoro — DetailView (inline editable overlay)
  Memo details with transcript, pin toggle, auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { memosStore } from '../stores/memos.svelte';
	import { llmQueueDb } from '$lib/llm-queue';
	import type { QueuedTask } from '@mana/shared-llm';
	import type { LlmTier } from '@mana/shared-llm';
	import { PushPin } from '@mana/shared-icons';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalMemo, ProcessingStatus } from '../types';
	import { _ } from 'svelte-i18n';

	// Map LlmTier → i18n key (mana-server keyed as 'mana_server' since dots are
	// reserved path separators). Strings live in memoro.detail_view.title_sources.
	const TITLE_SOURCE_KEYS: Record<LlmTier, string> = {
		none: 'memoro.detail_view.title_sources.none',
		browser: 'memoro.detail_view.title_sources.browser',
		'mana-server': 'memoro.detail_view.title_sources.mana_server',
		byok: 'memoro.detail_view.title_sources.byok',
		cloud: 'memoro.detail_view.title_sources.cloud',
	};

	function isLlmTier(value: unknown): value is LlmTier {
		return value === 'none' || value === 'browser' || value === 'mana-server' || value === 'cloud';
	}

	let { params, goBack }: ViewProps = $props();
	let memoId = $derived(params.memoId as string);

	let editTitle = $state('');
	let editIntro = $state('');
	let editLanguage = $state('');

	const detail = useDetailEntity<LocalMemo>({
		id: () => memoId,
		table: 'memos',
		// title, intro, transcript live in the encryption registry — without
		// `decrypt: true` the inputs would bind to raw `enc:1:...` ciphertext
		// strings instead of plaintext. Pre-existing bug surfaced when the
		// LLM auto-title started populating the title field for the first
		// time on 2026-04-09; previously the field was always null and the
		// transcript was the only encrypted field shown, but no one noticed.
		decrypt: true,
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

	const STATUS_KEYS: Record<ProcessingStatus, string> = {
		pending: 'memoro.detail_view.statuses.pending',
		processing: 'memoro.detail_view.statuses.processing',
		completed: 'memoro.detail_view.statuses.completed',
		failed: 'memoro.detail_view.statuses.failed',
	};

	const statusColors: Record<ProcessingStatus, string> = {
		pending: '#eab308',
		processing: '#3b82f6',
		completed: '#22c55e',
		failed: '#ef4444',
	};

	// Reactive lookup of any LLM queue task tagged with this memo, so the
	// UI can show "Titel wird generiert..." while a generateTitleTask is
	// pending or running. Returns the most recent task row (any state).
	const titleQueueRow = useLiveQueryWithDefault<QueuedTask | null>(async () => {
		if (!memoId) return null;
		const rows = await llmQueueDb.tasks
			.where('[refType+refId]')
			.equals(['memo', memoId])
			.and((t) => t.taskName === 'common.generateTitle')
			.reverse()
			.sortBy('enqueuedAt');
		return rows[0] ?? null;
	}, null);

	const titleIsGenerating = $derived(
		titleQueueRow.value?.state === 'pending' || titleQueueRow.value?.state === 'running'
	);

	// Source label for the title — read from memo.metadata.titleSource
	// (set by the memoro LLM watcher when it applies an auto-generated
	// title, cleared by memosStore.update() when the user types over it).
	// Returns a label string or null if the title was manually entered.
	const titleSourceLabel = $derived.by(() => {
		const memo = detail.entity;
		if (!memo) return null;
		// Don't show a source label while we're still mid-generation.
		if (titleIsGenerating) return null;
		// Don't show a source label if the user has typed into the field
		// and edits haven't been saved yet — they're about to overwrite.
		if (detail.focused) return null;
		const metadata = (memo.metadata as Record<string, unknown> | null) ?? {};
		const source = metadata.titleSource;
		return isLlmTier(source) ? $_(TITLE_SOURCE_KEYS[source]) : null;
	});
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel={$_('memoro.detail_view.not_found')}
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel={$_('memoro.detail_view.confirm_delete')}
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: $_('memoro.detail_view.toast_deleted'),
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
				placeholder={titleIsGenerating && !editTitle
					? $_('memoro.detail_view.placeholder_title_generating')
					: $_('memoro.detail_view.placeholder_title_idle')}
			/>
			<button class="pin-btn" class:pinned={memo.isPinned} onclick={togglePin}>
				<PushPin size={16} />
			</button>
		</div>

		{#if titleSourceLabel}
			<div class="source-label title-source-label">{titleSourceLabel}</div>
		{/if}

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">{$_('memoro.detail_view.label_status')}</span>
				<span class="prop-value" style="color: {statusColors[memo.processingStatus]}">
					{$_(STATUS_KEYS[memo.processingStatus])}
				</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('memoro.detail_view.label_duration')}</span>
				<span class="prop-value">{formatDuration(memo.audioDurationMs)}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('memoro.detail_view.label_language')}</span>
				<input
					class="prop-input"
					bind:value={editLanguage}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder={$_('memoro.detail_view.placeholder_language')}
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('memoro.detail_view.label_visibility')}</span>
				<VisibilityPicker
					level={memo.visibility ?? 'space'}
					onChange={(next: VisibilityLevel) => memosStore.setVisibility(memoId, next)}
					disabledLevels={['unlisted']}
				/>
			</div>
		</div>

		<div class="section">
			<span class="section-label">{$_('memoro.detail_view.section_summary')}</span>
			<textarea
				class="description-input"
				bind:value={editIntro}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder={$_('memoro.detail_view.placeholder_summary')}
				rows={2}
			></textarea>
		</div>

		<div class="section">
			<span class="section-label">{$_('memoro.detail_view.section_transcript')}</span>
			{#if memo.processingStatus === 'processing'}
				<div class="transcript transcript-loading">
					<span class="loading-dot"></span>
					<span class="loading-dot"></span>
					<span class="loading-dot"></span>
					<span>{$_('memoro.detail_view.transcribing')}</span>
				</div>
			{:else if memo.processingStatus === 'failed'}
				<div class="transcript transcript-failed">
					{$_('memoro.detail_view.transcript_failed')}
				</div>
			{:else if memo.transcript}
				<div class="transcript">{memo.transcript}</div>
				<div class="source-label">{$_('memoro.detail_view.transcript_source')}</div>
			{:else}
				<div class="transcript transcript-empty">{$_('memoro.detail_view.transcript_empty')}</div>
			{/if}
		</div>

		<div class="meta">
			<span
				>{$_('memoro.detail_view.meta_created', {
					values: { date: formatDate(new Date(memo.createdAt ?? '')) },
				})}</span
			>
			{#if memo.updatedAt}
				<span
					>{$_('memoro.detail_view.meta_updated', {
						values: { date: formatDate(new Date(memo.updatedAt)) },
					})}</span
				>
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
	.transcript-loading {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-style: italic;
	}
	.transcript-empty {
		font-style: italic;
		opacity: 0.7;
	}
	.transcript-failed {
		color: hsl(var(--color-destructive, 0 84% 60%));
	}
	.loading-dot {
		display: inline-block;
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.4;
		animation: loadingPulse 1.2s ease-in-out infinite;
	}
	.loading-dot:nth-child(2) {
		animation-delay: 0.15s;
	}
	.loading-dot:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes loadingPulse {
		0%,
		80%,
		100% {
			opacity: 0.4;
			transform: scale(0.85);
		}
		40% {
			opacity: 1;
			transform: scale(1);
		}
	}
	.source-label {
		margin-top: 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		opacity: 0.7;
		font-style: italic;
	}
	.title-source-label {
		/* Sit visually right under the title input rather than the
		   transcript box — needs a tighter top gap and a small left
		   indent so it lines up with the text inside the input. */
		margin-top: 0.125rem;
		margin-bottom: 0.5rem;
		padding-left: 0.125rem;
	}
</style>
