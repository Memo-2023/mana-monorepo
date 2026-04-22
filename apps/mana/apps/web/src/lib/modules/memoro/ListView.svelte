<!--
  Memoro — Workbench ListView
  Recent memos with transcription status.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalMemo } from './types';
	import { memosStore } from './stores/memos.svelte';
	import FloatingInputBar from '$lib/components/FloatingInputBar.svelte';

	let { navigate }: ViewProps = $props();

	const memosQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalMemo>('memos').toArray();
		return all.filter((m) => !m.deletedAt && !m.isArchived);
	}, [] as LocalMemo[]);

	const memos = $derived(memosQuery.value);

	const sorted = $derived(
		[...memos].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
	);

	const pinned = $derived(memos.filter((m) => m.isPinned));

	let memoTitle = $state('');

	async function handleTextCreate() {
		if (!memoTitle.trim()) return;
		const memo = await memosStore.create({ title: memoTitle.trim() });
		memoTitle = '';
		navigate('detail', {
			memoId: memo.id,
			_siblingIds: sorted.map((m) => m.id),
			_siblingKey: 'memoId',
		});
	}

	async function handleVoiceComplete(blob: Blob, durationMs: number) {
		const memo = await memosStore.createFromVoice(blob, durationMs, 'de');
		// Open the new memo so the user sees the transcription land
		navigate('detail', {
			memoId: memo.id,
			_siblingIds: sorted.map((m) => m.id),
			_siblingKey: 'memoId',
		});
	}

	function formatDuration(ms: number | null): string {
		if (!ms) return '--:--';
		const sec = Math.round(ms / 1000);
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	const statusColors: Record<string, string> = {
		pending: 'bg-warning/20 text-warning',
		processing: 'bg-primary/20 text-primary',
		completed: 'bg-success/20 text-success',
		failed: 'bg-error/20 text-error',
	};
</script>

<div class="memoro-view">
	<BaseListView items={sorted} getKey={(m) => m.id} emptyTitle="Keine Memos">
		{#snippet header()}
			<span>{memos.length} Memos</span>
			<span>{pinned.length} angepinnt</span>
		{/snippet}

		{#snippet item(memo)}
			<button
				onclick={() =>
					navigate('detail', {
						memoId: memo.id,
						_siblingIds: sorted.map((m) => m.id),
						_siblingKey: 'memoId',
					})}
				class="mb-2 w-full rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 min-h-[44px]"
			>
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1">
							{#if memo.isPinned}
								<span class="text-xs text-muted-foreground/70">&#128204;</span>
							{/if}
							<p class="truncate text-sm font-medium text-foreground">
								{memo.title || 'Unbenanntes Memo'}
							</p>
						</div>
						{#if memo.intro}
							<p class="mt-0.5 truncate text-xs text-muted-foreground">{memo.intro}</p>
						{/if}
					</div>
					<div class="flex items-center gap-1.5 shrink-0">
						{#if memo.transcriptModel && memo.processingStatus === 'completed'}
							<span
								class="rounded px-1 py-0.5 text-[9px] bg-muted text-muted-foreground"
								title="STT-Pipeline"
							>
								{memo.transcriptModel}
							</span>
						{/if}
						<span
							class="rounded px-1.5 py-0.5 text-[10px] {statusColors[memo.processingStatus] ?? ''}"
						>
							{memo.processingStatus === 'completed'
								? formatDuration(memo.audioDurationMs)
								: memo.processingStatus}
						</span>
					</div>
				</div>
			</button>
		{/snippet}
	</BaseListView>

	<FloatingInputBar
		bind:value={memoTitle}
		placeholder="Memo sprechen..."
		onSubmit={handleTextCreate}
		voice
		voiceFeature="memoro-voice-capture"
		voiceReason="Sprach-Memos werden verschlüsselt gespeichert. Dafür brauchst du ein Mana-Konto."
		onVoiceComplete={handleVoiceComplete}
	/>
</div>

<style>
	.memoro-view {
		height: 100%;
		position: relative;
	}
</style>
