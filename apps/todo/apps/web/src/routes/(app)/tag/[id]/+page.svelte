<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CaretLeft, Tag as TagIcon } from '@manacore/shared-icons';
	import { getContext } from 'svelte';
	import type { Tag } from '@manacore/shared-tags';
	import { filterByLabel } from '$lib/data/task-queries';
	import TaskList from '$lib/components/TaskList.svelte';
	import type { Task } from '@todo/shared';

	// Live data from layout context
	const allTasks: { readonly value: Task[] } = getContext('tasks');
	const allTags: { readonly value: Tag[] } = getContext('tags');

	// Get tag ID from URL
	const tagId = $derived($page.params.id ?? '');

	// Get tag — reactively via liveQuery
	const tag = $derived(allTags.value.find((t) => t.id === tagId));

	// Get tasks with this tag — reactively via liveQuery
	const tagTasks = $derived(tagId ? filterByLabel(allTasks.value, tagId) : []);
	const incompleteTasks = $derived(tagTasks.filter((t) => !t.isCompleted));
	const completedTasks = $derived(tagTasks.filter((t) => t.isCompleted));
</script>

<svelte:head>
	<title>{tag?.name || 'Tag'} - Todo</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/" class="back-button" aria-label="Zurück">
			<CaretLeft size={20} weight="bold" />
		</a>
		<div class="header-content">
			{#if tag}
				<div class="tag-icon" style="background-color: {tag.color}20">
					<div class="tag-dot" style="background-color: {tag.color}"></div>
				</div>
				<h1 class="title">{tag.name}</h1>
			{:else}
				<h1 class="title">Tag</h1>
			{/if}
		</div>
		<a href="/tags" class="manage-button" aria-label="Tags verwalten">
			<TagIcon size={20} weight="bold" />
		</a>
	</header>

	{#if !tag}
		<div class="empty-state">
			<div class="empty-icon">
				<TagIcon size={40} weight="light" />
			</div>
			<h2 class="empty-title">Tag nicht gefunden</h2>
			<p class="empty-description">Dieser Tag existiert nicht mehr.</p>
			<a href="/tags" class="btn btn-primary">Zu den Tags</a>
		</div>
	{:else if tagTasks.length === 0}
		<div class="empty-state">
			<div class="empty-icon" style="background-color: {tag.color}20">
				<TagIcon size={40} weight="light" style="color: {tag.color}" />
			</div>
			<h2 class="empty-title">Keine Aufgaben</h2>
			<p class="empty-description">
				Es gibt keine Aufgaben mit dem Tag "{tag.name}".
			</p>
			<a href="/" class="btn btn-primary">Aufgabe erstellen</a>
		</div>
	{:else}
		<!-- Incomplete Tasks -->
		{#if incompleteTasks.length > 0}
			<section class="task-section">
				<h2 class="section-title">
					Offen ({incompleteTasks.length})
				</h2>
				<TaskList tasks={incompleteTasks} />
			</section>
		{/if}

		<!-- Completed Tasks -->
		{#if completedTasks.length > 0}
			<section class="task-section">
				<h2 class="section-title completed">
					Erledigt ({completedTasks.length})
				</h2>
				<TaskList tasks={completedTasks} showCompleted={true} />
			</section>
		{/if}

		<p class="task-count">
			{tagTasks.length}
			{tagTasks.length === 1 ? 'Aufgabe' : 'Aufgaben'}
		</p>
	{/if}
</div>

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	/* Header */
	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		margin-bottom: 1rem;
	}

	.header-content {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.tag-icon {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.625rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tag-dot {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
	}

	.back-button,
	.manage-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--muted-foreground) / 0.2);
		transform: translateX(-2px);
	}

	.manage-button:hover {
		background: hsl(var(--muted-foreground) / 0.2);
	}

	.title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	/* Sections */
	.task-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.section-title.completed {
		color: hsl(var(--muted-foreground) / 0.7);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-icon {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.5rem;
		max-width: 280px;
	}

	/* Count */
	.task-count {
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-top: 1rem;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 0.625rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		text-decoration: none;
	}

	.btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.btn-primary:hover {
		box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
	}
</style>
