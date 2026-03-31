<script lang="ts">
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { sequenceCollection, moodCollection } from '$lib/data/local-store';
	import { toast } from 'svelte-sonner';
	import { Trash } from '@manacore/shared-icons';

	const sequences = useLiveQuery(() => sequenceCollection.getAll());
	const moods = useLiveQuery(() => moodCollection.getAll());

	let newName = $state('');
	let newDuration = $state(30);
	let showCreate = $state(false);

	async function createSequence() {
		if (!newName) return;
		const allMoods = moods.value ?? [];
		await sequenceCollection.insert({
			id: crypto.randomUUID(),
			name: newName,
			moodIds: allMoods.slice(0, 3).map((m) => m.id),
			duration: newDuration,
		});
		toast.success(`"${newName}" erstellt`);
		newName = '';
		showCreate = false;
	}

	async function deleteSequence(id: string, name: string) {
		if (!confirm(`"${name}" löschen?`)) return;
		await sequenceCollection.delete(id);
		toast.success('Gelöscht');
	}

	function getMoodName(moodId: string): string {
		return (moods.value ?? []).find((m) => m.id === moodId)?.name ?? moodId;
	}
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Sequences</h1>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
		>
			{showCreate ? 'Schliessen' : '+ Neue Sequence'}
		</button>
	</div>

	{#if showCreate}
		<div class="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
			<div class="flex gap-3">
				<input
					type="text"
					bind:value={newName}
					placeholder="Name"
					class="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100"
				/>
				<input
					type="number"
					bind:value={newDuration}
					min="5"
					max="300"
					class="w-20 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100"
				/>
				<span class="self-center text-sm text-gray-500">Sek.</span>
				<button
					onclick={createSequence}
					disabled={!newName}
					class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
					>Erstellen</button
				>
			</div>
		</div>
	{/if}

	{#if !sequences.value?.length}
		<div class="rounded-xl border-2 border-dashed border-gray-700 p-12 text-center">
			<p class="text-lg font-medium text-gray-400">Keine Sequences</p>
			<p class="mt-1 text-sm text-gray-500">
				Verkette mehrere Moods zu einer automatischen Sequenz.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each sequences.value as seq (seq.id)}
				<div class="group rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-semibold">{seq.name}</h3>
							<div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
								{#each seq.moodIds as moodId}
									<span class="rounded bg-purple-900/50 px-2 py-0.5 text-purple-300"
										>{getMoodName(moodId)}</span
									>
								{/each}
								<span>· {seq.duration}s pro Mood</span>
							</div>
						</div>
						<button
							onclick={() => deleteSequence(seq.id, seq.name)}
							class="rounded p-1 text-gray-500 opacity-0 hover:text-red-400 group-hover:opacity-100"
						>
							<Trash size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
