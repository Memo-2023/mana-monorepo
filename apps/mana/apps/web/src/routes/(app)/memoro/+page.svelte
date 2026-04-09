<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { memosStore } from '$lib/modules/memoro/stores/memos.svelte';
	import VoiceCaptureBar from '$lib/components/voice/VoiceCaptureBar.svelte';
	import {
		filterBySearch,
		filterByTag,
		getTagsForMemo,
		formatDuration,
		getStatusLabel,
	} from '$lib/modules/memoro/queries';
	import type { Memo, LocalMemoTag } from '$lib/modules/memoro/types';
	import type { Tag } from '@mana/shared-tags';
	import {
		Plus,
		MagnifyingGlass,
		PushPin,
		Archive,
		Microphone,
		Tag as TagIcon,
	} from '@mana/shared-icons';

	const memosCtx: { readonly value: Memo[] } = getContext('memos');
	const tagsCtx: { readonly value: Tag[] } = getContext('tags');
	const memoTagsCtx: { readonly value: LocalMemoTag[] } = getContext('memoTags');

	let searchQuery = $state('');
	let selectedTagId = $state<string | null>(null);

	let filtered = $derived(() => {
		let result = filterBySearch(memosCtx.value, searchQuery);
		if (selectedTagId) {
			result = filterByTag(result, memoTagsCtx.value, selectedTagId);
		}
		return result;
	});

	function handleMemoClick(id: string) {
		goto(`/memoro/${id}`);
	}

	async function handleNewMemo() {
		const memo = await memosStore.create({});
		goto(`/memoro/${memo.id}`);
	}

	// ── Voice capture ─────────────────────────────────────────
	async function handleVoiceComplete(blob: Blob, durationMs: number) {
		const memo = await memosStore.createFromVoice(blob, durationMs, 'de');
		goto(`/memoro/${memo.id}`);
	}

	async function handlePin(e: Event, id: string, isPinned: boolean) {
		e.stopPropagation();
		if (isPinned) {
			await memosStore.unpin(id);
		} else {
			await memosStore.pin(id);
		}
	}

	async function handleArchive(e: Event, id: string) {
		e.stopPropagation();
		await memosStore.archive(id);
	}

	function getMemoTags(memoId: string): Tag[] {
		return getTagsForMemo(tagsCtx.value, memoTagsCtx.value, memoId);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Heute';
		if (days === 1) return 'Gestern';
		if (days < 7) return `vor ${days} Tagen`;
		return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
	}
</script>

<svelte:head>
	<title>Memoro - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Memoro</h1>
			<p class="text-sm text-[hsl(var(--muted-foreground))]">
				{memosCtx.value.length} Memos
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/memoro/tags"
				class="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
			>
				<TagIcon size={16} />
				Tags
			</a>
			<div class="w-64">
				<VoiceCaptureBar
					idleLabel="Memo aufnehmen"
					feature="memoro-voice-capture"
					reason="Sprach-Memos werden verschlüsselt gespeichert. Dafür brauchst du ein Mana-Konto."
					onComplete={handleVoiceComplete}
				/>
			</div>
			<button
				onclick={handleNewMemo}
				class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
			>
				<Plus size={20} />
				Neues Memo
			</button>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<MagnifyingGlass
			size={18}
			class="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
		/>
		<input
			type="text"
			placeholder="Memos durchsuchen..."
			bind:value={searchQuery}
			class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
		/>
	</div>

	<!-- Tag Filter -->
	{#if tagsCtx.value.length > 0}
		<div class="flex flex-wrap gap-2">
			<button
				onclick={() => (selectedTagId = null)}
				class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedTagId === null
					? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
					: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.8)]'}"
			>
				Alle
			</button>
			{#each tagsCtx.value as tag (tag.id)}
				<button
					onclick={() => (selectedTagId = selectedTagId === tag.id ? null : tag.id)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedTagId ===
					tag.id
						? 'text-white'
						: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.8)]'}"
					style={selectedTagId === tag.id && tag.color ? `background-color: ${tag.color}` : ''}
				>
					{tag.name}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Memos List -->
	{#if memosCtx.value.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)]"
			>
				<Microphone size={32} weight="duotone" class="text-[hsl(var(--primary))]" />
			</div>
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">
				Erstelle dein erstes Memo
			</h2>
			<p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
				Nimm Gedanken auf oder schreibe sie direkt auf.
			</p>
			<button
				onclick={handleNewMemo}
				class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
			>
				Neues Memo
			</button>
		</div>
	{:else}
		<div class="space-y-2">
			{#each filtered() as memo (memo.id)}
				<div
					role="button"
					tabindex="0"
					onclick={() => handleMemoClick(memo.id)}
					onkeydown={(e) => e.key === 'Enter' && handleMemoClick(memo.id)}
					class="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:border-[hsl(var(--primary)/0.3)]"
				>
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								{#if memo.isPinned}
									<PushPin size={14} weight="fill" class="shrink-0 text-[hsl(var(--primary))]" />
								{/if}
								<h3 class="truncate font-semibold text-[hsl(var(--foreground))]">
									{memo.title || 'Unbenanntes Memo'}
								</h3>
							</div>
							{#if memo.intro}
								<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
									{memo.intro}
								</p>
							{:else if memo.transcript}
								<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
									{memo.transcript}
								</p>
							{/if}
						</div>
						<div
							class="ml-4 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<button
								onclick={(e) => handlePin(e, memo.id, memo.isPinned)}
								class="rounded p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
								title={memo.isPinned ? 'Loslosen' : 'Anpinnen'}
							>
								<PushPin size={16} weight={memo.isPinned ? 'fill' : 'regular'} />
							</button>
							<button
								onclick={(e) => handleArchive(e, memo.id)}
								class="rounded p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
								title="Archivieren"
							>
								<Archive size={16} />
							</button>
						</div>
					</div>

					<!-- Footer -->
					<div class="mt-3 flex items-center gap-3">
						<span class="text-xs text-[hsl(var(--muted-foreground))]">
							{formatDate(memo.createdAt)}
						</span>
						{#if memo.audioDurationMs}
							<span class="text-xs text-[hsl(var(--muted-foreground))]">
								{formatDuration(memo.audioDurationMs)}
							</span>
						{/if}
						{#if memo.processingStatus !== 'completed'}
							<span
								class="rounded bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
							>
								{getStatusLabel(memo.processingStatus)}
							</span>
						{/if}
						<!-- Tags -->
						{#each getMemoTags(memo.id) as tag (tag.id)}
							<span
								class="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
								style="background-color: {tag.color || 'hsl(var(--muted))'}"
							>
								{tag.name}
							</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Archive link -->
	<div class="pt-2">
		<a
			href="/memoro/archive"
			class="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
		>
			<Archive size={16} />
			Archiv anzeigen
		</a>
	</div>
</div>
