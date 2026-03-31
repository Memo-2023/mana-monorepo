<script lang="ts">
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { transcriptCollection } from '$lib/data/local-store';
	import type { LocalTranscript } from '$lib/data/local-store';
	import { toast } from 'svelte-sonner';
	import { CaretDown } from '@manacore/shared-icons';

	const transcripts = useLiveQuery(() => transcriptCollection.getAll({ isArchived: false }));

	let searchQuery = $state('');
	let expandedId = $state<string | null>(null);

	let filtered = $derived.by(() => {
		const all = transcripts.value ?? [];
		if (!searchQuery) return all;
		const q = searchQuery.toLowerCase();
		return all.filter(
			(t) =>
				t.title.toLowerCase().includes(q) ||
				t.transcript.toLowerCase().includes(q) ||
				t.channel?.toLowerCase().includes(q)
		);
	});

	async function deleteTranscript(t: LocalTranscript) {
		if (!confirm(`"${t.title}" löschen?`)) return;
		await transcriptCollection.delete(t.id);
		toast.success('Gelöscht');
	}

	function formatDuration(seconds: number | null | undefined): string {
		if (!seconds) return '';
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${String(s).padStart(2, '0')}`;
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Bibliothek</h1>
		<span class="text-sm text-gray-500">{filtered.length} Transkripte</span>
	</div>

	<input
		type="text"
		bind:value={searchQuery}
		placeholder="Transkripte durchsuchen..."
		class="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none"
	/>

	{#if transcripts.loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="h-20 animate-pulse rounded-xl bg-gray-800"></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="rounded-xl border-2 border-dashed border-gray-700 p-12 text-center">
			<p class="text-lg font-medium text-gray-400">Keine Transkripte</p>
			<p class="mt-1 text-sm text-gray-500">Transkribiere ein Video um zu starten.</p>
			<a
				href="/transcribe"
				class="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700"
				>Transkribieren</a
			>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filtered as t (t.id)}
				<div
					class="rounded-xl border border-gray-800 bg-gray-900 transition-all hover:border-gray-700"
				>
					<button
						onclick={() => (expandedId = expandedId === t.id ? null : t.id)}
						class="flex w-full items-center justify-between p-4 text-left"
					>
						<div class="min-w-0 flex-1">
							<h3 class="truncate font-semibold text-gray-100">{t.title}</h3>
							<div class="mt-1 flex items-center gap-3 text-xs text-gray-500">
								{#if t.channel}<span>{t.channel}</span>{/if}
								{#if t.duration}<span>{formatDuration(t.duration)}</span>{/if}
								<span>{t.language.toUpperCase()}</span>
							</div>
						</div>
						<CaretDown
							size={20}
							class="shrink-0 text-gray-500 transition-transform {expandedId === t.id
								? 'rotate-180'
								: ''}"
						/>
					</button>
					{#if expandedId === t.id}
						<div class="border-t border-gray-800 p-4">
							<pre
								class="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-gray-300">{t.transcript}</pre>
							<div class="mt-3 flex gap-2">
								<button
									onclick={() => {
										navigator.clipboard.writeText(t.transcript);
										toast.success('Kopiert!');
									}}
									class="rounded px-3 py-1 text-sm text-gray-400 hover:bg-gray-800">Kopieren</button
								>
								<button
									onclick={() => deleteTranscript(t)}
									class="rounded px-3 py-1 text-sm text-red-400 hover:bg-red-900/20">Löschen</button
								>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
