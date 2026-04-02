<!--
  Memoro — Workbench ListView
  Recent memos with transcription status.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { ViewProps } from '$lib/components/workbench/nav-stack';
	import type { LocalMemo } from './types';

	let { navigate, goBack, params }: ViewProps = $props();

	let memos = $state<LocalMemo[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalMemo>('memos')
				.toArray()
				.then((all) => all.filter((m) => !m.deletedAt && !m.isArchived));
		}).subscribe((val) => {
			memos = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const sorted = $derived(
		[...memos].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
	);

	const pinned = $derived(memos.filter((m) => m.isPinned));

	function formatDuration(ms: number | null): string {
		if (!ms) return '--:--';
		const sec = Math.round(ms / 1000);
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-500/20 text-yellow-300',
		processing: 'bg-blue-500/20 text-blue-300',
		completed: 'bg-green-500/20 text-green-300',
		failed: 'bg-red-500/20 text-red-300',
	};
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{memos.length} Memos</span>
		<span>{pinned.length} angepinnt</span>
	</div>

	<div class="flex-1 overflow-auto">
		{#each sorted as memo (memo.id)}
			<button
				onclick={() =>
					navigate('detail', {
						memoId: memo.id,
						_siblingIds: sorted.map((m) => m.id),
						_siblingKey: 'memoId',
					})}
				class="mb-2 w-full rounded-md border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
			>
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1">
							{#if memo.isPinned}
								<span class="text-xs text-white/30">&#128204;</span>
							{/if}
							<p class="truncate text-sm font-medium text-white/80">
								{memo.title || 'Unbenanntes Memo'}
							</p>
						</div>
						{#if memo.intro}
							<p class="mt-0.5 truncate text-xs text-white/40">{memo.intro}</p>
						{/if}
					</div>
					<span
						class="shrink-0 rounded px-1.5 py-0.5 text-[10px] {statusColors[
							memo.processingStatus
						] ?? ''}"
					>
						{memo.processingStatus === 'completed'
							? formatDuration(memo.audioDurationMs)
							: memo.processingStatus}
					</span>
				</div>
			</button>
		{/each}

		{#if sorted.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Memos</p>
		{/if}
	</div>
</div>
