<script lang="ts">
	import { onMount } from 'svelte';
	import { Folder, FileText, Sparkle, Plus } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { spacesStore } from '$lib/stores/spaces.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import DocumentCard from '$lib/components/DocumentCard.svelte';
	import SpaceCard from '$lib/components/SpaceCard.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let isLoading = $state(true);
	let recentDocs = $state<typeof documentsStore.documents>([]);

	onMount(async () => {
		await spacesStore.load();
		await documentsStore.load();
		recentDocs = documentsStore.documents.slice(0, 6);
		isLoading = false;
	});

	function handleDeleteDoc(id: string) {
		documentsStore.delete(id);
	}

	function handleTogglePinDoc(id: string) {
		documentsStore.togglePinned(id);
	}
</script>

<svelte:head>
	<title>Context - Dashboard</title>
</svelte:head>

{#if isLoading}
	<AppLoadingSkeleton />
{:else}
	<div class="dashboard">
		<header class="mb-8">
			<h1 class="text-2xl font-bold text-foreground">Context</h1>
			<p class="text-muted-foreground text-sm mt-1">Dein Wissensmanagement Hub</p>
		</header>

		<!-- Stats -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			<div class="card p-4 text-center">
				<div class="text-2xl font-bold text-foreground">{spacesStore.spaces.length}</div>
				<div class="text-xs text-muted-foreground mt-1">Spaces</div>
			</div>
			<div class="card p-4 text-center">
				<div class="text-2xl font-bold text-foreground">{documentsStore.stats.total}</div>
				<div class="text-xs text-muted-foreground mt-1">Dokumente</div>
			</div>
			<div class="card p-4 text-center">
				<div class="text-2xl font-bold text-foreground">
					{documentsStore.stats.totalWords.toLocaleString()}
				</div>
				<div class="text-xs text-muted-foreground mt-1">Wörter</div>
			</div>
			<div class="card p-4 text-center">
				<div class="text-2xl font-bold text-foreground">
					{documentsStore.stats.text}/{documentsStore.stats.context}/{documentsStore.stats.prompt}
				</div>
				<div class="text-xs text-muted-foreground mt-1">Text/Kontext/Prompt</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="flex gap-3 mb-8">
			<a href="/spaces" class="btn btn-primary flex items-center gap-2">
				<Folder size={16} />
				Spaces
			</a>
			<a href="/documents" class="btn btn-secondary flex items-center gap-2">
				<FileText size={16} />
				Alle Dokumente
			</a>
		</div>

		<!-- Pinned Spaces -->
		{#if spacesStore.pinnedSpaces.length > 0}
			<section class="mb-8">
				<h2 class="text-lg font-semibold text-foreground mb-4">Angeheftete Spaces</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each spacesStore.pinnedSpaces as space}
						<SpaceCard {space} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- Recent Documents -->
		{#if recentDocs.length > 0}
			<section>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-foreground">Zuletzt bearbeitet</h2>
					<a href="/documents" class="text-sm text-primary hover:underline">Alle anzeigen</a>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					{#each recentDocs as doc}
						<DocumentCard
							document={doc}
							onTogglePin={handleTogglePinDoc}
							onDelete={handleDeleteDoc}
						/>
					{/each}
				</div>
			</section>
		{:else}
			<div class="card p-8 text-center">
				<div class="p-4 rounded-full bg-muted inline-block mb-4">
					<FileText size={48} class="text-muted-foreground" />
				</div>
				<h3 class="text-lg font-medium text-foreground mb-2">Noch keine Dokumente</h3>
				<p class="text-sm text-muted-foreground mb-4">
					Erstelle deinen ersten Space und beginne mit dem Schreiben.
				</p>
				<a href="/spaces" class="btn btn-primary inline-flex items-center gap-2">
					<Plus size={16} />
					Ersten Space erstellen
				</a>
			</div>
		{/if}
	</div>
{/if}

<style>
	.dashboard {
		max-width: 1000px;
		margin: 0 auto;
	}
</style>
