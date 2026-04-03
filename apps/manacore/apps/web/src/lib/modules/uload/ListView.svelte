<!--
  uLoad — Workbench ListView
  Short links list with click counts.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalLink, LocalFolder } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	let links = $state<LocalLink[]>([]);
	let folders = $state<LocalFolder[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalLink>('links')
				.toArray()
				.then((all) => all.filter((l) => !l.deletedAt && l.isActive));
		}).subscribe((val) => {
			links = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalFolder>('uloadFolders')
				.toArray()
				.then((all) => all.filter((f) => !f.deletedAt));
		}).subscribe((val) => {
			folders = val ?? [];
		});
		return () => sub.unsubscribe();
	});

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

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{links.length} Links</span>
		<span>{totalClicks} Klicks</span>
		<span>{folders.length} Ordner</span>
	</div>

	<div class="flex-1 overflow-auto">
		{#each sorted as link (link.id)}
			<button
				onclick={() =>
					navigate('detail', {
						linkId: link.id,
						_siblingIds: sorted.map((l) => l.id),
						_siblingKey: 'linkId',
					})}
				class="mb-1 w-full text-left rounded-md px-3 py-2 transition-colors hover:bg-white/5 cursor-pointer"
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
		{/each}

		{#if sorted.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Links</p>
		{/if}
	</div>
</div>
