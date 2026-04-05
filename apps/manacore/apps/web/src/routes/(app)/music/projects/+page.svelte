<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { projectsStore } from '$lib/modules/music/stores/projects.svelte';
	import type { Project } from '$lib/modules/music/types';
	import { ArrowLeft, Plus, Trash, Note, X } from '@manacore/shared-icons';

	const projectsCtx: { readonly value: Project[] } = getContext('projects');

	let showCreateModal = $state(false);
	let newTitle = $state('');
	let newDescription = $state('');
	let isCreating = $state(false);

	async function handleCreate() {
		if (!newTitle.trim()) return;
		isCreating = true;
		try {
			await projectsStore.create({
				title: newTitle.trim(),
				description: newDescription.trim() || undefined,
			});
			newTitle = '';
			newDescription = '';
			showCreateModal = false;
		} catch (e) {
			console.error('Failed to create project:', e);
		}
		isCreating = false;
	}

	async function handleDelete(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm('Projekt wirklich loschen?')) return;
		await projectsStore.delete(id);
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Projekte - Music - ManaCore</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a
				href="/music"
				class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
			>
				<ArrowLeft size={20} />
			</a>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Projekte</h1>
		</div>
		<button
			onclick={() => (showCreateModal = true)}
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
		>
			<Plus size={16} />
			Neues Projekt
		</button>
	</div>

	{#if projectsCtx.value.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<Note size={48} class="mb-3 text-[hsl(var(--muted-foreground))]" />
			<p class="mb-3 text-[hsl(var(--muted-foreground))]">Noch keine Projekte</p>
			<button
				onclick={() => (showCreateModal = true)}
				class="text-sm text-[hsl(var(--primary))] hover:underline"
			>
				Erstes Projekt erstellen
			</button>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each projectsCtx.value as project (project.id)}
				<div
					class="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:border-[hsl(var(--primary)/0.3)]"
				>
					<div class="flex items-start justify-between">
						<h3 class="font-medium text-[hsl(var(--foreground))]">{project.title}</h3>
						<button
							onclick={(e) => handleDelete(project.id, e)}
							class="rounded p-1 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
						>
							<Trash size={16} />
						</button>
					</div>
					{#if project.description}
						<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
							{project.description}
						</p>
					{/if}
					<p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
						Aktualisiert {formatDate(project.updatedAt)}
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Project Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div
			class="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-bold text-[hsl(var(--foreground))]">Neues Projekt</h2>
				<button
					onclick={() => (showCreateModal = false)}
					class="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
				>
					<X size={20} />
				</button>
			</div>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
			>
				<div class="mb-4">
					<label for="proj-title" class="mb-1 block text-sm font-medium">Titel</label>
					<input
						id="proj-title"
						type="text"
						bind:value={newTitle}
						placeholder="Mein Projekt"
						required
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div class="mb-6">
					<label for="proj-desc" class="mb-1 block text-sm font-medium"
						>Beschreibung (optional)</label
					>
					<textarea
						id="proj-desc"
						bind:value={newDescription}
						placeholder="Beschreibe dein Projekt..."
						rows="3"
						class="w-full resize-none rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					></textarea>
				</div>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						disabled={!newTitle.trim() || isCreating}
						class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
					>
						{isCreating ? $_('common.creating') : $_('common.create')}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
