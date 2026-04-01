<script lang="ts">
	import { Trash, ArrowCounterClockwise, Warning } from '@manacore/shared-icons';
	import { filesStore } from '$lib/modules/storage/stores/files.svelte';
	import { fileTable, storageFolderTable } from '$lib/modules/storage/collections';
	import type { LocalFile, LocalFolder } from '$lib/modules/storage/types';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';

	// Live query for deleted items (not permanently deleted)
	const deletedFiles = liveQuery(async () => {
		const all = await db.table<LocalFile>('files').toArray();
		return all.filter((f) => f.isDeleted && !f.deletedAt);
	});

	const deletedFolders = liveQuery(async () => {
		const all = await db.table<LocalFolder>('storageFolders').toArray();
		return all.filter((f) => f.isDeleted && !f.deletedAt);
	});

	async function handleRestore(id: string, type: 'file' | 'folder') {
		if (type === 'file') {
			await filesStore.restoreFile(id);
		} else {
			await filesStore.restoreFolder(id);
		}
	}

	async function handlePermanentDelete(id: string, type: 'file' | 'folder') {
		if (!confirm('Endgultig loschen? Dies kann nicht ruckgangig gemacht werden.')) return;
		if (type === 'file') {
			await filesStore.permanentDeleteFile(id);
		} else {
			await filesStore.permanentDeleteFolder(id);
		}
	}

	async function handleEmptyTrash() {
		if (!confirm('Papierkorb leeren? Alle Elemente werden endgultig geloscht.')) return;
		const now = new Date().toISOString();
		const files = ($deletedFiles as LocalFile[] | undefined) ?? [];
		const folders = ($deletedFolders as LocalFolder[] | undefined) ?? [];
		for (const f of files) {
			await fileTable.update(f.id, { deletedAt: now, updatedAt: now });
		}
		for (const f of folders) {
			await storageFolderTable.update(f.id, { deletedAt: now, updatedAt: now });
		}
	}

	function formatDate(dateStr: string | undefined): string {
		if (!dateStr) return '--';
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	// Reactively read the live query values
	let files = $derived(($deletedFiles as LocalFile[] | undefined) ?? []);
	let folders = $derived(($deletedFolders as LocalFolder[] | undefined) ?? []);
</script>

<svelte:head>
	<title>Papierkorb - Storage - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Trash size={24} class="text-muted-foreground" />
			<h1 class="text-2xl font-bold text-foreground">Papierkorb</h1>
		</div>

		{#if files.length > 0 || folders.length > 0}
			<button
				class="flex items-center gap-2 rounded-lg bg-destructive px-3 py-1.5 text-sm text-white"
				onclick={handleEmptyTrash}
			>
				<Warning size={16} />
				Papierkorb leeren
			</button>
		{/if}
	</div>

	{#if files.length === 0 && folders.length === 0}
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<div class="mb-4 text-5xl">🗑️</div>
			<h3 class="mb-2 text-lg font-semibold text-foreground">Papierkorb ist leer</h3>
			<p class="text-sm text-muted-foreground">Geloschte Dateien und Ordner erscheinen hier.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each folders as folder (folder.id)}
				<div
					class="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
				>
					<div class="flex items-center gap-3">
						<span class="text-xl">📁</span>
						<div>
							<div class="text-sm font-medium text-foreground">{folder.name}</div>
							<div class="text-xs text-muted-foreground">
								Geloscht am {formatDate(folder.updatedAt)}
							</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button
							class="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
							onclick={() => handleRestore(folder.id, 'folder')}
						>
							<ArrowCounterClockwise size={14} />
							Wiederherstellen
						</button>
						<button
							class="rounded-md px-2 py-1 text-xs text-destructive hover:underline"
							onclick={() => handlePermanentDelete(folder.id, 'folder')}
						>
							Endgultig loschen
						</button>
					</div>
				</div>
			{/each}
			{#each files as file (file.id)}
				<div
					class="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
				>
					<div class="flex items-center gap-3">
						<span class="text-xl">📄</span>
						<div>
							<div class="text-sm font-medium text-foreground">{file.name}</div>
							<div class="text-xs text-muted-foreground">
								Geloscht am {formatDate(file.updatedAt)}
							</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button
							class="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
							onclick={() => handleRestore(file.id, 'file')}
						>
							<ArrowCounterClockwise size={14} />
							Wiederherstellen
						</button>
						<button
							class="rounded-md px-2 py-1 text-xs text-destructive hover:underline"
							onclick={() => handlePermanentDelete(file.id, 'file')}
						>
							Endgultig loschen
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
