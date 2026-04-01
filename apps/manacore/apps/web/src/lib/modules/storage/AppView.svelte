<!--
  Storage — Split-Screen AppView
  File browser with recent files and folders.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalFile, LocalFolder } from './types';

	let files = $state<LocalFile[]>([]);
	let folders = $state<LocalFolder[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalFile>('files')
				.toArray()
				.then((all) => all.filter((f) => !f.deletedAt && !f.isDeleted));
		}).subscribe((val) => {
			files = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalFolder>('folders')
				.toArray()
				.then((all) => all.filter((f) => !f.deletedAt && !f.isDeleted));
		}).subscribe((val) => {
			folders = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const recentFiles = $derived(
		[...files].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')).slice(0, 15)
	);

	function formatSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / 1048576).toFixed(1) + ' MB';
	}

	function fileIcon(mimeType: string): string {
		if (mimeType.startsWith('image/')) return '&#128247;';
		if (mimeType.startsWith('video/')) return '&#127909;';
		if (mimeType.startsWith('audio/')) return '&#127925;';
		if (mimeType.includes('pdf')) return '&#128196;';
		return '&#128462;';
	}
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{folders.length} Ordner</span>
		<span>{files.length} Dateien</span>
	</div>

	<div class="flex-1 overflow-auto">
		<!-- Root folders -->
		{#if folders.filter((f) => !f.parentFolderId).length > 0}
			<h3 class="mb-2 text-xs font-medium text-white/50">Ordner</h3>
			{#each folders.filter((f) => !f.parentFolderId) as folder (folder.id)}
				<div
					class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
				>
					<span class="text-sm" style="color: {folder.color ?? '#6b7280'}">&#128193;</span>
					<span class="truncate text-sm text-white/70">{folder.name}</span>
				</div>
			{/each}
		{/if}

		<!-- Recent files -->
		<h3 class="mb-2 mt-3 text-xs font-medium text-white/50">Zuletzt</h3>
		{#each recentFiles as file (file.id)}
			<div
				class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
			>
				<span class="text-sm">{@html fileIcon(file.mimeType)}</span>
				<span class="min-w-0 flex-1 truncate text-sm text-white/70">{file.name}</span>
				<span class="shrink-0 text-xs text-white/30">{formatSize(file.size)}</span>
			</div>
		{/each}

		{#if recentFiles.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Dateien</p>
		{/if}
	</div>
</div>
