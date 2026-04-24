<!--
  Questions — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { db } from '$lib/data/database';
	import { encryptRecord } from '$lib/data/crypto';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalQuestion, QuestionStatus, QuestionPriority, ResearchDepth } from '../types';

	let { params, goBack }: ViewProps = $props();
	let questionId = $derived(params.questionId as string);

	let editTitle = $state('');
	let editDescription = $state('');
	let editStatus = $state<QuestionStatus>('open');
	let editPriority = $state<QuestionPriority>('normal');
	let editResearchDepth = $state<ResearchDepth>('standard');

	const detail = useDetailEntity<LocalQuestion>({
		id: () => questionId,
		table: 'questions',
		decrypt: true,
		onLoad: (val) => {
			editTitle = val.title;
			editDescription = val.description ?? '';
			editStatus = val.status;
			editPriority = val.priority;
			editResearchDepth = val.researchDepth;
		},
	});

	async function saveField() {
		detail.blur();
		const diff: Record<string, unknown> = {
			title: editTitle.trim() || detail.entity?.title || 'Ohne Titel',
			description: editDescription.trim() || undefined,
			status: editStatus,
			priority: editPriority,
			researchDepth: editResearchDepth,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('questions', diff);
		await db.table('questions').update(questionId, diff);
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

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Frage nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Frage wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Frage gelöscht',
			delete: deleteQuestion,
			goBack,
		})}
>
	{#snippet body(question)}
		<input
			class="title-input"
			bind:value={editTitle}
			onfocus={detail.focus}
			onblur={saveField}
			placeholder="Titel..."
		/>

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

		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Beschreibung hinzufügen..."
				rows={3}
			></textarea>
		</div>

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

		<div class="meta">
			<span>Erstellt: {formatDate(new Date(question.createdAt ?? ''))}</span>
			{#if question.updatedAt}
				<span>Bearbeitet: {formatDate(new Date(question.updatedAt))}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.tag {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-muted-foreground));
	}
</style>
