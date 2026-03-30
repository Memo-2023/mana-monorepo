<script lang="ts">
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { moodCollection } from '$lib/data/local-store';
	import type { LocalMood } from '$lib/data/local-store';
	import { toast } from 'svelte-sonner';

	const moods = useLiveQuery(() => moodCollection.getAll());

	let showCreate = $state(false);
	let newName = $state('');
	let newColors = $state(['#7c3aed', '#a78bfa', '#c4b5fd']);
	let newAnimation = $state('gradient');
	let activeMood = $state<LocalMood | null>(null);

	async function createMood() {
		if (!newName) return;
		await moodCollection.insert({
			id: crypto.randomUUID(),
			name: newName,
			colors: newColors,
			animation: newAnimation,
			isDefault: false,
		});
		toast.success(`"${newName}" erstellt`);
		newName = '';
		showCreate = false;
	}

	async function deleteMood(mood: LocalMood) {
		if (mood.isDefault) {
			toast.error('Standard-Moods können nicht gelöscht werden');
			return;
		}
		await moodCollection.delete(mood.id);
		if (activeMood?.id === mood.id) activeMood = null;
		toast.success('Gelöscht');
	}

	function activateMood(mood: LocalMood) {
		activeMood = activeMood?.id === mood.id ? null : mood;
	}
</script>

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
		<div class="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-300">Name</label>
					<input
						type="text"
						bind:value={newName}
						placeholder="Mein Mood"
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-300">Animation</label>
					<select
						bind:value={newAnimation}
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100"
					>
						<option value="gradient">Gradient</option>
						<option value="pulse">Pulse</option>
						<option value="wave">Wave</option>
						<option value="flicker">Flicker</option>
						<option value="aurora">Aurora</option>
					</select>
				</div>
				<div class="md:col-span-2">
					<label class="mb-1 block text-sm font-medium text-gray-300">Farben</label>
					<div class="flex gap-2">
						{#each newColors as color, i}
							<input
								type="color"
								bind:value={newColors[i]}
								class="h-10 w-14 cursor-pointer rounded border border-gray-700"
							/>
						{/each}
						<button
							onclick={() => (newColors = [...newColors, '#ffffff'])}
							class="rounded border border-gray-700 px-3 text-sm text-gray-400 hover:bg-gray-800"
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
				>Erstellen</button
			>
		</div>
	{/if}

	{#if moods.loading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-xl bg-gray-800"></div>
			{/each}
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each moods.value ?? [] as mood (mood.id)}
				<button
					onclick={() => activateMood(mood)}
					class="group relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all hover:scale-[1.02] {activeMood?.id ===
					mood.id
						? 'border-white shadow-lg shadow-purple-500/20'
						: 'border-gray-800 hover:border-gray-700'}"
					style="background: linear-gradient(135deg, {mood.colors.map((c) => c + '40').join(', ')})"
				>
					<h3 class="text-lg font-bold text-white">{mood.name}</h3>
					<p class="mt-1 text-xs text-gray-400">{mood.animation}</p>
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
							class="absolute right-2 top-2 rounded-full p-1 text-gray-500 opacity-0 hover:bg-gray-800 hover:text-red-400 group-hover:opacity-100"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/></svg
							>
						</button>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
