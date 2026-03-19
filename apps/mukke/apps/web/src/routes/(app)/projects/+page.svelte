<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { projectStore } from '$lib/stores/project.svelte';

	let showCreateModal = $state(false);
	let newProjectTitle = $state('');
	let newProjectDescription = $state('');
	let isCreating = $state(false);

	onMount(async () => {
		await projectStore.loadProjects();
	});

	async function handleCreateProject() {
		if (!newProjectTitle.trim()) return;

		isCreating = true;
		try {
			const project = await projectStore.createProject(newProjectTitle, newProjectDescription);
			showCreateModal = false;
			newProjectTitle = '';
			newProjectDescription = '';
			goto(`/editor/${project.id}`);
		} finally {
			isCreating = false;
		}
	}

	async function handleDeleteProject(id: string, e: Event) {
		e.stopPropagation();
		e.preventDefault();
		if (confirm('Are you sure you want to delete this project?')) {
			await projectStore.deleteProject(id);
		}
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Editor Projects - Mukke</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold">Editor Projects</h1>
		<button
			onclick={() => (showCreateModal = true)}
			class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Project
		</button>
	</div>

	{#if projectStore.isLoading}
		<div class="flex items-center justify-center py-16">
			<div
				class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
			></div>
		</div>
	{:else if projectStore.projects.length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
				<svg
					class="w-8 h-8 text-foreground-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
					/>
				</svg>
			</div>
			<h3 class="text-lg font-medium mb-2">No projects yet</h3>
			<p class="text-foreground-secondary mb-4">Create your first project to get started</p>
			<button
				onclick={() => (showCreateModal = true)}
				class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
			>
				Create Project
			</button>
		</div>
	{:else}
		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each projectStore.projects as project}
				<a
					href="/editor/{project.id}"
					class="block p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors group"
				>
					<div class="flex items-start justify-between">
						<h3 class="font-medium group-hover:text-primary transition-colors">
							{project.title}
						</h3>
						<button
							onclick={(e) => handleDeleteProject(project.id, e)}
							class="p-1 text-foreground-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
					{#if project.description}
						<p class="text-sm text-foreground-secondary mt-1 line-clamp-2">
							{project.description}
						</p>
					{/if}
					<p class="text-xs text-foreground-secondary mt-2">
						Updated {formatDate(project.updatedAt)}
					</p>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Project Modal -->
{#if showCreateModal}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		onclick={() => (showCreateModal = false)}
		role="dialog"
	>
		<div
			class="bg-surface rounded-lg p-6 w-full max-w-md"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<h2 class="text-xl font-bold mb-4">Create New Project</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateProject();
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="title" class="block text-sm font-medium mb-1">Title</label>
						<input
							id="title"
							type="text"
							bind:value={newProjectTitle}
							class="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
							placeholder="My New Track"
							required
						/>
					</div>
					<div>
						<label for="description" class="block text-sm font-medium mb-1"
							>Description (optional)</label
						>
						<textarea
							id="description"
							bind:value={newProjectDescription}
							class="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:outline-none resize-none"
							rows="3"
							placeholder="Add a description..."
						></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-3 mt-6">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="px-4 py-2 text-foreground-secondary hover:text-foreground transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isCreating || !newProjectTitle.trim()}
						class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
					>
						{isCreating ? 'Creating...' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
