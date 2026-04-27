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
	import { _ } from 'svelte-i18n';

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
			title: editTitle.trim() || detail.entity?.title || $_('questions.detail.title_fallback'),
			description: editDescription.trim() || undefined,
			status: editStatus,
			priority: editPriority,
			researchDepth: editResearchDepth,
		};
		await encryptRecord('questions', diff);
		await db.table('questions').update(questionId, diff);
	}

	async function handleSelectChange() {
		await db.table('questions').update(questionId, {
			status: editStatus,
			priority: editPriority,
			researchDepth: editResearchDepth,
		});
	}

	async function deleteQuestion() {
		await db.table('questions').update(questionId, {
			deletedAt: new Date().toISOString(),
		});
	}

	const priorityColors: Record<QuestionPriority, string> = {
		low: '#9ca3af',
		normal: '#3b82f6',
		high: '#f59e0b',
		urgent: '#ef4444',
	};
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel={$_('questions.detail.not_found')}
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel={$_('questions.detail.confirm_delete')}
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: $_('questions.detail.toast_deleted'),
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
			placeholder={$_('questions.detail.placeholder_title')}
		/>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">{$_('questions.detail.prop_status')}</span>
				<select class="prop-select" bind:value={editStatus} onchange={handleSelectChange}>
					{#each ['open', 'researching', 'answered', 'archived'] as const as s}
						<option value={s}>{$_('questions.status.' + s)}</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('questions.detail.prop_priority')}</span>
				<select
					class="prop-select"
					bind:value={editPriority}
					onchange={handleSelectChange}
					style="color: {priorityColors[editPriority]}"
				>
					{#each ['low', 'normal', 'high', 'urgent'] as const as p}
						<option value={p}>{$_('questions.priority.' + p)}</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">{$_('questions.detail.prop_research_depth')}</span>
				<select class="prop-select" bind:value={editResearchDepth} onchange={handleSelectChange}>
					{#each ['quick', 'standard', 'deep'] as const as d}
						<option value={d}>{$_('questions.detail.depth_' + d)}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="section">
			<span class="section-label">{$_('questions.detail.section_description')}</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder={$_('questions.detail.placeholder_description')}
				rows={3}
			></textarea>
		</div>

		{#if question.tags.length > 0}
			<div class="section">
				<span class="section-label">{$_('questions.detail.section_tags')}</span>
				<div class="tag-list">
					{#each question.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>
		{/if}

		<div class="meta">
			<span
				>{$_('questions.detail.meta_created', {
					values: { date: formatDate(new Date(question.createdAt ?? '')) },
				})}</span
			>
			{#if question.updatedAt}
				<span
					>{$_('questions.detail.meta_updated', {
						values: { date: formatDate(new Date(question.updatedAt)) },
					})}</span
				>
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
