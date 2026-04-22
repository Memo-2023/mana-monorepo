<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useLiveQuery } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { sequencesStore } from '$lib/modules/moodlit/stores/sequences.svelte';
	import type { LocalMood, LocalSequence } from '$lib/modules/moodlit/types';
	import { toast } from '$lib/stores/toast.svelte';
	import { Trash } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	const sequences = useLiveQuery(() =>
		db
			.table<LocalSequence>('sequences')
			.toArray()
			.then((all) => all.filter((s) => !s.deletedAt))
	);
	const moods = useLiveQuery(() =>
		db
			.table<LocalMood>('moods')
			.toArray()
			.then((all) => all.filter((m) => !m.deletedAt))
	);

	let newName = $state('');
	let newDuration = $state(30);
	let showCreate = $state(false);

	async function createSequence() {
		if (!newName) return;
		const allMoods = moods.value ?? [];
		await sequencesStore.createSequence({
			name: newName,
			moodIds: allMoods.slice(0, 3).map((m) => m.id),
			duration: newDuration,
		});
		toast.success(`"${newName}" erstellt`);
		newName = '';
		showCreate = false;
	}

	async function deleteSequence(id: string, name: string) {
		if (!confirm(`"${name}" loschen?`)) return;
		await sequencesStore.deleteSequence(id);
		toast.success('Geloscht');
	}

	function getMoodName(moodId: string): string {
		return (moods.value ?? []).find((m) => m.id === moodId)?.name ?? moodId;
	}
</script>

<svelte:head>
	<title>Sequences - Moodlit - Mana</title>
</svelte:head>

<RoutePage appId="moodlit" backHref="/moodlit">
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
			<div class="mb-6 rounded-xl border border-border bg-card p-5">
				<div class="flex gap-3">
					<input
						type="text"
						bind:value={newName}
						placeholder="Name"
						class="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-foreground"
					/>
					<input
						type="number"
						bind:value={newDuration}
						min="5"
						max="300"
						class="w-20 rounded-lg border border-border bg-input px-3 py-2 text-foreground"
					/>
					<span class="self-center text-sm text-muted-foreground">Sek.</span>
					<button
						onclick={createSequence}
						disabled={!newName}
						class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
						>{$_('common.create')}</button
					>
				</div>
			</div>
		{/if}

		{#if !sequences.value?.length}
			<div class="rounded-xl border-2 border-dashed border-border p-12 text-center">
				<p class="text-lg font-medium text-muted-foreground">Keine Sequences</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Verkette mehrere Moods zu einer automatischen Sequenz.
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each sequences.value as seq (seq.id)}
					<div
						class="group rounded-xl border border-border bg-card p-4 hover:border-muted-foreground/30"
					>
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-semibold">{seq.name}</h3>
								<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
									{#each seq.moodIds as moodId}
										<span class="rounded bg-purple-500/20 px-2 py-0.5 text-purple-400"
											>{getMoodName(moodId)}</span
										>
									{/each}
									<span>· {seq.duration}s pro Mood</span>
								</div>
							</div>
							<button
								onclick={() => deleteSequence(seq.id, seq.name)}
								class="rounded p-1 text-muted-foreground opacity-0 hover:text-red-400 group-hover:opacity-100"
							>
								<Trash size={16} />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</RoutePage>
