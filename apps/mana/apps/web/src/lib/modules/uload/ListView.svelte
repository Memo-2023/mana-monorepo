<!--
  uLoad — Workbench ListView
  Short links list with click counts.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalLink, LocalFolder } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate }: ViewProps = $props();

	const linksQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalLink>('links').toArray();
		const visible = all.filter((l) => !l.deletedAt && l.isActive);
		return decryptRecords('links', visible);
	}, [] as LocalLink[]);

	const foldersQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalFolder>('uloadFolders').toArray();
		return all.filter((f) => !f.deletedAt);
	}, [] as LocalFolder[]);

	const links = $derived(linksQuery.value);
	const folders = $derived(foldersQuery.value);

	const totalClicks = $derived(links.reduce((sum, l) => sum + l.clickCount, 0));

	const sorted = $derived(
		[...links].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 20)
	);

	function hostname(url: string): string {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}
</script>

<BaseListView items={sorted} getKey={(l) => l.id} emptyTitle="Keine Links">
	{#snippet header()}
		<span>{links.length} Links</span>
		<span>{totalClicks} Klicks</span>
		<span>{folders.length} Ordner</span>
	{/snippet}

	{#snippet item(link)}
		<button
			onclick={() =>
				navigate('detail', {
					linkId: link.id,
					_siblingIds: sorted.map((l) => l.id),
					_siblingKey: 'linkId',
				})}
			class="mb-1 w-full min-h-[44px] text-left rounded-md px-3 py-2 transition-colors hover:bg-white/5 cursor-pointer"
		>
			<div class="flex items-center justify-between">
				<p class="truncate text-sm font-medium text-white/80">
					{link.title || link.shortCode}
				</p>
				<span class="shrink-0 text-xs text-white/40">{link.clickCount}</span>
			</div>
			<p class="truncate text-xs text-white/30">{hostname(link.originalUrl)}</p>
			{#if link.customCode}
				<p class="text-xs text-blue-400/60">/{link.customCode}</p>
			{/if}
		</button>
	{/snippet}
</BaseListView>
