<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { moodTable } from '$lib/modules/moodlit/collections';
	import { moodsStore } from '$lib/modules/moodlit/stores/moods.svelte';
	import type { LocalMood } from '$lib/modules/moodlit/types';
	import { db } from '$lib/data/database';
	import { toast } from '$lib/stores/toast.svelte';
	import { X } from '@manacore/shared-icons';

	const moods = useLiveQuery(() =>
		db
			.table<LocalMood>('moods')
			.toArray()
			.then((all) => all.filter((m) => !m.deletedAt))
	);

	let showCreate = $state(false);
	let newName = $state('');
	let newColors = $state(['#7c3aed', '#a78bfa', '#c4b5fd']);
	let newAnimation = $state('gradient');
	let activeMood = $state<LocalMood | null>(null);

	async function createMood() {
		if (!newName) return;
		await moodsStore.createMood({
			name: newName,
			colors: newColors,
			animation: newAnimation,
		});
		toast.success(`"${newName}" erstellt`);
		newName = '';
		showCreate = false;
	}

	async function deleteMood(mood: LocalMood) {
		if (mood.isDefault) {
			toast.error('Standard-Moods konnen nicht geloscht werden');
			return;
		}
		await moodsStore.deleteMood(mood.id);
		if (activeMood?.id === mood.id) activeMood = null;
		toast.success('Geloscht');
	}

	function activateMood(mood: LocalMood) {
		activeMood = activeMood?.id === mood.id ? null : mood;
	}
</script>

<svelte:head>
	<title>Moods - Moodlit - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Moods</h1>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
		>
			{showCreate ? 'Schliessen' : '+ Neues Mood'}
		</button>
	</div>

	<!-- Active Mood Display -->
	{#if activeMood}
		<div
			class="mb-6 overflow-hidden rounded-2xl p-8 text-center transition-all duration-1000"
			style="background: linear-gradient(135deg, {activeMood.colors.join(', ')})"
		>
			<h2 class="text-4xl font-bold text-white drop-shadow-lg">{activeMood.name}</h2>
			<p class="mt-2 text-white/70">{activeMood.animation}</p>
			<button
				onclick={() => (activeMood = null)}
				class="mt-4 rounded-lg bg-white/20 px-4 py-2 text-sm text-white backdrop-blur hover:bg-white/30"
				>Stoppen</button
			>
		</div>
	{/if}

	{#if showCreate}
		<div class="mb-6 rounded-xl border border-border bg-card p-6">
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium text-muted-foreground">Name</label>
					<input
						type="text"
						bind:value={newName}
						placeholder="Mein Mood"
						class="w-full rounded-lg border border-border bg-input px-4 py-2 text-foreground"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-muted-foreground">Animation</label>
					<select
						bind:value={newAnimation}
						class="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground"
					>
						<option value="gradient">Gradient</option>
						<option value="pulse">Pulse</option>
						<option value="wave">Wave</option>
						<option value="flicker">Flicker</option>
						<option value="aurora">Aurora</option>
					</select>
				</div>
				<div class="md:col-span-2">
					<label class="mb-1 block text-sm font-medium text-muted-foreground">Farben</label>
					<div class="flex gap-2">
						{#each newColors as color, i}
							<input
								type="color"
								bind:value={newColors[i]}
								class="h-10 w-14 cursor-pointer rounded border border-border"
							/>
						{/each}
						<button
							onclick={() => (newColors = [...newColors, '#ffffff'])}
							class="rounded border border-border px-3 text-sm text-muted-foreground hover:bg-muted"
							>+</button
						>
					</div>
				</div>
			</div>
			<div
				class="mt-2 h-4 rounded-full"
				style="background: linear-gradient(90deg, {newColors.join(', ')})"
			></div>
			<button
				onclick={createMood}
				disabled={!newName}
				class="mt-4 rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
				>{$_('common.create')}</button
			>
		</div>
	{/if}

	{#if moods.loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-xl bg-muted"></div>
			{/each}
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each moods.value ?? [] as mood (mood.id)}
				<button
					onclick={() => activateMood(mood)}
					class="group relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all hover:scale-[1.02] {activeMood?.id ===
					mood.id
						? 'border-primary shadow-lg shadow-purple-500/20'
						: 'border-border hover:border-muted-foreground/30'}"
					style="background: linear-gradient(135deg, {mood.colors.map((c) => c + '40').join(', ')})"
				>
					<h3 class="text-lg font-bold text-foreground">{mood.name}</h3>
					<p class="mt-1 text-xs text-muted-foreground">{mood.animation}</p>
					<div class="mt-3 flex gap-1">
						{#each mood.colors as color}
							<div class="h-4 w-4 rounded-full" style="background: {color}"></div>
						{/each}
					</div>
					{#if !mood.isDefault}
						<button
							onclick={(e) => {
								e.stopPropagation();
								deleteMood(mood);
							}}
							class="absolute right-2 top-2 rounded-full p-1 text-muted-foreground opacity-0 hover:bg-muted hover:text-red-400 group-hover:opacity-100"
						>
							<X size={16} />
						</button>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
