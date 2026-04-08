<!--
  Context — Workbench ListView
  Spaces and recent documents.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalContextSpace, LocalDocument } from './types';

	const spacesQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalContextSpace>('contextSpaces').toArray();
		return all.filter((s) => !s.deletedAt);
	}, [] as LocalContextSpace[]);

	const documentsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalDocument>('documents').toArray();
		const visible = all.filter((d) => !d.deletedAt);
		return decryptRecords('documents', visible);
	}, [] as LocalDocument[]);

	const spaces = $derived(spacesQuery.value);
	const documents = $derived(documentsQuery.value);

	const pinnedSpaces = $derived(spaces.filter((s) => s.pinned));

	const recentDocs = $derived(
		[...documents].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')).slice(0, 15)
	);

	const typeIcons: Record<string, string> = {
		text: '&#128196;',
		context: '&#128218;',
		prompt: '&#9889;',
	};
</script>

<BaseListView items={recentDocs} getKey={(d) => d.id} emptyTitle="Keine Dokumente">
	{#snippet header()}
		<span>{spaces.length} Spaces</span>
		<span>{documents.length} Dokumente</span>
	{/snippet}

	{#snippet listHeader()}
		{#if pinnedSpaces.length > 0}
			<h3 class="mb-2 text-xs font-medium text-white/50">Angepinnte Spaces</h3>
			{#each pinnedSpaces as space (space.id)}
				<div class="mb-1 min-h-[44px] rounded-md px-3 py-2 transition-colors hover:bg-white/5">
					<p class="text-sm font-medium text-white/80">{space.name}</p>
					{#if space.description}
						<p class="truncate text-xs text-white/30">{space.description}</p>
					{/if}
				</div>
			{/each}
		{/if}
		<h3 class="mb-2 mt-3 text-xs font-medium text-white/50">Zuletzt bearbeitet</h3>
	{/snippet}

	{#snippet item(doc)}
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
	{/snippet}
</BaseListView>
