<!--
  Questions — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { Trash } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/components/workbench/nav-stack';
	import type { LocalQuestion, QuestionStatus, QuestionPriority, ResearchDepth } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let questionId = $derived(params.questionId as string);

	let question = $state<LocalQuestion | null>(null);
	let confirmDelete = $state(false);

	// Edit fields
	let editTitle = $state('');
	let editDescription = $state('');
	let editStatus = $state<QuestionStatus>('open');
	let editPriority = $state<QuestionPriority>('normal');
	let editResearchDepth = $state<ResearchDepth>('standard');

	let focused = $state(false);

	$effect(() => {
		questionId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalQuestion>('questions').get(questionId)).subscribe(
			(val) => {
				question = val ?? null;
				if (val && !focused) {
					editTitle = val.title;
					editDescription = val.description ?? '';
					editStatus = val.status;
					editPriority = val.priority;
					editResearchDepth = val.researchDepth;
				}
			}
		);
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await db.table('questions').update(questionId, {
			title: editTitle.trim() || question?.title || 'Ohne Titel',
			description: editDescription.trim() || undefined,
			status: editStatus,
			priority: editPriority,
			researchDepth: editResearchDepth,
			updatedAt: new Date().toISOString(),
		});
	}

	async function handleSelectChange() {
		await db.table('questions').update(questionId, {
			status: editStatus,
			priority: editPriority,
			researchDepth: editResearchDepth,
			updatedAt: new Date().toISOString(),
		});
	}

	async function deleteQuestion() {
		await db.table('questions').update(questionId, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		goBack();
	}

	const statusLabels: Record<QuestionStatus, string> = {
		open: 'Offen',
		researching: 'Recherche',
		answered: 'Beantwortet',
		archived: 'Archiviert',
	};

	const priorityLabels: Record<QuestionPriority, string> = {
		low: 'Niedrig',
		normal: 'Normal',
		high: 'Hoch',
		urgent: 'Dringend',
	};

	const priorityColors: Record<QuestionPriority, string> = {
		low: '#9ca3af',
		normal: '#3b82f6',
		high: '#f59e0b',
		urgent: '#ef4444',
	};

	const depthLabels: Record<ResearchDepth, string> = {
		quick: 'Schnell',
		standard: 'Standard',
		deep: 'Tiefgehend',
	};
</script>

<div class="detail-view">
	{#if !question}
		<p class="empty">Frage nicht gefunden</p>
	{:else}
		<!-- Title -->
		<input
			class="title-input"
			bind:value={editTitle}
			onfocus={() => (focused = true)}
			onblur={saveField}
			placeholder="Titel..."
		/>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Status</span>
				<select class="prop-select" bind:value={editStatus} onchange={handleSelectChange}>
					{#each ['open', 'researching', 'answered', 'archived'] as const as s}
						<option value={s}>{statusLabels[s]}</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">Priorität</span>
				<select
					class="prop-select"
					bind:value={editPriority}
					onchange={handleSelectChange}
					style="color: {priorityColors[editPriority]}"
				>
					{#each ['low', 'normal', 'high', 'urgent'] as const as p}
						<option value={p}>{priorityLabels[p]}</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">Recherchetiefe</span>
				<select class="prop-select" bind:value={editResearchDepth} onchange={handleSelectChange}>
					{#each ['quick', 'standard', 'deep'] as const as d}
						<option value={d}>{depthLabels[d]}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Description -->
		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Beschreibung hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<!-- Tags -->
		{#if question.tags.length > 0}
			<div class="section">
				<span class="section-label">Tags</span>
				<div class="tag-list">
					{#each question.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(question.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if question.updatedAt}
				<span>Bearbeitet: {new Date(question.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Frage wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteQuestion}>Löschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Löschen
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

	/* Title */
	.title-input {
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

	/* Properties */
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
	.prop-select {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
	}
	.prop-select:hover,
	.prop-select:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .prop-select {
		color: #e5e7eb;
	}
	:global(.dark) .prop-select:hover,
	:global(.dark) .prop-select:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Sections */
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

	/* Tags */
	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.tag {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		background: rgba(0, 0, 0, 0.04);
		color: #6b7280;
	}
	:global(.dark) .tag {
		background: rgba(255, 255, 255, 0.06);
		color: #9ca3af;
	}

	/* Meta & actions */
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
