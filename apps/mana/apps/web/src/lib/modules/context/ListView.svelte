<!--
  Context — Workbench ListView
  Spaces and recent documents.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import type { LocalContextSpace, LocalDocument } from './types';

	let spaces = $state<LocalContextSpace[]>([]);
	let documents = $state<LocalDocument[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalContextSpace>('contextSpaces')
				.toArray()
				.then((all) => all.filter((s) => !s.deletedAt));
		}).subscribe((val) => {
			spaces = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			const all = await db.table<LocalDocument>('documents').toArray();
			const visible = all.filter((d) => !d.deletedAt);
			return decryptRecords('documents', visible);
		}).subscribe((val) => {
			documents = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const recentDocs = $derived(
		[...documents].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')).slice(0, 15)
	);

	const typeIcons: Record<string, string> = {
		text: '&#128196;',
		context: '&#128218;',
		prompt: '&#9889;',
	};
</script>

<div class="flex h-full flex-col gap-3 p-3 sm:p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{spaces.length} Spaces</span>
		<span>{documents.length} Dokumente</span>
	</div>

	<div class="flex-1 overflow-auto">
		<!-- Pinned spaces -->
		{#if spaces.filter((s) => s.pinned).length > 0}
			<h3 class="mb-2 text-xs font-medium text-white/50">Angepinnte Spaces</h3>
			{#each spaces.filter((s) => s.pinned) as space (space.id)}
				<div class="mb-1 min-h-[44px] rounded-md px-3 py-2 transition-colors hover:bg-white/5">
					<p class="text-sm font-medium text-white/80">{space.name}</p>
					{#if space.description}
						<p class="truncate text-xs text-white/30">{space.description}</p>
					{/if}
				</div>
			{/each}
		{/if}

		<!-- Recent documents -->
		<h3 class="mb-2 mt-3 text-xs font-medium text-white/50">Zuletzt bearbeitet</h3>
		{#each recentDocs as doc (doc.id)}
			<div
				class="flex min-h-[44px] items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
			>
				<span class="text-sm">{@html typeIcons[doc.type] ?? '&#128196;'}</span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm text-white/70">{doc.title || 'Unbenannt'}</p>
				</div>
				{#if doc.pinned}
					<span class="text-xs text-white/30">&#128204;</span>
				{/if}
			</div>
		{/each}

		{#if recentDocs.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Dokumente</p>
		{/if}
	</div>
</div>
